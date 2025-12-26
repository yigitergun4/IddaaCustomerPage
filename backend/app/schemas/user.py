from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class UserCreate(BaseModel):
    """Schema for user registration."""
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    password: str = Field(..., min_length=6)


class UserResponse(BaseModel):
    """Schema for user data in responses."""
    id: int
    email: Optional[str] = None
    phone: Optional[str] = None
    member_id: Optional[str] = None
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class VerifyRequest(BaseModel):
    """Schema for member ID verification request."""
    member_id: str = Field(..., min_length=1, max_length=50, description="Iddaa Member ID to verify")


class VerifyResponse(BaseModel):
    """Schema for verification response."""
    success: bool
    message: str
    is_verified: bool = False


class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str = "bearer"


class PhoneLoginRequest(BaseModel):
    """Schema for phone-based login."""
    phone: str = Field(..., min_length=10, max_length=20, description="Phone number")


class SessionCheckResponse(BaseModel):
    """Schema for session check response."""
    valid: bool
    message: str = ""


class TokenData(BaseModel):
    """Schema for decoded token data."""
    user_id: Optional[int] = None


class MatchResponse(BaseModel):
    """Schema for match data in responses."""
    id: int
    fixture_id: int
    home_team: str
    home_team_logo: Optional[str] = None
    away_team: str
    away_team_logo: Optional[str] = None
    start_time: datetime
    league_name: Optional[str] = None
    status: str
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    odds: Optional["OddsResponse"] = None
    stats: Optional["StatsResponse"] = None
    
    class Config:
        from_attributes = True


class OddsResponse(BaseModel):
    """Schema for odds data."""
    home_odd: Optional[float] = None
    draw_odd: Optional[float] = None
    away_odd: Optional[float] = None
    provider: str = "API-Football"
    
    class Config:
        from_attributes = True


class StatsResponse(BaseModel):
    """Schema for stats data (premium content)."""
    home_xg: Optional[float] = None
    away_xg: Optional[float] = None
    prediction_score: Optional[float] = None
    home_win_probability: Optional[float] = None
    draw_probability: Optional[float] = None
    away_win_probability: Optional[float] = None
    
    class Config:
        from_attributes = True


# Update forward references
MatchResponse.model_rebuild()
