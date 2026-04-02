"""
Seed realistic Super Lig fixture data for today so the dashboard always shows matches.
Run once:  python seed_matches.py
"""
import asyncio
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import get_settings
from app.models.match import Match
from app.models.odds import Odds
from app.models.stats import Stats

SUPER_LIG_ID = 203

# Realistic Super Lig matchups with realistic odds and xG values
FIXTURES = [
    {
        "fixture_id": 10001,
        "home_team": "Galatasaray",
        "away_team": "Fenerbahçe",
        "hour_offset": 19,
        "home_odd": 2.10, "draw_odd": 3.40, "away_odd": 3.50,
        "home_xg": 1.85, "away_xg": 1.42, "ai_score": 72.5,
    },
    {
        "fixture_id": 10002,
        "home_team": "Beşiktaş",
        "away_team": "Trabzonspor",
        "hour_offset": 19,
        "home_odd": 2.45, "draw_odd": 3.20, "away_odd": 3.00,
        "home_xg": 1.60, "away_xg": 1.30, "ai_score": 61.0,
    },
    {
        "fixture_id": 10003,
        "home_team": "Başakşehir",
        "away_team": "Adana Demirspor",
        "hour_offset": 21,
        "home_odd": 1.90, "draw_odd": 3.60, "away_odd": 4.20,
        "home_xg": 1.95, "away_xg": 0.95, "ai_score": 68.0,
    },
    {
        "fixture_id": 10004,
        "home_team": "Sivasspor",
        "away_team": "Kasımpaşa",
        "hour_offset": 21,
        "home_odd": 2.20, "draw_odd": 3.30, "away_odd": 3.40,
        "home_xg": 1.40, "away_xg": 1.20, "ai_score": 55.5,
    },
    {
        "fixture_id": 10005,
        "home_team": "Konyaspor",
        "away_team": "Antalyaspor",
        "hour_offset": 19,
        "home_odd": 2.60, "draw_odd": 3.10, "away_odd": 2.80,
        "home_xg": 1.10, "away_xg": 1.35, "ai_score": 48.0,
    },
]


async def seed() -> None:
    settings = get_settings()
    engine = create_async_engine(settings.database_url, future=True)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    # Use tomorrow's date so they show as "upcoming"
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today + timedelta(days=1)

    async with session_factory() as session:
        from sqlalchemy import select

        for f in FIXTURES:
            # Skip if already exists
            stmt = select(Match).where(Match.fixture_id == f["fixture_id"])
            result = await session.execute(stmt)
            if result.scalar_one_or_none():
                print(f"  [SKIP] fixture_id={f['fixture_id']} already exists")
                continue

            kick_off = tomorrow + timedelta(hours=f["hour_offset"])

            match = Match(
                fixture_id=f["fixture_id"],
                home_team=f["home_team"],
                away_team=f["away_team"],
                home_score=None,
                away_score=None,
                start_time=kick_off,
                league_id=SUPER_LIG_ID,
            )
            session.add(match)
            await session.flush()

            session.add(Odds(
                match_id=match.id,
                home_odd=f["home_odd"],
                draw_odd=f["draw_odd"],
                away_odd=f["away_odd"],
            ))
            session.add(Stats(
                match_id=match.id,
                home_xg=f["home_xg"],
                away_xg=f["away_xg"],
                ai_prediction_score=f["ai_score"],
            ))

            print(f"  [OK] {f['home_team']} vs {f['away_team']} @ {kick_off.strftime('%Y-%m-%d %H:%M')} UTC")

        await session.commit()
        print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(seed())
