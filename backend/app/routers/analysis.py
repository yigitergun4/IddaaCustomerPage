"""
Analysis router — exposes match-analysis endpoints.

Endpoints:
  GET /api/analysis/fixture/{fixture_id}
      Full analysis report for a specific upcoming fixture.

  GET /api/analysis/tomorrow
      Analyses for ALL of tomorrow's Super Lig matches.
      (1 + 4N API calls — best called once per day by a scheduler.)
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.api_football_client import APIFootballClient, APIFootballError
from app.config import get_settings
from app.database import get_db
from app.models.user import User
from app.routers.users import get_current_user
from app.schemas.analysis import MatchAnalysisReport
from app.services.analysis_service import MatchAnalysisService

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

SUPER_LIG_LEAGUE_ID = 203
SUPER_LIG_SEASON    = 2024   # update each season


def _get_service() -> MatchAnalysisService:
    """FastAPI dependency — creates a MatchAnalysisService with a fresh client."""
    return MatchAnalysisService(client=APIFootballClient())


@router.get(
    "/fixture/{fixture_id}",
    response_model=MatchAnalysisReport,
    summary="Full Analysis for a Specific Fixture",
    description=(
        "Returns a complete pre-match analysis report for the given fixture ID. "
        "Uses an in-memory cache — the first call costs 4 API requests; "
        "subsequent calls are free."
    ),
)
async def analyse_fixture(
    fixture_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    league_id: int = Query(SUPER_LIG_LEAGUE_ID, description="League ID (default: 203 = Super Lig)"),
    season: int    = Query(SUPER_LIG_SEASON,    description="Season year (default: 2024)"),
    service: MatchAnalysisService = Depends(_get_service),
) -> MatchAnalysisReport:
    """
    Full match analysis for a given fixture.

    **Budget:** 4 API requests on first call (cached thereafter).
    """
    try:
        return await service.analyse(
            fixture_id=fixture_id,
            league_id=league_id,
            season=season,
        )
    except APIFootballError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"API-Football error: {exc}",
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.get(
    "/tomorrow",
    response_model=list[MatchAnalysisReport],
    summary="Analysis for All of Tomorrow's Super Lig Matches",
    description=(
        "Fetches and analyses every fixture scheduled for tomorrow in Turkey Super Lig. "
        "Best triggered once per day (e.g. by a nightly cron job) to conserve API quota. "
        "Budget: 1 + 4 × N requests where N = number of matches."
    ),
)
async def analyse_tomorrow(
    current_user: Annotated[User, Depends(get_current_user)],
    league_id: int = Query(SUPER_LIG_LEAGUE_ID, description="League ID"),
    season: int    = Query(SUPER_LIG_SEASON,    description="Season year"),
    service: MatchAnalysisService = Depends(_get_service),
) -> list[MatchAnalysisReport]:
    """
    Bulk analysis for tomorrow's entire matchday.

    Results are cached in memory — safe to hit multiple times.
    """
    try:
        return await service.get_tomorrows_analyses(league_id=league_id, season=season)
    except APIFootballError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"API-Football error: {exc}",
        ) from exc
