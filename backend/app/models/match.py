from datetime import datetime
from sqlalchemy import String, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Match(Base):
    """Football match information from API-Football."""
    
    __tablename__ = "matches"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    fixture_id: Mapped[int] = mapped_column(Integer, unique=True, nullable=False, index=True)
    home_team: Mapped[str] = mapped_column(String(100), nullable=False)
    away_team: Mapped[str] = mapped_column(String(100), nullable=False)
    home_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    away_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    league_id: Mapped[int] = mapped_column(Integer, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    odds = relationship("Odds", back_populates="match", uselist=False, lazy="joined", cascade="all, delete-orphan")
    stats = relationship("Stats", back_populates="match", uselist=False, lazy="joined", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Match(id={self.id}, {self.home_team} vs {self.away_team})>"
