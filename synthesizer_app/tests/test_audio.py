"""
Test script for Audio Engine functionality
Tests Web Audio API integration and controls
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_synthesizer_has_audio_controls():
    """Test that synthesizer page includes audio control elements"""
    response = client.get("/synthesizer")
    assert response.status_code == 200
    
    # Check for audio control elements
    assert 'id="play-button"' in response.text
    assert 'id="stop-button"' in response.text
    assert 'id="frequency-slider"' in response.text
    assert 'id="volume-slider"' in response.text
    assert 'id="waveform-select"' in response.text
    assert 'id="status-indicator"' in response.text

def test_audio_engine_script_loaded():
    """Test that audio engine JavaScript is loaded"""
    response = client.get("/synthesizer")
    assert response.status_code == 200
    assert '/static/js/audio-engine.js' in response.text
    assert '/static/js/ui-controller.js' in response.text

def test_audio_controls_section_present():
    """Test that audio controls section exists"""
    response = client.get("/synthesizer")
    assert response.status_code == 200
    assert 'Audio Engine' in response.text
    assert 'Status:' in response.text

def test_waveform_options_available():
    """Test that all waveform options are present"""
    response = client.get("/synthesizer")
    assert response.status_code == 200
    assert 'Sine Wave' in response.text
    assert 'Square Wave' in response.text
    assert 'Sawtooth Wave' in response.text
    assert 'Triangle Wave' in response.text

def test_frequency_range_correct():
    """Test that frequency slider has correct range"""
    response = client.get("/synthesizer")
    assert response.status_code == 200
    assert 'min="20"' in response.text
    assert 'max="2000"' in response.text

def test_volume_range_correct():
    """Test that volume slider has correct range"""
    response = client.get("/synthesizer")
    assert response.status_code == 200
    assert 'min="0"' in response.text
    # Volume slider uses 0-1 range
    assert 'max="1"' in response.text
    assert 'step="0.01"' in response.text

if __name__ == "__main__":
    print("🧪 Running Audio Engine Tests...")
    
    try:
        test_synthesizer_has_audio_controls()
        print("✅ Audio controls present")
        
        test_audio_engine_script_loaded()
        print("✅ Audio scripts loaded")
        
        test_audio_controls_section_present()
        print("✅ Audio controls section exists")
        
        test_waveform_options_available()
        print("✅ Waveform options available")
        
        test_frequency_range_correct()
        print("✅ Frequency range correct")
        
        test_volume_range_correct()
        print("✅ Volume range correct")
        
        print("\n🎉 All audio tests passed!")
        print("\n📋 Manual Testing Required:")
        print("1. Start server: poetry run uvicorn app.main:app --reload")
        print("2. Open: http://localhost:8000/synthesizer")
        print("3. Click PLAY button - you should hear a tone")
        print("4. Move frequency slider - pitch should change")
        print("5. Move volume slider - volume should change")
        print("6. Change waveform - sound character should change")
        print("7. Press SPACE key - should play/stop")
        print("8. Click STOP button - sound should stop")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
