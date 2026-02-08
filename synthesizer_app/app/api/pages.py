"""Page routes — serves HTML templates for each interface."""

from pathlib import Path

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from starlette.responses import Response

router = APIRouter()

TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates"
templates = Jinja2Templates(directory=TEMPLATES_DIR)


@router.get("/synthesizer", response_class=HTMLResponse)
async def synthesizer_interface(request: Request) -> Response:
    """Serve the main synthesizer interface."""
    return templates.TemplateResponse("synthesizer.html", {"request": request})


@router.get("/mixer", response_class=HTMLResponse)
async def mixer_interface(request: Request) -> Response:
    """Serve the mixer interface."""
    return templates.TemplateResponse("mixer.html", {"request": request})


@router.get("/presets", response_class=HTMLResponse)
async def presets_interface(request: Request) -> Response:
    """Serve the presets interface."""
    return templates.TemplateResponse("presets.html", {"request": request})


@router.get("/sequencer", response_class=HTMLResponse)
async def sequencer_interface(request: Request) -> Response:
    """Serve the sequencer interface."""
    return templates.TemplateResponse("sequencer.html", {"request": request})


@router.get("/recording", response_class=HTMLResponse)
async def recording_interface(request: Request) -> Response:
    """Serve the recording interface."""
    return templates.TemplateResponse("recording.html", {"request": request})


@router.get("/effects", response_class=HTMLResponse)
async def effects_interface(request: Request) -> Response:
    """Serve the effects library interface."""
    return templates.TemplateResponse("effects.html", {"request": request})


@router.get("/profile", response_class=HTMLResponse)
async def profile_interface(request: Request) -> Response:
    """Serve the user profile interface."""
    return templates.TemplateResponse("profile.html", {"request": request})
