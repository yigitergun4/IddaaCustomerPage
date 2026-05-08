from pydantic import BaseModel, EmailStr
from datetime import datetime

class WaitlistEmailCreate(BaseModel):
    email: EmailStr
    phone: str | None = None

class WaitlistEmailResponse(BaseModel):
    id: int
    email: EmailStr
    phone: str | None = None
    created_at: datetime
    
    class Config:
        from_attributes = True
