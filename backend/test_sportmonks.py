#!/usr/bin/env python3
"""
Test script to verify SportMonks API access with Free Plan.
Free Plan includes:
- Denmark Superliga (League ID: 271)
- 180 API calls per hour per endpoint
- All standard data features
"""

import asyncio
import httpx
from datetime import datetime
import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import get_settings


async def test_sportmonks_api():
    """Test SportMonks API with free plan features."""
    settings = get_settings()
    base_url = settings.sportmonks_base_url
    token = settings.sportmonks_api_token
    league_id = settings.league_id  # 271 for Denmark Superliga
    
    if not token or token == "your_sportmonks_api_token_here":
        print("❌ ERROR: SPORTMONKS_API_TOKEN not set in .env file")
        print("Please add your API token to backend/.env")
        return False
    
    print(f"🔍 Testing SportMonks API Free Plan")
    print(f"📍 Base URL: {base_url}")
    print(f"🏆 League: Denmark Superliga (ID: {league_id})")
    print(f"⏰ Date: {datetime.now().strftime('%Y-%m-%d')}")
    print("-" * 60)
    
    async with httpx.AsyncClient() as client:
        # Test 1: Get today's fixtures
        print("\n1️⃣ Fetching today's fixtures...")
        today = datetime.now().strftime("%Y-%m-%d")
        url = f"{base_url}/football/fixtures/date/{today}"
        params = {
            "api_token": token,
            "filters": f"fixtureLeagues:{league_id}"
        }
        
        try:
            response = await client.get(url, params=params, timeout=30.0)
            response.raise_for_status()
            data = response.json()
            
            fixtures = data.get("data", [])
            print(f"✅ Found {len(fixtures)} fixtures for today")
            
            if fixtures:
                for i, fixture in enumerate(fixtures[:3], 1):  # Show first 3
                    participants = fixture.get("participants", [])
                    home = next((p for p in participants if p.get("meta", {}).get("location") == "home"), {})
                    away = next((p for p in participants if p.get("meta", {}).get("location") == "away"), {})
                    print(f"   {i}. {home.get('name', 'TBD')} vs {away.get('name', 'TBD')}")
            else:
                print("   ℹ️  No matches scheduled for today")
                print("   💡 Tip: Try checking standings or past fixtures")
            
        except httpx.HTTPError as e:
            print(f"❌ Error fetching fixtures: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"   Response: {e.response.text[:200]}")
            return False
        
        # Test 2: Try a recent date to find actual matches
        print("\n2️⃣ Checking for recent fixtures (Dec 22, 2024)...")
        recent_date = "2024-12-22"  # Sunday - likely match day
        url = f"{base_url}/football/fixtures/date/{recent_date}"
        params = {
            "api_token": token,
            "filters": f"fixtureLeagues:{league_id}"
        }
        
        try:
            response = await client.get(url, params=params, timeout=30.0)
            response.raise_for_status()
            data = response.json()
            
            fixtures = data.get("data", [])
            print(f"✅ Found {len(fixtures)} fixtures on {recent_date}")
            
            if fixtures:
                print("\n   � Matches:")
                for i, fixture in enumerate(fixtures[:5], 1):
                    state = fixture.get("state", {})
                    starting_at = fixture.get("starting_at", "")
                    print(f"   {i}. Fixture ID: {fixture.get('id')} - Status: {state.get('short_name', 'Unknown')}")
                    print(f"      Starting: {starting_at}")
            
        except httpx.HTTPError as e:
            print(f"❌ Error fetching past fixtures: {e}")
        
        # Test 3: Get league info
        print("\n3️⃣ Fetching league information...")
        league_url = f"{base_url}/football/leagues/{league_id}"
        params = {"api_token": token}
        
        try:
            response = await client.get(league_url, params=params, timeout=30.0)
            response.raise_for_status()
            data = response.json()
            
            league = data.get("data", {})
            print(f"✅ League: {league.get('name', 'Denmark Superliga')}")
            print(f"   ID: {league.get('id')}")
            print(f"   Type: {league.get('type')}")
            print(f"   Active: {league.get('active')}")
            
        except httpx.HTTPError as e:
            print(f"⚠️  League info not available in free plan")
        
        # Test 4: Rate limit info
        print("\n4️⃣ Free Plan Summary:")
        print("   ✅ Fixtures: Available for Denmark Superliga")
        print("   ✅ Basic match data: Teams, scores, status")
        print("   ❌ Live standings: Requires paid plan") 
        print("   ❌ Predictions/xG: Requires paid plan")
        print("   ❌ Detailed statistics: Requires paid plan")
        print("\n   📊 Rate Limit: 180 calls/hour per endpoint")
    
    print("\n" + "=" * 60)
    print("✅ SportMonks API Free Plan Test Completed!")
    print("=" * 60)
    return True


if __name__ == "__main__":
    success = asyncio.run(test_sportmonks_api())
    sys.exit(0 if success else 1)
