import asyncio
import sys
from sqlalchemy import text
from app.database import engine, Base
from app.models.waitlist import WaitlistEmail

async def setup():
    async with engine.begin() as conn:
        print("Creating tables...")
        await conn.run_sync(Base.metadata.create_all)
        
        print("Truncating dealer_whitelist...")
        await conn.execute(text("TRUNCATE TABLE dealer_whitelist RESTART IDENTITY CASCADE"))
        
        print("Inserting 05425304067 into dealer_whitelist...")
        await conn.execute(text("INSERT INTO dealer_whitelist (phone, member_id, updated_at) VALUES ('05425304067', 'admin', NOW())"))
        
    print("Database setup complete.")

if __name__ == "__main__":
    asyncio.run(setup())
