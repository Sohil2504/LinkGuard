from fastapi import FastAPI
from mangum import Mangum

from app.routes.health import router as health_router
from app.routes.incidents import router as incidents_router
from app.routes.monitors import router as monitors_router

app = FastAPI(
    title="LinkGuard API",
    version="0.1.0",
    description="Control-plane API for LinkGuard monitors and incidents.",
)

app.include_router(health_router)
app.include_router(monitors_router)
app.include_router(incidents_router)

handler = Mangum(app)
