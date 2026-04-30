from typing import AsyncGenerator
from contextlib import asynccontextmanager
import asyncio
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import users_router, matches_router, admin_router, fixtures_router, analysis_router, waitlist_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler for startup/shutdown events."""
    # Startup: Initialize database tables
    await init_db()
    print("✅ Database initialized")
    
    # Startup: Background task for data ingestion
    async def bg_data_fetch():
        from app.services.api_football import APIFootballService
        from app.database import async_session_maker
        while True:
            try:
                date_str = datetime.now().strftime("%Y-%m-%d")
                print(f"🔄 Running background data ingestion for {date_str}...")
                async with async_session_maker() as session:
                    service = APIFootballService()
                    await service.fetch_and_store_daily_fixtures(session, date_str)
            except Exception as e:
                print(f"❌ Background ingestion error: {e}")
            await asyncio.sleep(24 * 3600)  # Run once a day
    
    task = asyncio.create_task(bg_data_fetch())
    
    yield
    # Shutdown: Cleanup if needed
    task.cancel()
    print("👋 Application shutting down")


# Create FastAPI app
app = FastAPI(
    title="Sports Betting Loyalty & Analytics Platform",
    description="""
    ## 🎯 Premium AI Predictions & xG Data for Verified Dealers
    
    This platform provides exclusive sports analytics content to verified dealer customers.
    
    ### Features:
    - **Member Verification**: Verify your Iddaa Member ID to unlock premium content
    - **Match Data**: Turkey Super Lig fixtures with odds
    - **Premium Content**: xG data and AI predictions for verified users only
    
    ### API Groups:
    - **Users**: Registration, login, and member verification
    - **Matches**: Public and premium match data
    - **Admin**: Dealer whitelist management
    """,
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        # Add production domains here
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users_router)
app.include_router(matches_router)
app.include_router(fixtures_router)
app.include_router(analysis_router)
app.include_router(admin_router)
app.include_router(waitlist_router)


@app.get("/", tags=["health"])
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "message": "Sports Betting Platform API is running",
        "docs": "/docs"
    }


@app.get("/health", tags=["health"])
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "database": "connected",
        "version": "1.0.0"
    }
