from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.waitlist import WaitlistEmail
from app.schemas.waitlist import WaitlistEmailCreate, WaitlistEmailResponse

router = APIRouter(prefix="/api/waitlist", tags=["waitlist"])

@router.post("/", response_model=WaitlistEmailResponse)
async def add_to_waitlist(
    data: WaitlistEmailCreate,
    db: AsyncSession = Depends(get_db)
):
    """Add a new email to the waitlist."""
    
    # Check if email already exists
    stmt = select(WaitlistEmail).where(WaitlistEmail.email == data.email)
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
    
    if existing:
        return existing  # Return existing rather than error, for idempotency
    
    # Create new waitlist entry
    new_entry = WaitlistEmail(email=data.email)
    db.add(new_entry)
    await db.commit()
    await db.refresh(new_entry)
    
    return new_entry
