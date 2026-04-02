from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


class UserResponse(BaseModel):
    """Schema for user data in responses."""
    id: int
    phone: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str = "bearer"


class PhoneLoginRequest(BaseModel):
    """Schema for phone based login."""
    phone: str = Field(..., description="Phone number")


class SessionCheckResponse(BaseModel):
    """Schema for session check response."""
    valid: bool
    message: str = ""


class TokenData(BaseModel):
    """Schema for decoded token data."""
    user_id: Optional[int] = None


class OddsResponse(BaseModel):
    """Schema for odds data."""
    home_odd: Optional[float] = None
    draw_odd: Optional[float] = None
    away_odd: Optional[float] = None
    
    class Config:
        from_attributes = True


class StatsResponse(BaseModel):
    """Schema for stats data (premium content)."""
    home_xg: Optional[float] = None
    away_xg: Optional[float] = None
    ai_prediction_score: Optional[float] = None
    
    class Config:
        from_attributes = True


class MatchResponse(BaseModel):
    """Schema for match data in responses."""
    id: int
    fixture_id: int
    home_team: str
    away_team: str
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    start_time: datetime
    league_id: int
    odds: Optional[OddsResponse] = None
    stats: Optional[StatsResponse] = None
    
    class Config:
        from_attributes = True

MatchResponse.model_rebuild()


class VerificationRequest(BaseModel):
    """Schema for member ID verification."""
    member_id: str = Field(..., description="Iddaa Member ID")


class VerificationResponse(BaseModel):
    """Schema for verification response."""
    success: bool
    message: str
    is_verified: bool
