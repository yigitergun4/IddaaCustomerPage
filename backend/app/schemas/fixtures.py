"""
Pydantic schemas for validating and parsing raw API-Football fixture responses.

Mirrors the structure returned by:
  GET /fixtures?league=203&season=YYYY&date=YYYY-MM-DD

Only the fields the application actually uses are captured; everything else is
ignored thanks to Pydantic's default ``model_config`` behaviour.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Nested schemas (follow API-Football's object hierarchy)
# ---------------------------------------------------------------------------


class FixtureStatus(BaseModel):
    """Fixture status information."""

    short: str = Field(..., description="Short status code: NS, 1H, HT, 2H, FT, etc.")
    long: str = Field(..., description="Long description of the status.")
    elapsed: Optional[int] = Field(None, description="Minutes elapsed (None if not started).")


class FixtureInfo(BaseModel):
    """Core fixture metadata."""

    id: int = Field(..., description="Unique fixture ID from API-Football.")
    date: datetime = Field(..., description="Kick-off date/time in UTC.")
    status: FixtureStatus


class TeamInfo(BaseModel):
    """Team name and ID."""

    id: int
    name: str


class Teams(BaseModel):
    """Home and away team wrappers."""

    home: TeamInfo
    away: TeamInfo


class Goals(BaseModel):
    """Current score (None if match has not started)."""

    home: Optional[int] = None
    away: Optional[int] = None


class BookmakerOdd(BaseModel):
    """A single bookmaker odd value (1x2)."""

    value: str = Field(..., description="Odd name: Home, Draw, Away.")
    odd: str = Field(..., description="Decimal odd as a string from the API.")

    @field_validator("odd")
    @classmethod
    def parse_odd(cls, v: str) -> str:  # keep as str to avoid lossy float conversion
        try:
            float(v)  # validate it IS a number
        except ValueError as exc:
            raise ValueError(f"Odd must be numeric, got: {v!r}") from exc
        return v


class OddValues(BaseModel):
    """A single bet type and its odds."""

    name: str
    values: list[BookmakerOdd]


class Bookmaker(BaseModel):
    """One bookmaker entry."""

    id: int
    name: str
    bets: list[OddValues]


class OddsWrapper(BaseModel):
    """Odds payload for a fixture."""

    fixture: dict  # we only need odds, not the nested fixture info here
    bookmakers: list[Bookmaker] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Top-level response schemas
# ---------------------------------------------------------------------------


class FixtureItem(BaseModel):
    """
    Represents one fixture from the ``/fixtures`` response.

    This is the primary domain object the service layer works with.
    """

    fixture: FixtureInfo
    teams: Teams
    goals: Goals

    # Convenience properties so callers don't drill into nested objects
    @property
    def fixture_id(self) -> int:
        return self.fixture.id

    @property
    def home_team(self) -> str:
        return self.teams.home.name

    @property
    def away_team(self) -> str:
        return self.teams.away.name

    @property
    def home_score(self) -> Optional[int]:
        return self.goals.home

    @property
    def away_score(self) -> Optional[int]:
        return self.goals.away

    @property
    def start_time(self) -> datetime:
        return self.fixture.date


class FixturesResponse(BaseModel):
    """
    Top-level wrapper for the ``GET /fixtures`` API response.

    ``results`` is the count of fixtures in ``response``.
    """

    get: str = Field(default="fixtures")
    results: int = Field(default=0)
    response: list[FixtureItem] = Field(default_factory=list)
