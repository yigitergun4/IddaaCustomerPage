from app.routers.users import router as users_router
from app.routers.matches import router as matches_router
from app.routers.admin import router as admin_router

__all__ = ["users_router", "matches_router", "admin_router"]
