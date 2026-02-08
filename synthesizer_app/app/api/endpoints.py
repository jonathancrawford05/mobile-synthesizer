"""API endpoints — JSON responses for health checks and future API routes."""

from fastapi import APIRouter

router = APIRouter(prefix="/api")


@router.get("/health")
async def api_health() -> dict[str, str]:
    """API health check endpoint."""
    return {"status": "healthy", "message": "Mobile Synthesizer API is operational"}
