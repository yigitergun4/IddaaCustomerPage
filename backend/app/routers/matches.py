from datetime import datetime
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.user import User
from app.models.match import Match
from app.routers.users import get_current_user
from app.schemas.user import MatchResponse

router = APIRouter(prefix="/api/matches", tags=["matches"])


@router.get("/", response_model=list[MatchResponse])
async def get_matches(
    current_user: Annotated[User, Depends(get_current_user)],
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format. Returns all matches if omitted."),
    db: AsyncSession = Depends(get_db),
):
    """
    Return matches from the local database, ordered by kick-off time.

    - If 'date' is provided, filters to that specific date.
    - If no 'date', returns all stored matches ordered by start_time.
    """
    stmt = select(Match).order_by(Match.start_time)

    if date:
        stmt = stmt.where(func.date(Match.start_time) == date)

    result = await db.execute(stmt)
    matches = result.scalars().unique().all()

    return [MatchResponse.model_validate(m) for m in matches]


@router.get("/{fixture_id}", response_model=MatchResponse)
async def get_match_by_fixture(
    fixture_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """Get a specific match by fixture ID."""
    stmt = select(Match).where(Match.fixture_id == fixture_id)
    result = await db.execute(stmt)
    match = result.scalar_one_or_none()

    if not match:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maç bulunamadı.",
        )

    return MatchResponse.model_validate(match)
