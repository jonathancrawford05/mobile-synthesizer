"""
Mobile Synthesizer FastAPI Application
Main application entry point — creates the app and wires routers.
"""

from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.api.endpoints import router as api_router
from app.api.pages import router as pages_router

# Initialize FastAPI app
app = FastAPI(
    title="Mobile Synthesizer",
    description="A web-based mobile synthesizer application",
    version="0.1.0",
)

# Static files
BASE_DIR = Path(__file__).resolve().parent
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")

# Routers
app.include_router(pages_router)
app.include_router(api_router)


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint — health check."""
    return {
        "message": "Mobile Synthesizer API is running",
        "version": "0.1.0",
        "status": "healthy",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)


def main() -> None:
    """Entry point for Poetry scripts."""
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
