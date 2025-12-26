from dataclasses import dataclass
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.dealer import DealerWhitelist


@dataclass
class VerificationResult:
    """Result of member ID verification."""
    success: bool
    message: str
    is_verified: bool = False


async def verify_member_id(
    user_id: int,
    member_id: str,
    db: AsyncSession
) -> VerificationResult:
    """
    Verify if a member ID exists in the dealer whitelist.
    
    The "Paywall" Logic:
    1. Check if member_id exists in DealerWhitelist table
    2. IF exists: Update User.is_verified = True and grant access
    3. IF not exists: Return error with Turkish message
    
    Args:
        user_id: The user's database ID
        member_id: The Iddaa Member ID to verify
        db: Database session
    
    Returns:
        VerificationResult with success status and message
    """
    # Normalize member_id (remove whitespace, uppercase)
    member_id = member_id.strip().upper()
    
    # Check if member_id exists in dealer whitelist
    stmt = select(DealerWhitelist).where(DealerWhitelist.member_id == member_id)
    result = await db.execute(stmt)
    dealer = result.scalar_one_or_none()
    
    if dealer is None:
        # Member ID not found in whitelist
        return VerificationResult(
            success=False,
            message="Veri güncelleniyor, yarın tekrar deneyin veya bayi kodumuzu kullanarak üye olun.",
            is_verified=False
        )
    
    # Member ID found - verify the user
    user_stmt = select(User).where(User.id == user_id)
    user_result = await db.execute(user_stmt)
    user = user_result.scalar_one_or_none()
    
    if user is None:
        return VerificationResult(
            success=False,
            message="Kullanıcı bulunamadı.",
            is_verified=False
        )
    
    # Check if member_id is already used by another user
    existing_user_stmt = select(User).where(
        User.member_id == member_id,
        User.id != user_id
    )
    existing_result = await db.execute(existing_user_stmt)
    existing_user = existing_result.scalar_one_or_none()
    
    if existing_user:
        return VerificationResult(
            success=False,
            message="Bu üye numarası başka bir hesap tarafından kullanılıyor.",
            is_verified=False
        )
    
    # Update user verification status
    user.member_id = member_id
    user.is_verified = True
    await db.commit()
    
    return VerificationResult(
        success=True,
        message="Doğrulama başarılı! Premium içeriklere erişiminiz açıldı.",
        is_verified=True
    )


async def check_verification_status(user_id: int, db: AsyncSession) -> bool:
    """Check if a user is verified."""
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    return user.is_verified if user else False
