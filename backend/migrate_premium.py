import asyncio
from sqlalchemy import update
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.models.user import User
from app.config import get_settings

async def set_all_users_premium():
    settings = get_settings()
    engine = create_async_engine(settings.database_url)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session() as session:
        # Update all users to be verified (premium)
        stmt = update(User).values(is_verified=True)
        result = await session.execute(stmt)
        await session.commit()
        print(f"✅ Set {result.rowcount} users as verified (premium).")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(set_all_users_premium())
