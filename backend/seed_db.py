import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import get_settings
from app.models.dealer import DealerWhitelist

async def seed():
    settings = get_settings()
    engine = create_async_engine(settings.database_url, future=True)
    async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session_maker() as session:
        phone = "05551234567"
        print(f"Seeding DealerWhitelist with {phone}...")
        
        # Check if exists first
        from sqlalchemy import select
        stmt = select(DealerWhitelist).where(DealerWhitelist.phone == phone)
        result = await session.execute(stmt)
        existing = result.scalar_one_or_none()
        
        if not existing:
            dealer = DealerWhitelist(phone=phone)
            session.add(dealer)
            await session.commit()
            print("Done!")
        else:
            print("Already seeded!")

if __name__ == "__main__":
    asyncio.run(seed())
