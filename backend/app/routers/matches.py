from datetime import datetime
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.routers.users import get_current_user
from app.services.sportmonks import SportMonksService
from app.schemas.user import MatchResponse, OddsResponse, StatsResponse

router = APIRouter(prefix="/api/matches", tags=["matches"])


@router.get("/", response_model=list[MatchResponse])
async def get_matches(
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    include_premium: bool = Query(False, description="Include xG and predictions (requires verification)"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get Turkey Super Lig matches for a given date.
    
    Uses caching: checks DB first, fetches from API only if needed.
    Premium content (xG, predictions) is only included if user is verified.
    """
    if date is None:
        date = datetime.now().strftime("%Y-%m-%d")
    
    service = SportMonksService()
    matches = await service.fetch_turkey_super_lig_fixtures(db, date)
    
    response = []
    for match in matches:
        match_data = MatchResponse(
            id=match.id,
            fixture_id=match.fixture_id,
            home_team=match.home_team,
            home_team_logo=match.home_team_logo,
            away_team=match.away_team,
            away_team_logo=match.away_team_logo,
            start_time=match.start_time,
            league_name=match.league_name,
            status=match.status,
            home_score=match.home_score,
            away_score=match.away_score,
            odds=OddsResponse.model_validate(match.odds) if match.odds else None,
            stats=None  # Premium content - handled separately
        )
        response.append(match_data)
    
    return response


@router.get("/premium", response_model=list[MatchResponse])
async def get_matches_premium(
    current_user: Annotated[User, Depends(get_current_user)],
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get matches with premium content (xG, predictions).
    
    Requires user to be verified (have valid dealer member ID).
    """
    if not current_user.is_verified:
        # Return matches without premium content
        return await get_matches(date=date, include_premium=False, db=db)
    
    if date is None:
        date = datetime.now().strftime("%Y-%m-%d")
    
    service = SportMonksService()
    matches = await service.fetch_turkey_super_lig_fixtures(db, date)
    
    response = []
    for match in matches:
        match_data = MatchResponse(
            id=match.id,
            fixture_id=match.fixture_id,
            home_team=match.home_team,
            home_team_logo=match.home_team_logo,
            away_team=match.away_team,
            away_team_logo=match.away_team_logo,
            start_time=match.start_time,
            league_name=match.league_name,
            status=match.status,
            home_score=match.home_score,
            away_score=match.away_score,
            odds=OddsResponse.model_validate(match.odds) if match.odds else None,
            stats=StatsResponse.model_validate(match.stats) if match.stats else None
        )
        response.append(match_data)
    
    return response


@router.get("/{fixture_id}", response_model=MatchResponse)
async def get_match_by_fixture(
    fixture_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific match by fixture ID."""
    from sqlalchemy import select
    from app.models.match import Match
    
    stmt = select(Match).where(Match.fixture_id == fixture_id)
    result = await db.execute(stmt)
    match = result.scalar_one_or_none()
    
    if not match:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maç bulunamadı."
        )
    
    return MatchResponse(
        id=match.id,
        fixture_id=match.fixture_id,
        home_team=match.home_team,
        home_team_logo=match.home_team_logo,
        away_team=match.away_team,
        away_team_logo=match.away_team_logo,
        start_time=match.start_time,
        league_name=match.league_name,
        status=match.status,
        home_score=match.home_score,
        away_score=match.away_score,
        odds=OddsResponse.model_validate(match.odds) if match.odds else None,
        stats=None  # Public endpoint - no premium content
    )


@router.get("/standings/turkey")
async def get_turkey_standings():
    """
    Get Turkey Super Lig standings (league table).
    
    Returns current season standings with:
    - Position, Team name, Played, Won, Drawn, Lost
    - Goals For, Goals Against, Goal Difference, Points
    """
    service = SportMonksService()
    standings = await service.fetch_standings()
    return {"data": standings}
