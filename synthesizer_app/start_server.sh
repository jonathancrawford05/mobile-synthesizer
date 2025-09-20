#!/bin/bash

# Mobile Synthesizer Development Server Startup Script

echo "🎹 Mobile Synthesizer - Starting Development Server"
echo "==============================================="

# Check if we're in the right directory
if [ ! -f "app/main.py" ]; then
    echo "❌ Error: Please run this script from the synthesizer_app directory"
    echo "Current directory: $(pwd)"
    echo "Expected to find: app/main.py"
    exit 1
fi

# Check if Poetry is installed
if ! command -v poetry &> /dev/null; then
    echo "📦 Poetry not found. Installing Poetry..."
    curl -sSL https://install.python-poetry.org | python3 -
    echo "🔄 Please restart your terminal or run: source ~/.bashrc"
    echo "Then run this script again."
    exit 1
fi

# Install dependencies with Poetry
echo "📥 Installing dependencies with Poetry..."
poetry install

echo ""
echo "✅ Setup complete!"
echo ""
echo "🧪 Running basic tests..."
poetry run python tests/test_basic.py

echo ""
echo "🚀 Starting FastAPI development server..."
echo "📱 Open your browser to: http://localhost:8000/synthesizer"
echo "📚 API documentation: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
