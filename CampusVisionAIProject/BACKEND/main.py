from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine

from routers import auth, students, admin, attendance, settings

models.Base.metadata.create_all(bind=engine)

import logging

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="CampusVisionAI Backend")

@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url}")
    try:
        response = await call_next(request)
        logger.info(f"Response status: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"Request failed: {str(e)}")
        raise e


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(students.router, prefix="/api/students", tags=["Students"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["Attendance"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(settings.router, prefix="/api/settings", tags=["Settings"])

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Resolve path to FRONTEND/dist
current_dir = os.path.dirname(os.path.abspath(__file__))
frontend_dist = os.path.normpath(os.path.join(current_dir, "..", "FRONTEND", "dist"))

# Serve frontend if compiled
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{catchall:path}")
    def serve_frontend(catchall: str):
        # Fall through to API 404 if route starts with api/ or api
        if catchall.startswith("api/") or catchall.startswith("api"):
            return {"detail": "Not Found"}
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"message": "CampusVisionAI API is running. Please compile the frontend."}
else:
    @app.get("/")
    def read_root():
        return {"message": "Welcome to CampusVisionAI API"}
