import httpx
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import get_settings
from app.models.match import Match


class SportMonksService:
    """
    Service for fetching data from SportMonks API.
    FREE PLAN: Only Denmark Superliga (ID: 271) with historical 2005/2006 data.
    """
    
    def __init__(self):
        self.settings = get_settings()
        self.base_url = self.settings.sportmonks_base_url
        self.token = self.settings.sportmonks_api_token
    
    def _get_params(self, **extra_params) -> dict:
        """Get base query params with API token."""
        params = {"api_token": self.token}
        params.update(extra_params)
        return params
    
    async def fetch_league_fixtures(
        self,
        db: AsyncSession,
        date: Optional[str] = None
    ) -> list[Match]:
        """
        Fetch league fixtures from SportMonks API.
        For FREE plan demo, returns all available fixtures (historical data).
        """
        # Check cache first
        stmt = select(Match).where(
            Match.league_id == self.settings.league_id
        ).order_by(Match.start_time.desc()).limit(20)
        result = await db.execute(stmt)
        cached_matches = list(result.scalars().all())
        
        # If we have fresh cached data, return it
        if cached_matches:
            most_recent = max(m.updated_at for m in cached_matches)
            if datetime.utcnow() - most_recent < timedelta(hours=1):
                return cached_matches
        
        # Fetch from API
        fixtures = await self._fetch_fixtures_from_api()
        
        if not fixtures:
            return cached_matches
        
        # Save to DB
        for fixture_data in fixtures:
            await self._save_fixture(fixture_data, db)
        
        await db.commit()
        
        # Return fresh data
        result = await db.execute(stmt)
        return list(result.scalars().all())
    
    async def _fetch_fixtures_from_api(self) -> list[dict]:
        """Fetch all available fixtures from SportMonks API."""
        url = f"{self.base_url}/football/fixtures"
        params = self._get_params(
            filters=f"fixtureLeagues:{self.settings.league_id}"
        )
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, timeout=30.0)
                response.raise_for_status()
                data = response.json()
                
                all_fixtures = data.get("data", [])
                print(f"[SportMonks] Fetched {len(all_fixtures)} fixtures")
                return all_fixtures[:20]  # Return first 20 for demo
                
        except httpx.HTTPError as e:
            print(f"[SportMonks] Error: {e}")
            return []
    
    async def _save_fixture(self, fixture_data: dict, db: AsyncSession) -> Match:
        """Save or update a fixture in the database."""
        fixture_id = fixture_data.get("id")
        
        # Check if exists
        stmt = select(Match).where(Match.fixture_id == fixture_id)
        result = await db.execute(stmt)
        match = result.scalar_one_or_none()
        
        if match is None:
            match = Match(fixture_id=fixture_id)
            db.add(match)
        
        # Parse team names from fixture name (format: "Team A vs Team B")
        name = fixture_data.get("name", "Team A vs Team B")
        teams = name.split(" vs ")
        home_team = teams[0].strip() if len(teams) > 0 else "Home"
        away_team = teams[1].strip() if len(teams) > 1 else "Away"
        
        # Update match data
        match.home_team = home_team
        match.away_team = away_team
        match.home_team_logo = None
        match.away_team_logo = None
        
        # Parse start time
        starting_at = fixture_data.get("starting_at", "")
        if starting_at:
            try:
                match.start_time = datetime.fromisoformat(starting_at.replace("Z", "+00:00"))
            except:
                match.start_time = datetime.now()
        else:
            match.start_time = datetime.now()
        
        match.league_id = self.settings.league_id
        match.league_name = "Denmark Superliga"
        match.venue = None
        
        # Parse status
        state = fixture_data.get("state", {})
        match.status = state.get("short_name", "FT") if isinstance(state, dict) else "FT"
        
        match.home_score = fixture_data.get("result_info", {}).get("home") if isinstance(fixture_data.get("result_info"), dict) else None
        match.away_score = fixture_data.get("result_info", {}).get("away") if isinstance(fixture_data.get("result_info"), dict) else None
        match.updated_at = datetime.utcnow()
        
        return match
