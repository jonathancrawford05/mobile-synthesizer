/**
 * Mobile Synthesizer - Audio Engine
 * Basic Web Audio API implementation with single oscillator
 */

class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.oscillator = null;
        this.isPlaying = false;
        
        // Default parameters
        this.frequency = 440; // A4 note
        this.volume = 0.3; // Safe default volume (30%)
        this.waveform = 'sine';
        
        // Initialize on user interaction (required by browsers)
        this.initialized = false;
    }

    /**
     * Initialize the audio context and nodes
     * Must be called from a user gesture (click/touch)
     */
    async initialize() {
        if (this.initialized) {
            return true;
        }

        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create master gain node for volume control
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.audioContext.destination);
            
            this.initialized = true;
            console.log('✅ Audio engine initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize audio engine:', error);
            return false;
        }
    }

    /**
     * Start the oscillator and play sound
     */
    async play() {
        // Initialize if not already done
        if (!this.initialized) {
            const success = await this.initialize();
            if (!success) {
                alert('Failed to initialize audio. Please check browser permissions.');
                return;
            }
        }

        // Resume audio context if suspended (required by some browsers)
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        // Don't create multiple oscillators
        if (this.isPlaying) {
            return;
        }

        try {
            // Create new oscillator
            this.oscillator = this.audioContext.createOscillator();
            this.oscillator.type = this.waveform;
            this.oscillator.frequency.value = this.frequency;
            
            // Connect oscillator to master gain
            this.oscillator.connect(this.masterGain);
            
            // Start the oscillator
            this.oscillator.start();
            this.isPlaying = true;
            
            console.log(`🎵 Playing ${this.waveform} wave at ${this.frequency}Hz`);
        } catch (error) {
            console.error('❌ Error starting oscillator:', error);
            this.isPlaying = false;
        }
    }

    /**
     * Stop the oscillator
     */
    stop() {
        if (!this.isPlaying || !this.oscillator) {
            return;
        }

        try {
            // Stop the oscillator
            this.oscillator.stop();
            this.oscillator.disconnect();
            this.oscillator = null;
            this.isPlaying = false;
            
            console.log('⏹️ Oscillator stopped');
        } catch (error) {
            console.error('❌ Error stopping oscillator:', error);
        }
    }

    /**
     * Update frequency in real-time
     * @param {number} freq - Frequency in Hz
     */
    setFrequency(freq) {
        this.frequency = freq;
        
        // Update playing oscillator immediately
        if (this.isPlaying && this.oscillator) {
            this.oscillator.frequency.setValueAtTime(
                freq, 
                this.audioContext.currentTime
            );
        }
    }

    /**
     * Update volume in real-time
     * @param {number} vol - Volume (0.0 to 1.0)
     */
    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol)); // Clamp between 0 and 1
        
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(
                this.volume,
                this.audioContext.currentTime
            );
        }
    }

    /**
     * Change waveform type
     * @param {string} type - 'sine', 'square', 'sawtooth', 'triangle'
     */
    setWaveform(type) {
        const validTypes = ['sine', 'square', 'sawtooth', 'triangle'];
        
        if (!validTypes.includes(type)) {
            console.warn(`Invalid waveform type: ${type}`);
            return;
        }

        this.waveform = type;
        
        // Update playing oscillator
        if (this.isPlaying && this.oscillator) {
            this.oscillator.type = type;
        }
    }

    /**
     * Get current audio engine state
     */
    getState() {
        return {
            initialized: this.initialized,
            isPlaying: this.isPlaying,
            frequency: this.frequency,
            volume: this.volume,
            waveform: this.waveform,
            contextState: this.audioContext ? this.audioContext.state : 'null'
        };
    }

    /**
     * Cleanup and release audio resources
     */
    async cleanup() {
        this.stop();
        
        if (this.audioContext) {
            await this.audioContext.close();
            this.audioContext = null;
        }
        
        this.initialized = false;
        console.log('🧹 Audio engine cleaned up');
    }
}

// Create global audio engine instance
const audioEngine = new AudioEngine();

// Expose to window for easy debugging
window.audioEngine = audioEngine;

console.log('🎹 Audio engine loaded and ready');
