@echo off
REM Mobile Synthesizer Development Server Startup Script

echo 🎹 Mobile Synthesizer - Starting Development Server
echo ===============================================

REM Check if we're in the right directory
if not exist "app\main.py" (
    echo ❌ Error: Please run this script from the synthesizer_app directory
    echo Current directory: %CD%
    echo Expected to find: app\main.py
    pause
    exit /b 1
)

REM Check if Poetry is installed
where poetry >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 📦 Poetry not found. Installing Poetry...
    powershell -Command "(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | py -"
    echo 🔄 Please restart your terminal and run this script again.
    pause
    exit /b 1
)

REM Install dependencies with Poetry
echo 📥 Installing dependencies with Poetry...
poetry install

echo.
echo ✅ Setup complete!
echo.
echo 🧪 Running basic tests...
poetry run python tests\test_basic.py

echo.
echo 🚀 Starting FastAPI development server...
echo 📱 Open your browser to: http://localhost:8000/synthesizer
echo 📚 API documentation: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the server
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
