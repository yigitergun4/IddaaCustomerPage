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
    Token,
    PhoneLoginRequest,
    SessionCheckResponse,
)

router = APIRouter(prefix="/api/users", tags=["users"])
settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/login")


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create JWT token with session ID embedded."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=24))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: AsyncSession = Depends(get_db)
) -> User:
    """Dependency to get current authenticated user."""
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
        if user_id_str is None or session_id is None:
            raise credentials_exception
        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise credentials_exception
    
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    
    if user.active_session_token != session_id:
        raise session_terminated_exception
    
    return user


@router.post("/login", response_model=Token)
async def login_with_phone(
    login_data: PhoneLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Login with Phone only. 
    VIP Gate: Phone must exist in DealerWhitelist.
    """
    import re
    phone = re.sub(r'\D', '', login_data.phone)
    
    # Check if phone exists in dealer whitelist
    stmt = select(DealerWhitelist).where(DealerWhitelist.phone == phone)
    result = await db.execute(stmt)
    dealer = result.scalar_one_or_none()
    
    if not dealer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bu platform sadece VIP bayimize kayıtlı üyelere özeldir. Lütfen bayinizle iletişime geçin.",
        )
    
    # Find or create user session tracking for this phone
    stmt = select(User).where(User.phone == phone)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        user = User(phone=phone)
        db.add(user)
        await db.flush()
    
    session_id = str(uuid.uuid4())
    user.active_session_token = session_id
    user.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(user)
    
    access_token = create_access_token(
        data={"sub": str(user.id), "session_id": session_id},
        expires_delta=timedelta(days=7)
    )
    
    return Token(access_token=access_token)


@router.get("/session-check", response_model=SessionCheckResponse)
async def check_session(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: AsyncSession = Depends(get_db)
):
    """Check if current session is still valid."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: int = payload.get("sub")
        session_id: str = payload.get("session_id")
        
        if not user_id or not session_id:
            return SessionCheckResponse(valid=False, message="Geçersiz token")
        
        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user or user.active_session_token != session_id:
            return SessionCheckResponse(valid=False, message="Oturumunuz sonlandırıldı")
        
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
