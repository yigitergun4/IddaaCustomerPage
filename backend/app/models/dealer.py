from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class DealerWhitelist(Base):
    """Dealer whitelist populated from daily CSV uploads."""
    
    __tablename__ = "dealer_whitelist"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    phone: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self) -> str:
        return f"<DealerWhitelist(id={self.id}, phone={self.phone})>"
