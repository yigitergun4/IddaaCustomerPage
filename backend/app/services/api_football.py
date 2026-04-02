"""
APIFootballService — backward-compatible adapter over the new FixtureService.

This module preserves the existing call-sites (background task in main.py,
matches router) while delegating all real work to the properly separated
`FixtureService` + `APIFootballClient` stack.

Old code called:
    service = APIFootballService()
    await service.fetch_and_store_daily_fixtures(db, date_str)

That contract is kept intact here.
"""

from __future__ import annotations

import logging
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.api_football_client import APIFootballClient, APIFootballError
from app.config import get_settings
from app.services.fixture_service import FixtureService

logger = logging.getLogger(__name__)


class APIFootballService:
    """
    Facade that maintains backward compatibility with existing call-sites.

    All rate-limit-safe caching logic lives in :class:`FixtureService`.
    This class simply instantiates the right collaborators and delegates.
    """

    def __init__(self) -> None:
        self.settings = get_settings()

    async def fetch_and_store_daily_fixtures(self, db: AsyncSession, date: str) -> bool:
        """
        Ensure today's fixtures are in the local DB (cache-first).

        Returns True on success, False if the live API call fails.
        """
        client = APIFootballClient()
        service = FixtureService(client=client)

        try:
            matches = await service.get_todays_fixtures(db)
            logger.info(
                "[APIFootballService] %d fixtures ready for %s.",
                len(matches),
                date,
            )
            return True
        except APIFootballError as exc:
            logger.error("[APIFootballService] Live fetch failed: %s", exc)
            # Do NOT crash the app — serve stale data if available
            return False
        except Exception as exc:
            logger.exception("[APIFootballService] Unexpected error: %s", exc)
            return False
