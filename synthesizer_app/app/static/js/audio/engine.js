/**
 * Audio engine — manages a single oscillator → gain → destination chain.
 *
 * Usage:
 *   const engine = new AudioEngine();
 *   engine.start();            // begin playing (resumes AudioContext on first call)
 *   engine.setFrequency(880);  // Hz
 *   engine.setWaveform("square");
 *   engine.setGain(0.3);       // 0–1
 *   engine.stop();
 */

export class AudioEngine {
  constructor() {
    /** @type {AudioContext | null} */
    this._ctx = null;
    /** @type {OscillatorNode | null} */
    this._osc = null;
    /** @type {GainNode | null} */
    this._gain = null;
    this._playing = false;
    this._frequency = 440;
    this._waveform = "sine";
    this._gainValue = 0.5;
  }

  /* ---- public API ---- */

  get playing() {
    return this._playing;
  }

  /**
   * Start the oscillator.  The first call also creates the AudioContext
   * (must happen inside a user-gesture handler on mobile).
   */
  start() {
    if (this._playing) return;

    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Ensure context is running (mobile browsers suspend by default)
    if (this._ctx.state === "suspended") {
      this._ctx.resume();
    }

    this._gain = this._ctx.createGain();
    this._gain.gain.value = this._gainValue;
    this._gain.connect(this._ctx.destination);

    this._osc = this._ctx.createOscillator();
    this._osc.type = this._waveform;
    this._osc.frequency.value = this._frequency;
    this._osc.connect(this._gain);
    this._osc.start();

    this._playing = true;
  }

  /** Stop the oscillator and clean up nodes. */
  stop() {
    if (!this._playing || !this._osc) return;

    this._osc.stop();
    this._osc.disconnect();
    this._gain.disconnect();
    this._osc = null;
    this._gain = null;
    this._playing = false;
  }

  /** Toggle play / stop — returns the new playing state. */
  toggle() {
    if (this._playing) {
      this.stop();
    } else {
      this.start();
    }
    return this._playing;
  }

  /** Set oscillator frequency in Hz (applied immediately if playing). */
  setFrequency(hz) {
    this._frequency = hz;
    if (this._osc) {
      this._osc.frequency.value = hz;
    }
  }

  /** Set waveform type: "sine" | "square" | "sawtooth" | "triangle". */
  setWaveform(type) {
    this._waveform = type;
    if (this._osc) {
      this._osc.type = type;
    }
  }

  /** Set gain level 0–1 (applied immediately if playing). */
  setGain(level) {
    this._gainValue = level;
    if (this._gain) {
      this._gain.gain.value = level;
    }
  }
}
