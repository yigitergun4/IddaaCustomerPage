from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.services.csv_processor import process_dealer_csv
from app.models.dealer import DealerWhitelist
from app.models.user import User

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/upload-dealer-csv")
async def upload_dealer_csv(
    file: UploadFile = File(...),
    replace_all: bool = True,
    db: AsyncSession = Depends(get_db)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sadece CSV dosyaları kabul edilmektedir."
        )
    
    result = await process_dealer_csv(file.file, db, replace_all)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "CSV işleme hatası")
        )
    
    return result


@router.get("/stats")
async def get_admin_stats(db: AsyncSession = Depends(get_db)):
    """Get platform statistics for admin dashboard."""
    # Count total unique active sessions (simulated via User table)
    user_count = await db.execute(select(func.count(User.id)))
    active_sessions = user_count.scalar()
    
    # Count dealers in whitelist
    dealer_count = await db.execute(select(func.count(DealerWhitelist.id)))
    total_dealers = dealer_count.scalar()
    
    return {
        "active_sessions": active_sessions,
        "total_dealers_in_whitelist": total_dealers,
    }


@router.get("/whitelist")
async def get_whitelist(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Get paginated dealer whitelist."""
    stmt = select(DealerWhitelist).offset(skip).limit(limit)
    result = await db.execute(stmt)
    dealers = result.scalars().all()
    
    return {
        "dealers": [
            {
                "id": d.id,
                "phone": d.phone,
                "updated_at": d.updated_at
            }
            for d in dealers
        ],
        "skip": skip,
        "limit": limit
    }
