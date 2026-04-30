import asyncio
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.models.user import User
from app.config import get_settings

async def verify_login():
    settings = get_settings()
    base_url = "http://localhost:8000/api/users"
    
    # 1. Check current users
    engine = create_async_engine(settings.database_url)
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with async_session() as session:
        stmt = select(User.phone)
        result = await session.execute(stmt)
        existing_phones = [r[0] for r in result.all()]
        print(f"DEBUG: Existing phones in DB: {existing_phones}")

    test_phone_nonexistent = "9990001122"
    test_phone_existent = existing_phones[0] if existing_phones else None

    async with httpx.AsyncClient() as client:
        # Test 1: Non-existent number
        print(f"\nTesting login with non-existent phone: {test_phone_nonexistent}")
        response = await client.post(f"{base_url}/login", json={"phone": test_phone_nonexistent})
        print(f"Status: {response.status_code}")
        print(f"Detail: {response.json().get('detail')}")
        assert response.status_code == 401
        assert response.json().get('detail') == "Bu telefon numarası sisteme kayıtlı değil."

        # Check if user was created
        async with async_session() as session:
            stmt = select(User).where(User.phone == test_phone_nonexistent)
            result = await session.execute(stmt)
            if result.scalar_one_or_none():
                 print("❌ ERROR: User was created for non-existent phone!")
            else:
                 print("✅ SUCCESS: No user created for non-existent phone.")

        # Test 2: Existent number
        if test_phone_existent:
            print(f"\nTesting login with existing phone: {test_phone_existent}")
            response = await client.post(f"{base_url}/login", json={"phone": test_phone_existent})
            print(f"Status: {response.status_code}")
            assert response.status_code == 200
            print("✅ SUCCESS: Login successful for existing phone.")
            
            # Check token for premium access (actually just check if endpoint works)
            token = response.json().get("access_token")
            headers = {"Authorization": f"Bearer {token}"}
            print("\nTesting premium matches access with token...")
            response = await client.get("http://localhost:8000/api/matches/premium", headers=headers)
            print(f"Status: {response.status_code}")
            assert response.status_code == 200
            print("✅ SUCCESS: Premium content accessible.")

    await engine.dispose()

if __name__ == "__main__":
    # Ensure current server is running or mock it? 
    # The user has uvicorn running on port 8000 according to metadata.
    try:
        asyncio.run(verify_login())
    except Exception as e:
        print(f"Verification failed: {e}")
