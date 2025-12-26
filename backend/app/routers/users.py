from datetime import datetime, timedelta
from typing import Annotated
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.config import get_settings
from app.models.user import User
from app.models.dealer import DealerWhitelist
from app.schemas.user import (
    UserResponse,
    VerifyRequest,
    VerifyResponse,
    Token,
    PhoneLoginRequest,
    SessionCheckResponse,
)
from app.services.verification import verify_member_id

router = APIRouter(prefix="/api/users", tags=["users"])
settings = get_settings()

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/login")


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create JWT token with session ID embedded."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to get current authenticated user.
    Also validates that the token matches the active session in DB.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Geçersiz kimlik bilgileri",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    session_terminated_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Oturumunuz başka bir cihazdan yapılan giriş nedeniyle sonlandırıldı.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id_str: str = payload.get("sub")
        session_id: str = payload.get("session_id")
        print(f"DEBUG: JWT decoded - user_id={user_id_str}, session_id={session_id}")
        if user_id_str is None or session_id is None:
            print("DEBUG: Missing user_id or session_id in JWT")
            raise credentials_exception
        # Convert user_id from string to int
        user_id = int(user_id_str)
    except (JWTError, ValueError) as e:
        print(f"DEBUG: JWTError/ValueError - {e}")
        raise credentials_exception
    
    # Get user from DB
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if user is None:
        print(f"DEBUG: User not found for id={user_id}")
        raise credentials_exception
    
    # Check if session is still valid (matches active session in DB)
    print(f"DEBUG: Checking session - token={session_id}, db={user.active_session_token}")
    if user.active_session_token != session_id:
        print("DEBUG: Session mismatch - session was terminated")
        raise session_terminated_exception
    
    return user


@router.post("/login", response_model=Token)
async def login_with_phone(
    login_data: PhoneLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Login with phone number only.
    Phone must exist in dealer_whitelist (from iddaa.portal).
    Previous sessions will be terminated.
    """
    # Normalize phone number (remove spaces, dashes)
    phone = login_data.phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    
    # Check if phone exists in dealer whitelist
    stmt = select(DealerWhitelist).where(DealerWhitelist.phone == phone)
    result = await db.execute(stmt)
    dealer = result.scalar_one_or_none()
    
    if not dealer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bu telefon numarası sistemde kayıtlı değil. Lütfen bayinize başvurun.",
        )
    
    # Find or create user for this phone
    stmt = select(User).where(User.phone == phone)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        # Create user automatically
        user = User(
            phone=phone,
            member_id=dealer.member_id,
            is_verified=True,  # Auto-verified since phone is in whitelist
        )
        db.add(user)
        await db.flush()
    
    # Generate unique session ID
    session_id = str(uuid.uuid4())
    
    # Store session ID in user record (this invalidates old sessions)
    user.active_session_token = session_id
    user.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(user)
    
    # Create token with session ID (sub must be string per JWT spec)
    access_token = create_access_token(
        data={"sub": str(user.id), "session_id": session_id},
        expires_delta=timedelta(days=7)  # Longer expiry for convenience
    )
    
    return Token(access_token=access_token)


@router.get("/session-check", response_model=SessionCheckResponse)
async def check_session(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: AsyncSession = Depends(get_db)
):
    """
    Check if current session is still valid.
    Frontend should poll this endpoint periodically.
    """
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: int = payload.get("sub")
        session_id: str = payload.get("session_id")
        
        if not user_id or not session_id:
            return SessionCheckResponse(valid=False, message="Geçersiz token")
        
        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            return SessionCheckResponse(valid=False, message="Kullanıcı bulunamadı")
        
        if user.active_session_token != session_id:
            return SessionCheckResponse(
                valid=False, 
                message="Oturumunuz başka bir cihazdan yapılan giriş nedeniyle sonlandırıldı."
            )
        
        return SessionCheckResponse(valid=True)
        
    except JWTError:
        return SessionCheckResponse(valid=False, message="Token süresi dolmuş")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: Annotated[User, Depends(get_current_user)]):
    """Get current user's profile."""
    return current_user


@router.post("/logout")
async def logout(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Logout and invalidate current session."""
    current_user.active_session_token = None
    current_user.updated_at = datetime.utcnow()
    await db.commit()
    return {"message": "Başarıyla çıkış yapıldı"}


@router.post("/verify", response_model=VerifyResponse)
async def verify_user(
    request: VerifyRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    Verify user's Iddaa Member ID against dealer whitelist.
    
    This is the "Paywall" endpoint:
    - If member_id exists in DealerWhitelist: Grant access to premium content
    - If not: Return Turkish error message
    """
    result = await verify_member_id(
        user_id=current_user.id,
        member_id=request.member_id,
        db=db
    )
    
    return VerifyResponse(
        success=result.success,
        message=result.message,
        is_verified=result.is_verified
    )
