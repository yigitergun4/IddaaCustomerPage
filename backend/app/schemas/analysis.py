"""
Pydantic schemas for the Match Analysis pipeline.

These mirror the EXACT API-Football v3 JSON structures for:
  - GET /fixtures        (fixture + teams + goals + league)
  - GET /fixtures/headtohead
  - GET /teams/statistics
  - GET /predictions

Only fields consumed by the analysis layer are declared;
extra fields are silently ignored (Pydantic default).
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ─────────────────────────────────────────────────────────────
# Shared primitives
# ─────────────────────────────────────────────────────────────


class TeamRef(BaseModel):
    """Minimal team reference used across multiple endpoints."""
    id: int
    name: str
    logo: Optional[str] = None


class FixtureStatus(BaseModel):
    short: str   # NS, 1H, HT, 2H, FT, AET, PEN, CANC …
    long: str
    elapsed: Optional[int] = None


class FixtureInfo(BaseModel):
    id: int
    date: datetime
    venue: Optional[dict] = None
    status: FixtureStatus


class Goals(BaseModel):
    home: Optional[int] = None
    away: Optional[int] = None


class Teams(BaseModel):
    home: TeamRef
    away: TeamRef


class Score(BaseModel):
    """Score breakdown by period."""
    halftime: Goals = Field(default_factory=Goals)
    fulltime: Goals = Field(default_factory=Goals)
    extratime: Goals = Field(default_factory=Goals)
    penalty: Goals = Field(default_factory=Goals)


class LeagueRef(BaseModel):
    id: int
    name: str
    country: Optional[str] = None
    season: Optional[int] = None
    round: Optional[str] = None


# ─────────────────────────────────────────────────────────────
# /fixtures response
# ─────────────────────────────────────────────────────────────


class FixtureItem(BaseModel):
    """One entry from GET /fixtures."""
    fixture: FixtureInfo
    league: LeagueRef
    teams: Teams
    goals: Goals
    score: Optional[Score] = None

    # Convenience accessors
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
    def start_time(self) -> datetime:
        return self.fixture.date


class FixturesApiResponse(BaseModel):
    results: int = 0
    response: list[FixtureItem] = Field(default_factory=list)


# ─────────────────────────────────────────────────────────────
# /teams/statistics response
# ─────────────────────────────────────────────────────────────


class GoalsAvg(BaseModel):
    home: Optional[str] = None
    away: Optional[str] = None
    total: Optional[str] = None


class GoalsDetail(BaseModel):
    """Goals for or against — average sub-object."""
    average: GoalsAvg = Field(default_factory=GoalsAvg)
    total: Optional[dict] = None


class GoalsStats(BaseModel):
    """'for' and 'against' in team statistics."""
    model_config = {"populate_by_name": True}

    for_goals: GoalsDetail = Field(default_factory=GoalsDetail, alias="for")
    against: GoalsDetail = Field(default_factory=GoalsDetail)


class FixtureRecord(BaseModel):
    played: Optional[dict] = None
    wins: Optional[dict] = None
    draws: Optional[dict] = None
    loses: Optional[dict] = None


class CleanSheets(BaseModel):
    home: Optional[int] = None
    away: Optional[int] = None
    total: Optional[int] = None


class FailedToScore(BaseModel):
    home: Optional[int] = None
    away: Optional[int] = None
    total: Optional[int] = None


class TeamStatistics(BaseModel):
    """Response body of GET /teams/statistics."""
    team: TeamRef
    league: LeagueRef
    fixtures: FixtureRecord = Field(default_factory=FixtureRecord)
    goals: GoalsStats = Field(default_factory=GoalsStats)
    clean_sheet: CleanSheets = Field(default_factory=CleanSheets)
    failed_to_score: FailedToScore = Field(default_factory=FailedToScore)
    form: Optional[str] = None   # e.g. "WWDLW"


class TeamStatsApiResponse(BaseModel):
    results: int = 0
    response: Optional[TeamStatistics] = None


# ─────────────────────────────────────────────────────────────
# /predictions response
# ─────────────────────────────────────────────────────────────


class PredictionWinner(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = None
    comment: Optional[str] = None


class PredictionDetail(BaseModel):
    winner: PredictionWinner = Field(default_factory=PredictionWinner)
    win_or_draw: Optional[bool] = None
    under_over: Optional[str] = None
    goals: Goals = Field(default_factory=Goals)
    advice: Optional[str] = None
    percent: Optional[dict] = None   # {"home": "45%", "draw": "25%", "away": "30%"}


class ComparisonStat(BaseModel):
    home: Optional[str] = None
    away: Optional[str] = None


class ComparisonData(BaseModel):
    form: ComparisonStat = Field(default_factory=ComparisonStat)
    att: ComparisonStat = Field(default_factory=ComparisonStat)
    def_: ComparisonStat = Field(default_factory=ComparisonStat, alias="def")
    poisson_distribution: ComparisonStat = Field(default_factory=ComparisonStat)
    h2h: ComparisonStat = Field(default_factory=ComparisonStat)
    goals: ComparisonStat = Field(default_factory=ComparisonStat)
    total: ComparisonStat = Field(default_factory=ComparisonStat)

    model_config = {"populate_by_name": True}


class PredictionItem(BaseModel):
    predictions: PredictionDetail = Field(default_factory=PredictionDetail)
    comparison: ComparisonData = Field(default_factory=ComparisonData)
    teams: Optional[Teams] = None


class PredictionsApiResponse(BaseModel):
    results: int = 0
    response: list[PredictionItem] = Field(default_factory=list)


# ─────────────────────────────────────────────────────────────
# Analysis output (our domain object — not from the API)
# ─────────────────────────────────────────────────────────────


class HeadToHeadRecord(BaseModel):
    """Summarised H2H stats computed from raw fixture list."""
    total_matches: int
    home_wins: int
    away_wins: int
    draws: int
    home_goals_scored: int
    away_goals_scored: int
    last_matches: list[str]   # e.g. ["Arsenal 2-1 Chelsea (FT)", ...]


class TeamAnalysis(BaseModel):
    """Distilled analysis for one team."""
    team_id: int
    team_name: str
    league_form: Optional[str]          # last 5: "WWDLW"
    avg_goals_scored_home: Optional[float]
    avg_goals_scored_away: Optional[float]
    avg_goals_conceded_home: Optional[float]
    avg_goals_conceded_away: Optional[float]
    clean_sheets_total: Optional[int]
    failed_to_score_total: Optional[int]


class MatchAnalysisReport(BaseModel):
    """
    The final structured analysis report for a single upcoming fixture.
    This is what the API endpoint returns to the frontend.
    """
    fixture_id: int
    home_team: str
    away_team: str
    kick_off: datetime
    league: str
    round: Optional[str]

    home_team_analysis: TeamAnalysis
    away_team_analysis: TeamAnalysis

    head_to_head: HeadToHeadRecord
    prediction_advice: Optional[str]
    prediction_winner: Optional[str]
    prediction_percent: Optional[dict]   # {"home": "45%", "draw": "25%", "away": "30%"}
    under_over: Optional[str]            # e.g. "+2.5" or "-2.5"
    comparison: Optional[dict]           # raw comparison percentages for frontend charts
