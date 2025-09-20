# Mobile Synthesizer Backend

A FastAPI-based backend for the mobile synthesizer application built with Python and Poetry.

## Setup Instructions

### Prerequisites

Install Poetry (Python dependency manager):

**macOS/Linux:**
```bash
curl -sSL https://install.python-poetry.org | python3 -
```

**Windows (PowerShell):**
```powershell
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | py -
```

### Installation & Running

1. **Install dependencies:**
```bash
poetry install
```

2. **Run tests:**
```bash
poetry run python tests/test_basic.py
```

3. **Start the development server:**
```bash
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Quick Start Scripts

**macOS/Linux:**
```bash
chmod +x start_server.sh
./start_server.sh
```

**Windows:**
```batch
start_server.bat
```

## Access Points

- **Main Interface:** http://localhost:8000/synthesizer
- **API Documentation:** http://localhost:8000/docs  
- **Health Check:** http://localhost:8000/api/health

## Project Structure

```
synthesizer_app/
├── app/
│   ├── main.py              # FastAPI application entry
│   ├── models/              # Database models
│   ├── api/                 # API routes
│   ├── services/            # Business logic
│   ├── templates/           # HTML templates
│   └── static/              # CSS, JS, images
├── tests/                   # Test files
├── pyproject.toml          # Poetry configuration & dependencies
└── README.md               # This file
```

## Development Commands

```bash
# Install dependencies
poetry install

# Add new dependency
poetry add package-name

# Add development dependency  
poetry add --group dev package-name

# Run tests
poetry run pytest

# Run with hot reload
poetry run uvicorn app.main:app --reload

# Format code
poetry run black .

# Sort imports
poetry run isort .

# Type checking
poetry run mypy app/

# Enter virtual environment shell
poetry shell
```

## Development Phases

See `PROJECT_RUBRIC.md` for detailed implementation plan and component breakdown.

## Audio Dependencies

This project includes specialized audio processing libraries:
- **librosa** - Machine learning audio analysis
- **soundfile** - Audio file I/O operations

Poetry manages these complex dependencies and their native requirements automatically.
