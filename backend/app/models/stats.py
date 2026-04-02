from datetime import datetime
from sqlalchemy import Integer, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Stats(Base):
    """Match statistics including xG and prediction scores (Premium content)."""
    
    __tablename__ = "stats"
    
    match_id: Mapped[int] = mapped_column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), primary_key=True)
    home_xg: Mapped[float | None] = mapped_column(Float, nullable=True)
    away_xg: Mapped[float | None] = mapped_column(Float, nullable=True)
    ai_prediction_score: Mapped[float | None] = mapped_column(Float, nullable=True)  # AI prediction confidence 0-100
    
    # Relationship
    match = relationship("Match", back_populates="stats")
    
    def __repr__(self) -> str:
        return f"<Stats(match_id={self.match_id}, xG: {self.home_xg}-{self.away_xg})>"
