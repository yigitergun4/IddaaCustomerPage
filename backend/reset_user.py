import asyncio
from app.database import async_session_maker
from app.models.user import User
from sqlalchemy import delete, select

async def reset_user():
    async with async_session_maker() as db:
        # Delete all users
        await db.execute(delete(User))
        
        # Create the new single test user
        new_user = User(
            phone="5425304067",
            email="yigitgulret@yigitgulret.com",
            is_verified=True
        )
        db.add(new_user)
        await db.commit()
        
        # Verify
        result = await db.execute(select(User))
        users = result.scalars().all()
        print(f"Users in database: {[u.phone for u in users]}")

if __name__ == "__main__":
    asyncio.run(reset_user())
