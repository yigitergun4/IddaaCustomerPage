from datetime import datetime
from sqlalchemy import Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Stats(Base):
    """Match statistics including xG and prediction scores (Premium content)."""
    
    __tablename__ = "stats"
    
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    match_id: Mapped[int] = mapped_column(Integer, ForeignKey("matches.id"), nullable=False, index=True)
    home_xg: Mapped[float | None] = mapped_column(Float, nullable=True)
    away_xg: Mapped[float | None] = mapped_column(Float, nullable=True)
    prediction_score: Mapped[float | None] = mapped_column(Float, nullable=True)  # AI prediction confidence 0-100
    home_win_probability: Mapped[float | None] = mapped_column(Float, nullable=True)
    draw_probability: Mapped[float | None] = mapped_column(Float, nullable=True)
    away_win_probability: Mapped[float | None] = mapped_column(Float, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    match = relationship("Match", back_populates="stats")
    
    def __repr__(self) -> str:
        return f"<Stats(match_id={self.match_id}, xG: {self.home_xg}-{self.away_xg})>"
