/**
 * Mobile Synthesizer - UI Controller
 * Connects HTML controls to the audio engine
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎛️ Initializing UI controller...');

    // Get control elements
    const playButton = document.getElementById('play-button');
    const stopButton = document.getElementById('stop-button');
    const frequencySlider = document.getElementById('frequency-slider');
    const frequencyDisplay = document.getElementById('frequency-display');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeDisplay = document.getElementById('volume-display');
    const waveformSelect = document.getElementById('waveform-select');
    const statusIndicator = document.getElementById('status-indicator');

    // Initialize UI with default values
    if (frequencySlider) {
        frequencySlider.value = audioEngine.frequency;
        updateFrequencyDisplay(audioEngine.frequency);
    }

    if (volumeSlider) {
        volumeSlider.value = audioEngine.volume;
        updateVolumeDisplay(audioEngine.volume);
    }

    if (waveformSelect) {
        waveformSelect.value = audioEngine.waveform;
    }

    // Play button handler
    if (playButton) {
        playButton.addEventListener('click', async function() {
            await audioEngine.play();
            updateUI();
        });
    }

    // Stop button handler
    if (stopButton) {
        stopButton.addEventListener('click', function() {
            audioEngine.stop();
            updateUI();
        });
    }

    // Frequency slider handler
    if (frequencySlider) {
        frequencySlider.addEventListener('input', function(e) {
            const freq = parseFloat(e.target.value);
            audioEngine.setFrequency(freq);
            updateFrequencyDisplay(freq);
        });
    }

    // Volume slider handler
    if (volumeSlider) {
        volumeSlider.addEventListener('input', function(e) {
            const vol = parseFloat(e.target.value);
            audioEngine.setVolume(vol);
            updateVolumeDisplay(vol);
        });
    }

    // Waveform selector handler
    if (waveformSelect) {
        waveformSelect.addEventListener('change', function(e) {
            audioEngine.setWaveform(e.target.value);
        });
    }

    // Helper function to update frequency display
    function updateFrequencyDisplay(freq) {
        if (frequencyDisplay) {
            const note = getNoteName(freq);
            frequencyDisplay.textContent = `${Math.round(freq)} Hz (${note})`;
        }
    }

    // Helper function to update volume display
    function updateVolumeDisplay(vol) {
        if (volumeDisplay) {
            const percentage = Math.round(vol * 100);
            volumeDisplay.textContent = `${percentage}%`;
        }
    }

    // Helper function to get note name from frequency
    function getNoteName(freq) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const A4 = 440;
        const C0 = A4 * Math.pow(2, -4.75);
        
        if (freq < 16.35) return '---';
        
        const halfSteps = 12 * Math.log2(freq / C0);
        const octave = Math.floor(halfSteps / 12);
        const note = Math.round(halfSteps % 12);
        
        return `${noteNames[note]}${octave}`;
    }

    // Update UI based on audio engine state
    function updateUI() {
        const state = audioEngine.getState();

        // Update play/stop button states
        if (playButton && stopButton) {
            if (state.isPlaying) {
                playButton.classList.remove('bg-primary');
                playButton.classList.add('bg-gray-400', 'cursor-not-allowed');
                playButton.disabled = true;
                
                stopButton.classList.remove('bg-gray-400', 'cursor-not-allowed');
                stopButton.classList.add('bg-red-500');
                stopButton.disabled = false;
            } else {
                playButton.classList.remove('bg-gray-400', 'cursor-not-allowed');
                playButton.classList.add('bg-primary');
                playButton.disabled = false;
                
                stopButton.classList.remove('bg-red-500');
                stopButton.classList.add('bg-gray-400', 'cursor-not-allowed');
                stopButton.disabled = true;
            }
        }

        // Update status indicator
        if (statusIndicator) {
            if (state.isPlaying) {
                statusIndicator.classList.remove('bg-gray-400');
                statusIndicator.classList.add('bg-green-500');
                statusIndicator.textContent = 'Playing';
            } else if (state.initialized) {
                statusIndicator.classList.remove('bg-green-500');
                statusIndicator.classList.add('bg-yellow-500');
                statusIndicator.textContent = 'Ready';
            } else {
                statusIndicator.classList.remove('bg-green-500', 'bg-yellow-500');
                statusIndicator.classList.add('bg-gray-400');
                statusIndicator.textContent = 'Inactive';
            }
        }
    }

    // Keyboard support for playing notes
    document.addEventListener('keydown', function(e) {
        // Space bar to play/stop
        if (e.code === 'Space' && !e.repeat) {
            e.preventDefault();
            if (audioEngine.isPlaying) {
                audioEngine.stop();
            } else {
                audioEngine.play();
            }
            updateUI();
        }
    });

    // Initial UI update
    updateUI();

    console.log('✅ UI controller initialized');
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    audioEngine.cleanup();
});
