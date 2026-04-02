"""
Explore API-Football:
1. Confirm remaining requests
2. Fetch a real upcoming fixture from a major league (Premier League / La Liga)
3. Show H2H, team stats, predictions structure
"""
import asyncio
import json
import httpx

API_KEY = "48d7d0d9fcb9232881c1d172d8f09b0a"
BASE    = "https://v3.football.api-sports.io"
headers = {"x-apisports-key": API_KEY}

# Try Premier League (39), La Liga (140), Champions League (2), Bundesliga (78)
LEAGUES_TO_TRY = [39, 140, 78, 2, 135]  # PL, La Liga, Bundesliga, UCL, Serie A


async def fetch(path: str, params: dict) -> dict:
    async with httpx.AsyncClient(base_url=BASE, headers=headers, timeout=20) as c:
        r = await c.get(path, params=params)
        # Print remaining rate limit
        remaining = r.headers.get("x-ratelimit-requests-remaining", "?")
        limit     = r.headers.get("x-ratelimit-requests-limit", "?")
        print(f"  [rate] remaining={remaining}/{limit} | {path}")
        return r.json()


async def main() -> None:
    result: dict = {}

    # Check status
    status = await fetch("/status", {})
    result["status"] = status.get("response", {})

    # Find first league with upcoming fixtures
    fixture_found = False
    for league_id in LEAGUES_TO_TRY:
        for season in [2024, 2025]:
            data = await fetch("/fixtures", {
                "league": league_id, "season": season, "next": 1
            })
            n = data.get("results", 0)
            print(f"  league={league_id} season={season} next_fixtures={n}")
            if n:
                first      = data["response"][0]
                fixture_id = first["fixture"]["id"]
                home_id    = first["teams"]["home"]["id"]
                away_id    = first["teams"]["away"]["id"]
                home_name  = first["teams"]["home"]["name"]
                away_name  = first["teams"]["away"]["name"]
                print(f"  >> Found: [{fixture_id}] {home_name} vs {away_name} on {first['fixture']['date']}")

                result["example_league_id"] = league_id
                result["example_season"]    = season
                result["example_fixture"]   = first

                # H2H
                h2h = await fetch("/fixtures/headtohead", {
                    "h2h": str(home_id) + "-" + str(away_id), "last": 5
                })
                result["h2h"] = h2h.get("response", [])

                # Team stats home
                ts_home = await fetch("/teams/statistics", {
                    "league": league_id, "season": season, "team": home_id
                })
                result["team_stats_home"] = ts_home.get("response", {})

                # Team stats away
                ts_away = await fetch("/teams/statistics", {
                    "league": league_id, "season": season, "team": away_id
                })
                result["team_stats_away"] = ts_away.get("response", {})

                # Predictions
                pred = await fetch("/predictions", {"fixture": fixture_id})
                result["predictions"] = pred.get("response", [])

                fixture_found = True
                break
        if fixture_found:
            break

    with open("api_data.json", "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, default=str, ensure_ascii=False)

    print("\nSaved api_data.json")
    print("Status remaining_requests:", result.get("status", {}).get("requests", {}).get("current"))
    if "example_fixture" in result:
        fx = result["example_fixture"]
        print("Match:", fx["teams"]["home"]["name"], "vs", fx["teams"]["away"]["name"])
        print("Date:", fx["fixture"]["date"])
    print("H2H results:", len(result.get("h2h", [])))
    print("Predictions:", len(result.get("predictions", [])))


asyncio.run(main())
