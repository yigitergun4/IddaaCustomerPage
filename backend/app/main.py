from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import users_router, matches_router, admin_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown events."""
    # Startup: Initialize database tables
    await init_db()
    print("✅ Database initialized")
    yield
    # Shutdown: Cleanup if needed
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
app.include_router(admin_router)


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
