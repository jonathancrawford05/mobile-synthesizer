#!/bin/bash

# Quick Test Script for Audio Implementation

echo "🎵 Mobile Synthesizer - Audio Engine Test"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "app/main.py" ]; then
    echo "❌ Error: Please run this script from the synthesizer_app directory"
    exit 1
fi

echo "📋 Running automated tests..."
poetry run python tests/test_audio.py

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Automated tests passed!"
    echo ""
    echo "🎹 Starting development server for manual testing..."
    echo ""
    echo "📱 Manual Test Checklist:"
    echo "  1. Click PLAY button → Should hear a tone"
    echo "  2. Move Frequency slider → Pitch changes"
    echo "  3. Move Volume slider → Volume changes"
    echo "  4. Change Waveform → Sound character changes"
    echo "  5. Press SPACE key → Toggles play/stop"
    echo "  6. Click STOP button → Sound stops"
    echo ""
    echo "🌐 Opening http://localhost:8000/synthesizer"
    echo "   Press Ctrl+C to stop the server"
    echo ""
    
    # Start the server
    poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
else
    echo ""
    echo "❌ Automated tests failed. Please check the errors above."
    exit 1
fi
