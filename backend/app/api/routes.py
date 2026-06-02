from fastapi import APIRouter

from app.api.routes_auth import router as auth_router
from app.api.routes_daily_measurements import router as daily_measurements_router
from app.api.routes_dashboard import router as dashboard_router
from app.api.routes_export import router as export_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["Authentification"])
api_router.include_router(daily_measurements_router, prefix="/measures", tags=["Mesures"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["Tableau de bord"])
api_router.include_router(export_router, prefix="/export", tags=["Export"])

