from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="CampusVisionAI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

startup_error = None
try:
    import models
    from database import engine
    models.Base.metadata.create_all(bind=engine)
    
    from routers import auth, students, admin, attendance, settings
    app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
    app.include_router(students.router, prefix="/api/students", tags=["Students"])
    app.include_router(attendance.router, prefix="/api/attendance", tags=["Attendance"])
    app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
    app.include_router(settings.router, prefix="/api/settings", tags=["Settings"])
except Exception as e:
    import traceback
    startup_error = traceback.format_exc()

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

current_dir = os.path.dirname(os.path.abspath(__file__))
frontend_dist = os.path.normpath(os.path.join(current_dir, "..", "FRONTEND", "dist"))

if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{catchall:path}")
    def serve_frontend(catchall: str):
        if catchall.startswith("api/") or catchall.startswith("api"):
            return {"detail": "Not Found"}
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"message": "CampusVisionAI API is running. Please compile the frontend."}
else:
    @app.get("/")
    def read_root():
        if startup_error:
            return {
                "status": "error",
                "message": "Startup failed",
                "traceback": startup_error
            }
        return {"message": "Welcome to CampusVisionAI API"}
