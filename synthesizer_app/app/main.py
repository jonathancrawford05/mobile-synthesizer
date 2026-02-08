"""
Mobile Synthesizer FastAPI Application
Main application entry point with basic routing and static file serving
"""

from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.responses import Response

# Initialize FastAPI app
app = FastAPI(
    title="Mobile Synthesizer",
    description="A web-based mobile synthesizer application",
    version="0.1.0",
)

# Get the directory paths
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"

# Mount static files
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Initialize templates
templates = Jinja2Templates(directory=TEMPLATES_DIR)


# Health check endpoint
@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint - health check"""
    return {
        "message": "Mobile Synthesizer API is running",
        "version": "0.1.0",
        "status": "healthy",
    }


# Serve the main synthesizer interface
@app.get("/synthesizer", response_class=HTMLResponse)
async def synthesizer_interface(request: Request) -> Response:
    """Serve the main synthesizer interface"""
    return templates.TemplateResponse("synthesizer.html", {"request": request})


# Serve the mixer interface
@app.get("/mixer", response_class=HTMLResponse)
async def mixer_interface(request: Request) -> Response:
    """Serve the mixer interface"""
    return templates.TemplateResponse("mixer.html", {"request": request})


# Serve the presets interface
@app.get("/presets", response_class=HTMLResponse)
async def presets_interface(request: Request) -> Response:
    """Serve the presets interface"""
    return templates.TemplateResponse("presets.html", {"request": request})


# Serve the sequencer interface
@app.get("/sequencer", response_class=HTMLResponse)
async def sequencer_interface(request: Request) -> Response:
    """Serve the sequencer interface"""
    return templates.TemplateResponse("sequencer.html", {"request": request})


# Serve the recording interface
@app.get("/recording", response_class=HTMLResponse)
async def recording_interface(request: Request) -> Response:
    """Serve the recording interface"""
    return templates.TemplateResponse("recording.html", {"request": request})


# Serve the effects library interface
@app.get("/effects", response_class=HTMLResponse)
async def effects_interface(request: Request) -> Response:
    """Serve the effects library interface"""
    return templates.TemplateResponse("effects.html", {"request": request})


# Serve the user profile interface
@app.get("/profile", response_class=HTMLResponse)
async def profile_interface(request: Request) -> Response:
    """Serve the user profile interface"""
    return templates.TemplateResponse("profile.html", {"request": request})


# Basic API health check
@app.get("/api/health")
async def api_health() -> dict[str, str]:
    """API health check endpoint"""
    return {"status": "healthy", "message": "Mobile Synthesizer API is operational"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)


def main() -> None:
    """Entry point for Poetry scripts"""
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
