from datetime import datetime, timedelta
import random
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import get_settings
from app.models.match import Match
from app.models.odds import Odds
from app.models.stats import Stats


class APIFootballService:
    """Service for fetching data from API-Football."""
    
    def __init__(self):
        self.settings = get_settings()
        self.base_url = self.settings.api_football_base_url
        self.headers = {
            "x-apisports-key": self.settings.api_football_key,
        }
    
    async def fetch_and_store_daily_fixtures(self, db: AsyncSession, date: str) -> bool:
        """
        Simulate fetching fixtures from API-Football and writing to PostgreSQL.
        In production, this would make an actual HTTP request to /fixtures endpoint.
        """
        print(f"[API-Football] Simulated fetch for date: {date}")
        
        # Check if already generated today
        stmt = select(Match).where(Match.league_id == self.settings.league_id)
        result = await db.execute(stmt)
        existing = result.scalars().first()
        if existing:
            # For demo, if data exists we just say it's done. 
            # In prod, we'd update or filter by exact date.
            return True
            
        # Dummy data simulating API response
        dummy_teams = [
            ("Galatasaray", "Fenerbahçe"),
            ("Beşiktaş", "Trabzonspor"),
            ("Başakşehir", "Adana Demirspor"),
            ("Sivasspor", "Konyaspor"),
        ]
        
        target_date = datetime.strptime(date, "%Y-%m-%d")
        
        for i, (home, away) in enumerate(dummy_teams):
            fixture_id = 1000 + i
            
            # Create match
            import random
            match = Match(
                fixture_id=fixture_id,
                home_team=home,
                away_team=away,
                home_score=random.choice([None, 0, 1, 2, 3]),
                away_score=random.choice([None, 0, 1, 2]),
                start_time=target_date + timedelta(hours=19 + i),
                league_id=self.settings.league_id,
            )
            db.add(match)
            await db.flush() # flush to get match.id
            
            # Create odds
            odds = Odds(
                match_id=match.id,
                home_odd=round(random.uniform(1.2, 4.0), 2),
                draw_odd=round(random.uniform(2.5, 4.5), 2),
                away_odd=round(random.uniform(1.5, 6.0), 2)
            )
            db.add(odds)
            
            # Create premium stats
            stats = Stats(
                match_id=match.id,
                home_xg=round(random.uniform(0.5, 3.5), 2),
                away_xg=round(random.uniform(0.5, 2.5), 2),
                ai_prediction_score=round(random.uniform(40, 95), 1)
            )
            db.add(stats)
            
        await db.commit()
        return True
