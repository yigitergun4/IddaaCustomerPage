from datetime import datetime
from sqlalchemy import Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Odds(Base):
    """Betting odds for matches."""
    
    __tablename__ = "odds"
    
    match_id: Mapped[int] = mapped_column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), primary_key=True)
    home_odd: Mapped[float | None] = mapped_column(Float, nullable=True)
    draw_odd: Mapped[float | None] = mapped_column(Float, nullable=True)
    away_odd: Mapped[float | None] = mapped_column(Float, nullable=True)
    
    # Relationship
    match = relationship("Match", back_populates="odds")
    
    def __repr__(self) -> str:
        return f"<Odds(match_id={self.match_id}, {self.home_odd}/{self.draw_odd}/{self.away_odd})>"
