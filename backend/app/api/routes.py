from fastapi import APIRouter

from app.api.routes_auth import router as auth_router
from app.api.routes_daily_measurements import router as daily_measurements_router
from app.api.routes_dashboard import router as dashboard_router
from app.api.routes_export import router as export_router
from app.api.routes_health_sync import router as health_sync_router
from app.api.routes_integrations import router as integrations_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["Authentification"])
api_router.include_router(daily_measurements_router, prefix="/measures", tags=["Mesures"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["Tableau de bord"])
api_router.include_router(export_router, prefix="/export", tags=["Export"])
api_router.include_router(integrations_router, prefix="/integrations", tags=["Connexions"])
api_router.include_router(health_sync_router, tags=["Synchronisation"])

