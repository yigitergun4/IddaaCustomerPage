"""
MatchAnalysisService — Business Logic Layer for pre-match analysis.

Responsibility (Single Responsibility Principle):
  Orchestrate three API calls (team stats home, team stats away, H2H, predictions)
  and distil them into a single structured MatchAnalysisReport.

Rate-Limit Budget per analysis call:
  - GET /teams/statistics  ×2  (home + away)
  - GET /fixtures/headtohead  ×1
  - GET /predictions          ×1
  Total = 4 requests per match.

Cache strategy:
  Results are stored in an in-memory dict keyed by fixture_id.
  In production this would be Redis or a DB table with a TTL column.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

from app.clients.api_football_client import APIFootballClient, APIFootballError
from app.schemas.analysis import (
    ComparisonData,
    FixtureItem,
    FixturesApiResponse,
    HeadToHeadRecord,
    MatchAnalysisReport,
    PredictionsApiResponse,
    TeamAnalysis,
    TeamStatsApiResponse,
)

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# In-memory cache  {fixture_id: MatchAnalysisReport}
# Replace with Redis / DB-backed cache in production.
# ─────────────────────────────────────────────────────────────────────────────
_ANALYSIS_CACHE: dict[int, MatchAnalysisReport] = {}


class MatchAnalysisService:
    """
    Fetches and assembles a full pre-match analysis report.

    Constructor injects an ``APIFootballClient`` so the service is
    fully testable with a mock client (Open/Closed Principle).

    Usage:
        async with APIFootballClient() as client:
            svc    = MatchAnalysisService(client)
            report = await svc.analyse(fixture_id=1035098, league_id=203, season=2024)
    """

    def __init__(self, client: APIFootballClient) -> None:
        self._client = client

    # ─────────────────────────────────────────────────────────────────────────
    # Public API
    # ─────────────────────────────────────────────────────────────────────────

    async def analyse(
        self,
        fixture_id: int,
        league_id: int,
        season: int,
    ) -> MatchAnalysisReport:
        """
        Return a full MatchAnalysisReport for *fixture_id*.

        Cache-first: if we already analysed this fixture today, return the
        cached result without spending any API requests.

        Args:
            fixture_id: API-Football fixture ID.
            league_id:  League ID (e.g. 203 for Super Lig).
            season:     Season year (e.g. 2024).

        Returns:
            A fully populated :class:`MatchAnalysisReport`.

        Raises:
            APIFootballError: If any live API call fails.
            ValueError:       If the fixture_id is not found.
        """
        # ── Cache check ────────────────────────────────────────────────────
        if fixture_id in _ANALYSIS_CACHE:
            logger.info("[AnalysisService] Cache HIT for fixture %d (0 API calls).", fixture_id)
            return _ANALYSIS_CACHE[fixture_id]

        logger.info("[AnalysisService] Cache MISS for fixture %d — fetching (4 API calls).", fixture_id)

        # ── Step 1: Get fixture info (needed for team IDs) ─────────────────
        fixture = await self._fetch_fixture(fixture_id)

        home_team = fixture.teams.home
        away_team = fixture.teams.away

        # ── Steps 2-3: Team stats (parallel opportunity — kept sequential
        #               here to stay within free-tier burst limits) ─────────
        home_stats = await self._fetch_team_stats(home_team.id, league_id, season)
        away_stats = await self._fetch_team_stats(away_team.id, league_id, season)

        # ── Step 4: H2H ───────────────────────────────────────────────────
        h2h_record = await self._fetch_h2h(home_team.id, away_team.id)

        # ── Step 5: Predictions ───────────────────────────────────────────
        prediction, comparison = await self._fetch_predictions(fixture_id)

        # ── Assemble report ───────────────────────────────────────────────
        report = MatchAnalysisReport(
            fixture_id=fixture_id,
            home_team=home_team.name,
            away_team=away_team.name,
            kick_off=fixture.fixture.date,
            league=fixture.league.name,
            round=fixture.league.round,
            home_team_analysis=self._build_team_analysis(home_stats, home_team.id, home_team.name),
            away_team_analysis=self._build_team_analysis(away_stats, away_team.id, away_team.name),
            head_to_head=h2h_record,
            prediction_advice=prediction.advice if prediction else None,
            prediction_winner=prediction.winner.name if prediction and prediction.winner else None,
            prediction_percent=prediction.percent if prediction else None,
            under_over=prediction.under_over if prediction else None,
            comparison=self._comparison_to_dict(comparison) if comparison else None,
        )

        # ── Persist to cache ──────────────────────────────────────────────
        _ANALYSIS_CACHE[fixture_id] = report
        logger.info("[AnalysisService] Report cached for fixture %d.", fixture_id)
        return report

    async def get_tomorrows_analyses(
        self,
        league_id: int,
        season: int,
    ) -> list[MatchAnalysisReport]:
        """
        Fetch and analyse all fixtures scheduled for tomorrow in *league_id*.

        Costs: 1 (fixtures list) + 4 × N requests where N = number of matches.
        For a typical Super Lig matchday (4-5 games): ~17-21 requests total.

        Returns:
            List of :class:`MatchAnalysisReport`, one per fixture.
        """
        from datetime import timedelta
        tomorrow = (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d")
        logger.info("[AnalysisService] Fetching tomorrow's fixtures for league %d on %s.", league_id, tomorrow)

        raw = await self._client.get(
            "/fixtures",
            params={"league": league_id, "season": season, "date": tomorrow},
        )
        fixtures_resp = FixturesApiResponse.model_validate(raw)

        if not fixtures_resp.response:
            logger.info("[AnalysisService] No fixtures for %s.", tomorrow)
            return []

        logger.info("[AnalysisService] Found %d fixtures — analysing each.", fixtures_resp.results)

        reports: list[MatchAnalysisReport] = []
        for item in fixtures_resp.response:
            try:
                report = await self.analyse(item.fixture_id, league_id, season)
                reports.append(report)
            except (APIFootballError, ValueError) as exc:
                logger.warning("[AnalysisService] Skipping fixture %d: %s", item.fixture_id, exc)
                continue

        return reports

    # ─────────────────────────────────────────────────────────────────────────
    # Private helpers — each owns exactly one API call
    # ─────────────────────────────────────────────────────────────────────────

    async def _fetch_fixture(self, fixture_id: int) -> FixtureItem:
        """GET /fixtures?id=<fixture_id>  →  FixtureItem"""
        raw = await self._client.get("/fixtures", params={"id": fixture_id})
        resp = FixturesApiResponse.model_validate(raw)
        if not resp.response:
            raise ValueError(f"Fixture {fixture_id} not found in API-Football.")
        return resp.response[0]

    async def _fetch_team_stats(
        self, team_id: int, league_id: int, season: int
    ) -> TeamStatsApiResponse:
        """GET /teams/statistics  →  TeamStatsApiResponse"""
        raw = await self._client.get(
            "/teams/statistics",
            params={"team": team_id, "league": league_id, "season": season},
        )
        return TeamStatsApiResponse.model_validate(raw)

    async def _fetch_h2h(self, home_id: int, away_id: int) -> HeadToHeadRecord:
        """GET /fixtures/headtohead  →  HeadToHeadRecord"""
        raw = await self._client.get(
            "/fixtures/headtohead",
            params={"h2h": f"{home_id}-{away_id}", "last": 10},
        )
        fixtures_resp = FixturesApiResponse.model_validate(raw)
        matches = fixtures_resp.response

        home_wins = away_wins = draws = h_goals = a_goals = 0
        summaries: list[str] = []

        for m in matches:
            hg = m.goals.home or 0
            ag = m.goals.away or 0
            h_goals += hg
            a_goals += ag

            hn = m.teams.home.name
            an = m.teams.away.name
            status = m.fixture.status.short

            if status == "FT":
                if hg > ag:
                    home_wins += 1
                elif ag > hg:
                    away_wins += 1
                else:
                    draws += 1

            summaries.append(f"{hn} {hg}-{ag} {an} [{status}]")

        return HeadToHeadRecord(
            total_matches=len(matches),
            home_wins=home_wins,
            away_wins=away_wins,
            draws=draws,
            home_goals_scored=h_goals,
            away_goals_scored=a_goals,
            last_matches=summaries[:5],  # show last 5 in the report
        )

    async def _fetch_predictions(
        self, fixture_id: int
    ) -> tuple[object | None, ComparisonData | None]:
        """GET /predictions  →  (PredictionDetail, ComparisonData)"""
        raw = await self._client.get("/predictions", params={"fixture": fixture_id})
        resp = PredictionsApiResponse.model_validate(raw)
        if not resp.response:
            logger.warning("[AnalysisService] No predictions for fixture %d.", fixture_id)
            return None, None
        item = resp.response[0]
        return item.predictions, item.comparison

    # ─────────────────────────────────────────────────────────────────────────
    # Static transformers
    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def _build_team_analysis(
        resp: TeamStatsApiResponse,
        team_id: int,
        team_name: str,
    ) -> TeamAnalysis:
        """Convert raw TeamStatsApiResponse into a clean TeamAnalysis."""
        ts = resp.response
        if not ts:
            return TeamAnalysis(
                team_id=team_id,
                team_name=team_name,
                league_form=None,
                avg_goals_scored_home=None,
                avg_goals_scored_away=None,
                avg_goals_conceded_home=None,
                avg_goals_conceded_away=None,
                clean_sheets_total=None,
                failed_to_score_total=None,
            )

        def _to_float(val: str | None) -> float | None:
            try:
                return float(val) if val else None
            except (ValueError, TypeError):
                return None

        fg = ts.goals.for_goals.average
        ag = ts.goals.against.average

        return TeamAnalysis(
            team_id=ts.team.id,
            team_name=ts.team.name,
            league_form=ts.form,
            avg_goals_scored_home=_to_float(fg.home),
            avg_goals_scored_away=_to_float(fg.away),
            avg_goals_conceded_home=_to_float(ag.home),
            avg_goals_conceded_away=_to_float(ag.away),
            clean_sheets_total=ts.clean_sheet.total,
            failed_to_score_total=ts.failed_to_score.total,
        )

    @staticmethod
    def _comparison_to_dict(comp: ComparisonData) -> dict:
        """Flatten ComparisonData into a serialisable dict for the frontend."""
        return {
            "form":                 {"home": comp.form.home,                 "away": comp.form.away},
            "attack":               {"home": comp.att.home,                  "away": comp.att.away},
            "defence":              {"home": comp.def_.home,                 "away": comp.def_.away},
            "poisson_distribution": {"home": comp.poisson_distribution.home, "away": comp.poisson_distribution.away},
            "h2h":                  {"home": comp.h2h.home,                  "away": comp.h2h.away},
            "goals":                {"home": comp.goals.home,                "away": comp.goals.away},
            "total":                {"home": comp.total.home,                "away": comp.total.away},
        }
