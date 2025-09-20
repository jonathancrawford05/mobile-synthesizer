"""
Test script for Mobile Synthesizer FastAPI application
Tests basic functionality and all route endpoints
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check():
    """Test API health check"""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Mobile Synthesizer API" in data["message"]


def test_root_endpoint():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Mobile Synthesizer API is running"
    assert data["version"] == "0.1.0"
    assert data["status"] == "healthy"


def test_synthesizer_page():
    """Test synthesizer interface page"""
    response = client.get("/synthesizer")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "Mobile Synthesizer" in response.text


def test_mixer_page():
    """Test mixer interface page"""
    response = client.get("/mixer")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "Mixer" in response.text


def test_presets_page():
    """Test presets interface page"""
    response = client.get("/presets")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "Presets" in response.text


def test_sequencer_page():
    """Test sequencer interface page"""
    response = client.get("/sequencer")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "Sequencer" in response.text


def test_recording_page():
    """Test recording interface page"""
    response = client.get("/recording")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "Record" in response.text


def test_effects_page():
    """Test effects interface page"""
    response = client.get("/effects")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "Effects" in response.text


def test_profile_page():
    """Test profile interface page"""
    response = client.get("/profile")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "Profile" in response.text


def test_all_pages_have_navigation():
    """Test that all pages have proper navigation"""
    pages = [
        "/synthesizer",
        "/mixer",
        "/presets",
        "/sequencer",
        "/recording",
        "/effects",
        "/profile",
    ]

    for page in pages:
        response = client.get(page)
        assert response.status_code == 200
        # Check for navigation elements
        assert "Synthesizer" in response.text
        assert "Presets" in response.text
        assert "Mixer" in response.text
        assert "Sequencer" in response.text


def test_pages_have_tailwind_css():
    """Test that pages include Tailwind CSS"""
    response = client.get("/synthesizer")
    assert response.status_code == 200
    assert "tailwindcss.com" in response.text
    assert "Space Grotesk" in response.text


def test_pages_have_working_links():
    """Test that navigation links work correctly"""
    # Test synthesizer page links
    response = client.get("/synthesizer")
    assert response.status_code == 200
    assert 'href="/presets"' in response.text
    assert 'href="/mixer"' in response.text
    assert 'href="/sequencer"' in response.text


def test_responsive_design_elements():
    """Test that pages have responsive design classes"""
    response = client.get("/synthesizer")
    assert response.status_code == 200
    # Check for Tailwind responsive classes
    assert (
        "sm:grid-cols" in response.text
        or "md:grid-cols" in response.text
        or "lg:grid-cols" in response.text
    )


if __name__ == "__main__":
    # Simple test runner for quick validation
    print("🧪 Running Mobile Synthesizer Tests...")

    try:
        test_health_check()
        print("✅ Health check passed")

        test_root_endpoint()
        print("✅ Root endpoint passed")

        test_synthesizer_page()
        print("✅ Synthesizer page passed")

        test_mixer_page()
        print("✅ Mixer page passed")

        test_presets_page()
        print("✅ Presets page passed")

        test_sequencer_page()
        print("✅ Sequencer page passed")

        test_recording_page()
        print("✅ Recording page passed")

        test_effects_page()
        print("✅ Effects page passed")

        test_profile_page()
        print("✅ Profile page passed")

        test_all_pages_have_navigation()
        print("✅ Navigation test passed")

        test_pages_have_tailwind_css()
        print("✅ CSS loading test passed")

        test_pages_have_working_links()
        print("✅ Link functionality test passed")

        test_responsive_design_elements()
        print("✅ Responsive design test passed")

        print("\n🎉 All tests passed! Foundation is working correctly.")
        print("\n📋 Next steps:")
        print("1. Start the server: poetry run uvicorn app.main:app --reload")
        print("   Or use: ./start_server.sh")
        print("2. Visit: http://localhost:8000/synthesizer")
        print("3. Test navigation between pages")
        print("4. Ready for Iteration 2: Audio Implementation")

    except Exception as e:
        print(f"❌ Test failed: {e}")
        print("💡 Make sure you've installed dependencies:")
        print("   Run: poetry install")
