import httpx
import uuid
from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import get_settings
from app.models import Match, Odds, Stats


class SportMonksService:
    """
    Service for fetching data from SportMonks API (v3).
    Includes support for odds, statistics, and AI predictions (probabilities).
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
        league_id: int,
        date: Optional[str] = None
    ) -> List[Match]:
        """
        Fetch league fixtures with premium data (odds, stats, predictions).
        Uses caching to avoid redundant API calls.
        """
        # Check cache first
        stmt = select(Match).where(
            Match.league_id == league_id
        ).order_by(Match.start_time.desc()).limit(30)
        result = await db.execute(stmt)
        cached_matches = list(result.scalars().all())
        
        # If we have relatively fresh cached data, return it
        if cached_matches:
            most_recent = max(m.updated_at for m in cached_matches)
            if datetime.utcnow() - most_recent < timedelta(minutes=30):
                return cached_matches
        
        # Fetch from API with detailed includes
        fixtures = await self._fetch_fixtures_from_api(league_id)
        
        if not fixtures:
            return cached_matches
        
        # Save to DB
        for fixture_data in fixtures:
            await self._save_fixture(fixture_data, league_id, db)
        
        await db.commit()
        
        # Return fresh data
        result = await db.execute(stmt)
        return list(result.scalars().all())
    
    async def _fetch_fixtures_from_api(self, league_id: int) -> List[dict]:
        """Fetch fixtures with all necessary details using user-recommended includes."""
        url = f"{self.base_url}/football/fixtures"
        # Optimized include string per user strategy
        params = self._get_params(
            filters=f"fixtureLeagues:{league_id}",
            include="statistics.type;participants;scores;odds;predictions"
        )
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, timeout=45.0)
                response.raise_for_status()
                data = response.json()
                
                all_fixtures = data.get("data", [])
                print(f"[SportMonks] Fetched {len(all_fixtures)} fixtures for league {league_id}")
                return all_fixtures[:30]
                
        except httpx.HTTPError as e:
            print(f"[SportMonks] API Error: {e}")
            return []
    
    async def _save_fixture(self, fixture_data: dict, league_id: int, db: AsyncSession) -> Match:
        """Save or update a fixture with improved parsing from participants and scores."""
        fixture_id = fixture_data.get("id")
        
        stmt = select(Match).where(Match.fixture_id == fixture_id)
        result = await db.execute(stmt)
        match = result.scalar_one_or_none()
        
        if match is None:
            match = Match(fixture_id=fixture_id)
            db.add(match)
        
        # 1. Team Names & Logos from Participants
        participants = fixture_data.get("participants", [])
        if participants and isinstance(participants, list):
            for p in participants:
                # meta -> location: home / away
                location = p.get("meta", {}).get("location")
                if location == "home":
                    match.home_team = p.get("name", "Home Team")
                    match.home_team_logo = p.get("image_path")
                elif location == "away":
                    match.away_team = p.get("name", "Away Team")
                    match.away_team_logo = p.get("image_path")
        
        # Fallback if participants missing
        if not match.home_team:
            name = fixture_data.get("name", "Team A vs Team B")
            teams = name.split(" vs ")
            match.home_team = teams[0].strip() if len(teams) > 0 else "Home"
            match.away_team = teams[1].strip() if len(teams) > 1 else "Away"
        
        # 2. Scores from Scores include
        scores = fixture_data.get("scores", [])
        if scores and isinstance(scores, list) and participants:
            home_participant_id = next((p.get("id") for p in participants if p.get("meta", {}).get("location") == "home"), None)
            away_participant_id = next((p.get("id") for p in participants if p.get("meta", {}).get("location") == "away"), None)
            
            # Find the most recent/relevant score (CURRENT or FT)
            for s in scores:
                desc = s.get("description", "").upper()
                if desc in ["CURRENT", "FT", "FULLTIME"]:
                    pid = s.get("participant_id")
                    goals = s.get("score", {}).get("goals")
                    if pid == home_participant_id:
                        match.home_score = goals
                    elif pid == away_participant_id:
                        match.away_score = goals
        
        # Fallback to result_info if scores mapping failed
        if match.home_score is None:
            result_info = fixture_data.get("result_info", {})
            if isinstance(result_info, dict):
                match.home_score = result_info.get("home")
                match.away_score = result_info.get("away")
        
        # Meta info
        match.league_id = league_id
        # Dynamic league name based on participants property if available or requested ID
        match.league_name = "Süper Lig" if league_id == 601 else "Premium Lig"
        
        # Timing
        starting_at = fixture_data.get("starting_at", "")
        if starting_at:
            try:
                match.start_time = datetime.fromisoformat(starting_at.replace("Z", "+00:00"))
            except Exception:
                match.start_time = datetime.now()
        
        # Status
        state = fixture_data.get("state", {})
        match.status = state.get("short_name", "NS") if isinstance(state, dict) else "NS"
        
        # 3. Odds
        odds_list = fixture_data.get("odds", [])
        if odds_list:
            if not match.odds:
                match.odds = Odds(match_id=match.id)
            for market in odds_list:
                if market.get("market_id") == 1 or "1x2" in market.get("name", "").lower():
                    for val in market.get("values", []):
                        label = str(val.get("label")).lower()
                        if label == "1" or "home" in label:
                            match.odds.home_odd = val.get("value")
                        elif label == "x" or "draw" in label:
                            match.odds.draw_odd = val.get("value")
                        elif label == "2" or "away" in label:
                            match.odds.away_odd = val.get("value")
                    break

        # 4. Predictions & Stats
        if not match.stats:
            match.stats = Stats(match_id=match.id)
        
        stats_list = fixture_data.get("statistics", [])
        if stats_list:
            for stat in stats_list:
                # Type 123 is usually xG in some Monk versions
                if stat.get("type_id") == 123:
                    match.stats.home_xg = stat.get("home")
                    match.stats.away_xg = stat.get("away")
        
        predictions = fixture_data.get("predictions", [])
        if predictions:
            for pred in predictions:
                if pred.get("type") == "home_draw_away":
                    match.stats.home_win_probability = pred.get("home")
                    match.stats.draw_probability = pred.get("draw")
                    match.stats.away_win_probability = pred.get("away")
                    match.stats.prediction_score = max(
                        pred.get("home") or 0, 
                        pred.get("draw") or 0, 
                        pred.get("away") or 0
                    ) * 100
                    break

        match.updated_at = datetime.utcnow()
        return match

    async def fetch_standings(self, league_id: int) -> list:
        """Fetch league standings."""
        url = f"{self.base_url}/football/standings/live/leagues/{league_id}"
        params = self._get_params()
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, timeout=30.0)
                response.raise_for_status()
                data = response.json()
                return data.get("data", [])
        except Exception as e:
            print(f"[SportMonks] Standings Error: {e}")
            return []
