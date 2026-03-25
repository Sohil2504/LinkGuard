from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from app.routes.dispatch import router as dispatch_router
from app.routes.health import router as health_router
from app.routes.incidents import router as incidents_router
from app.routes.monitors import router as monitors_router

LOCAL_WEB_ORIGINS = (
    "http://127.0.0.1:4173",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://localhost:5173",
)

app = FastAPI(
    title="LinkGuard API",
    version="0.1.0",
    description=(
        "Control-plane API for LinkGuard monitors, dispatch preview, "
        "check execution, and incident lifecycle management."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(LOCAL_WEB_ORIGINS),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(monitors_router)
app.include_router(incidents_router)
app.include_router(dispatch_router)

handler = Mangum(app)
