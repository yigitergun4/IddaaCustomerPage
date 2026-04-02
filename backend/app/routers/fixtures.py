"""
Fixtures router — exposes the `/api/fixtures/today` endpoint.

This router is the FastAPI entry point as requested. It delegates all
heavy lifting to `FixtureService` (cache-first, rate-limit safe).
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.api_football_client import APIFootballClient
from app.database import get_db
from app.models.user import User
from app.routers.users import get_current_user
from app.schemas.user import MatchResponse
from app.services.fixture_service import FixtureService

router = APIRouter(prefix="/api/fixtures", tags=["fixtures"])


@router.get(
    "/today",
    response_model=list[MatchResponse],
    summary="Today's Super Lig Fixtures",
    description=(
        "Returns today's Turkey Super Lig (League 203) fixtures. "
        "Results are served from local cache when possible. "
        "API-Football is only called once per day (rate-limit safe)."
    ),
)
async def get_todays_fixtures(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
) -> list[MatchResponse]:
    """
    Cache-first endpoint for today's Super Lig fixtures.

    **Flow:**
    1. Query local DB for today's league-203 fixtures.
    2. If found → return immediately (no API call).
    3. If missing → call API-Football, persist, return.
    """
    client = APIFootballClient()
    service = FixtureService(client=client)
    matches = await service.get_todays_fixtures(db)
    return [MatchResponse.model_validate(m) for m in matches]
