from app.routers.users import router as users_router
from app.routers.matches import router as matches_router
from app.routers.admin import router as admin_router
from app.routers.fixtures import router as fixtures_router
from app.routers.analysis import router as analysis_router
from app.routers.waitlist import router as waitlist_router

__all__ = ["users_router", "matches_router", "admin_router", "fixtures_router", "analysis_router", "waitlist_router"]
