from datetime import datetime
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.match import Match
from app.routers.users import get_current_user
from app.schemas.user import MatchResponse
from app.services.api_football import APIFootballService

router = APIRouter(prefix="/api/matches", tags=["matches"])


@router.get("/", response_model=list[MatchResponse])
async def get_matches(
    current_user: Annotated[User, Depends(get_current_user)],
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get matches for a given date.
    All content (including xG and AI predictions) is returned since the platform is VIP only.
    """
    if date is None:
        date = datetime.now().strftime("%Y-%m-%d")
    
    # Ensure data is cached/fetched for the day
    service = APIFootballService()
    await service.fetch_and_store_daily_fixtures(db, date)
    
    # Fetch from DB
    stmt = select(Match)
    result = await db.execute(stmt)
    matches = result.scalars().unique().all()
    
    return [MatchResponse.model_validate(m) for m in matches]


@router.get("/{fixture_id}", response_model=MatchResponse)
async def get_match_by_fixture(
    fixture_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get a specific match by fixture ID."""
    stmt = select(Match).where(Match.fixture_id == fixture_id)
    result = await db.execute(stmt)
    match = result.scalar_one_or_none()
    
    if not match:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maç bulunamadı."
        )
    
    return MatchResponse.model_validate(match)
