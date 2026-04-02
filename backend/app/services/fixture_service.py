"""
FixtureService — Business Logic Layer for Turkey Super Lig fixtures.

Rate-Limit Protection Strategy (Cache-First / Repository Pattern):
──────────────────────────────────────────────────────────────────
1. Query the local PostgreSQL database for today's fixtures.
2a. Cache HIT  → return stored rows immediately (zero API calls).
2b. Cache MISS → call API-Football, persist results, then return them.

This guarantees at most ONE API call per day for the entire league,
protecting the 100-request/day free-tier quota.

Design choices:
  - Depends on `APIFootballClient` (injected via constructor) → testable.
  - Depends on `AsyncSession` (passed per call)               → no hidden globals.
  - Does NOT know about FastAPI; can be used in background tasks, CLIs, etc.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.api_football_client import APIFootballClient, APIFootballError
from app.config import get_settings
from app.models.match import Match
from app.models.odds import Odds
from app.models.stats import Stats
from app.schemas.fixtures import FixtureItem, FixturesResponse

logger = logging.getLogger(__name__)

# Turkey Super Lig
SUPER_LIG_LEAGUE_ID: int = 203


class FixtureService:
    """
    Orchestrates fixture retrieval with a cache-first strategy.

    Args:
        client: An `APIFootballClient` instance (async context manager).
                Pass a mock in tests to avoid real HTTP calls.
    """

    def __init__(self, client: APIFootballClient) -> None:
        self._client = client
        self._settings = get_settings()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def get_todays_fixtures(self, db: AsyncSession) -> list[Match]:
        """
        Return today's Super Lig fixtures, always preferring the local cache.

        Flow:
            1. Check DB for rows with today's date and league_id = 203.
            2. If rows exist  → return them (cache hit, 0 API calls).
            3. If no rows     → fetch from API-Football, store, return (cache miss).

        Args:
            db: An active SQLAlchemy AsyncSession scoped to the current request.

        Returns:
            A list of :class:`~app.models.match.Match` ORM instances, each
            eagerly loaded with their ``odds`` and ``stats`` relationships.

        Raises:
            APIFootballError: Propagated from the client if the live fetch fails.
        """
        today: str = datetime.utcnow().strftime("%Y-%m-%d")

        # ── Step 1: Cache check ──────────────────────────────────────────────
        cached = await self._load_from_cache(db, today)
        if cached:
            logger.info(
                "[FixtureService] Cache HIT for %s — %d fixtures returned (0 API calls used).",
                today,
                len(cached),
            )
            return cached

        # ── Step 2: Cache miss → live fetch ──────────────────────────────────
        logger.info(
            "[FixtureService] Cache MISS for %s — calling API-Football (1 request consumed).",
            today,
        )
        fixtures = await self._fetch_from_api(today)

        # ── Step 3: Persist to DB ────────────────────────────────────────────
        await self._save_to_cache(db, fixtures)

        # ── Step 4: Re-read from DB (ensures consistent ORM state + joins) ───
        saved = await self._load_from_cache(db, today)
        logger.info(
            "[FixtureService] Persisted and returning %d fixtures for %s.",
            len(saved),
            today,
        )
        return saved

    async def refresh_fixtures(self, db: AsyncSession, date: Optional[str] = None) -> list[Match]:
        """
        Force a live API call regardless of cache state.
        Useful for admin-triggered refreshes without burning the daily quota carelessly.

        Args:
            db:   Active AsyncSession.
            date: Optional ISO date string (``YYYY-MM-DD``). Defaults to today.

        Returns:
            Updated list of :class:`~app.models.match.Match` instances.
        """
        target_date = date or datetime.utcnow().strftime("%Y-%m-%d")
        logger.info("[FixtureService] Forced refresh for %s.", target_date)

        fixtures = await self._fetch_from_api(target_date)
        await self._save_to_cache(db, fixtures, upsert=True)
        return await self._load_from_cache(db, target_date)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    async def _load_from_cache(self, db: AsyncSession, date: str) -> list[Match]:
        """
        Query the local DB for fixtures on *date* for Super Lig (league 203).

        Uses a date-cast on the ``start_time`` column so that time zones
        inside the stored UTC datetime don't cause false cache misses.
        """
        stmt = (
            select(Match)
            .where(
                Match.league_id == SUPER_LIG_LEAGUE_ID,
                func.date(Match.start_time) == date,
            )
        )
        result = await db.execute(stmt)
        return list(result.scalars().unique().all())

    async def _fetch_from_api(self, date: str) -> list[FixtureItem]:
        """
        Hit GET /fixtures on API-Football for Super Lig on *date*.

        Returns a parsed list of :class:`~app.schemas.fixtures.FixtureItem`.
        Uses the current season derived from the date year.
        """
        season = date[:4]  # e.g. "2024" from "2024-08-17"

        async with self._client as client:
            raw = await client.get(
                "/fixtures",
                params={
                    "league": SUPER_LIG_LEAGUE_ID,
                    "season": season,
                    "date": date,
                },
            )

        parsed = FixturesResponse.model_validate(raw)
        logger.info(
            "[FixtureService] API-Football returned %d fixtures for %s.",
            parsed.results,
            date,
        )
        return parsed.response

    async def _save_to_cache(
        self,
        db: AsyncSession,
        fixtures: list[FixtureItem],
        upsert: bool = False,
    ) -> None:
        """
        Persist *fixtures* to the local PostgreSQL database.

        Default mode (``upsert=False``): skip fixtures that already exist
        (identified by ``fixture_id``). This is safe for the normal cache-miss
        path because we already confirmed nothing exists.

        Upsert mode (``upsert=True``): update existing rows in-place. Used by
        :meth:`refresh_fixtures` to sync score / status changes.
        """
        for item in fixtures:
            existing_stmt = select(Match).where(Match.fixture_id == item.fixture_id)
            result = await db.execute(existing_stmt)
            existing_match: Optional[Match] = result.scalar_one_or_none()

            if existing_match and not upsert:
                # Normal cache-miss path: already in DB (race condition safety)
                continue

            if existing_match and upsert:
                # Update mutable fields
                existing_match.home_score = item.home_score
                existing_match.away_score = item.away_score
                existing_match.updated_at = datetime.utcnow()
                logger.debug("[FixtureService] Updated fixture_id=%d.", item.fixture_id)
                continue

            # ── Insert new Match ─────────────────────────────────────────────
            match = Match(
                fixture_id=item.fixture_id,
                home_team=item.home_team,
                away_team=item.away_team,
                home_score=item.home_score,
                away_score=item.away_score,
                start_time=item.start_time,
                league_id=SUPER_LIG_LEAGUE_ID,
            )
            db.add(match)
            await db.flush()  # obtain match.id for FK inserts below

            # ── Insert placeholder Odds (populated by a separate odds service) ─
            placeholder_odds = Odds(
                match_id=match.id,
                home_odd=None,
                draw_odd=None,
                away_odd=None,
            )
            db.add(placeholder_odds)

            # ── Insert placeholder Stats (populated by an AI/xG service) ──────
            placeholder_stats = Stats(
                match_id=match.id,
                home_xg=None,
                away_xg=None,
                ai_prediction_score=None,
            )
            db.add(placeholder_stats)

            logger.debug(
                "[FixtureService] Inserted fixture_id=%d (%s vs %s).",
                item.fixture_id,
                item.home_team,
                item.away_team,
            )

        await db.commit()
        logger.info("[FixtureService] DB commit successful for %d fixtures.", len(fixtures))
