import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import insert
from app.models.dealer import DealerWhitelist
from app.config import get_settings

async def seed_test_dealer():
    settings = get_settings()
    engine = create_async_engine(settings.database_url)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session() as session:
        # Check if test dealer already exists
        from sqlalchemy import select
        stmt = select(DealerWhitelist).where(DealerWhitelist.phone == "5551234567")
        result = await session.execute(stmt)
        existing = result.scalar_one_or_none()

        if not existing:
            new_dealer = DealerWhitelist(
                member_id="TEST-12345",
                phone="5551234567",
                dealer_name="Test Bayi - Yigit"
            )
            session.add(new_dealer)
            await session.commit()
            print("✅ Test dealer added: 5551234567")
        else:
            print("ℹ️ Test dealer 5551234567 already exists.")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed_test_dealer())
