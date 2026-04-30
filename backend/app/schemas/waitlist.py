from pydantic import BaseModel, EmailStr
from datetime import datetime

class WaitlistEmailCreate(BaseModel):
    email: EmailStr

class WaitlistEmailResponse(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime
    
    class Config:
        from_attributes = True
