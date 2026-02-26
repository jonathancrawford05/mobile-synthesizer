/**
 * Polyphonic audio engine — each note gets its own voice (oscillators + ADSR),
 * feeding into a shared filter → delay → master chain.
 *
 * Voice (per note):
 *   Osc1 ─┐
 *   Osc2 ─┼─→ EnvGain (per-voice ADSR)
 *   Osc3 ─┘
 *
 * Shared chain:
 *   All voices ─→ BiquadFilter ─→ Delay (wet/dry) ─→ MasterGain ─→ Destination
 *
 * Usage:
 *   const engine = new AudioEngine();
 *   engine.noteOn(60);  // middle C
 *   engine.noteOff(60);
 */

export class AudioEngine {
  constructor() {
    /** @type {AudioContext | null} */
    this._ctx = null;

    // --- Voice management ---
    /** @type {Map<number, {oscs: OscillatorNode[], oscGains: GainNode[], envGain: GainNode}>} */
    this._voices = new Map();
    this._maxPolyphony = 8;

    // --- Oscillator settings (shared across voices) ---
    this._waveforms = ["sine", "square", "off"];
    this._oscLevels = [0.5, 0.5, 0.5];

    // --- Filter (shared) ---
    /** @type {BiquadFilterNode | null} */
    this._filter = null;
    this._filterType = "lowpass";
    this._filterCutoff = 2000;
    this._filterQ = 1;

    // --- ADSR ---
    this._attack = 0.01;
    this._decay = 0.1;
    this._sustain = 0.7;
    this._release = 0.3;

    // --- Delay (shared) ---
    /** @type {DelayNode | null} */
    this._delayNode = null;
    /** @type {GainNode | null} */
    this._delayFeedback = null;
    /** @type {GainNode | null} */
    this._delayWet = null;
    /** @type {GainNode | null} */
    this._dryGain = null;
    this._delayTime = 0.3;
    this._delayFeedbackValue = 0.4;
    this._delayEnabled = false;

    // --- Master (shared) ---
    this._masterGainValue = 0.5;
    /** @type {GainNode | null} */
    this._masterGain = null;

    // Shared chain state
    this._chainBuilt = false;
  }

  /* ---- public getters ---- */

  get playing() {
    return this._voices.size > 0;
  }

  /** Expose AudioContext (created on first note). */
  get context() {
    return this._ctx;
  }

  /** Expose master gain node for recording tap. */
  get masterGainNode() {
    return this._masterGain;
  }

  /* ---- note API ---- */

  /** Play a note by MIDI number (e.g. 60 = C4). */
  noteOn(midiNote) {
    if (this._voices.has(midiNote)) return;

    // Voice stealing: drop oldest voice if at capacity
    if (this._voices.size >= this._maxPolyphony) {
      const oldest = this._voices.keys().next().value;
      this.noteOff(oldest);
    }

    this._ensureChain();

    const freq = 440 * Math.pow(2, (midiNote - 69) / 12);
    const voice = this._createVoice(freq);
    this._voices.set(midiNote, voice);
  }

  /** Release a note — triggers ADSR release, then cleans up. */
  noteOff(midiNote) {
    const voice = this._voices.get(midiNote);
    if (!voice) return;
    this._voices.delete(midiNote);
    this._releaseVoice(voice);
  }

  /** Stop all active notes. */
  stop() {
    for (const note of [...this._voices.keys()]) {
      this.noteOff(note);
    }
  }

  /** Toggle a single note (middle C) — for the play button. */
  toggle() {
    if (this._voices.size > 0) {
      this.stop();
      return false;
    }
    this.noteOn(60);
    return true;
  }

  /* ---- oscillator controls ---- */

  /** Set waveform for oscillator slot (0–2). Takes effect on next noteOn. */
  setOscWaveform(index, type) {
    this._waveforms[index] = type;
    // Update currently playing voices where possible
    for (const voice of this._voices.values()) {
      if (voice.oscs[index] && type !== "off") {
        voice.oscs[index].type = type;
      }
    }
  }

  /** Set per-oscillator mix level (0–1). */
  setOscLevel(index, level) {
    this._oscLevels[index] = level;
    for (const voice of this._voices.values()) {
      if (voice.oscGains[index]) {
        voice.oscGains[index].gain.value = level;
      }
    }
  }

  /* ---- filter controls ---- */

  setFilterType(type) {
    this._filterType = type;
    if (this._filter) this._filter.type = type;
  }

  setFilterCutoff(hz) {
    this._filterCutoff = hz;
    if (this._filter) this._filter.frequency.value = hz;
  }

  setFilterQ(q) {
    this._filterQ = q;
    if (this._filter) this._filter.Q.value = q;
  }

  /* ---- ADSR controls ---- */

  setAttack(s) {
    this._attack = s;
  }

  setDecay(s) {
    this._decay = s;
  }

  setSustain(level) {
    this._sustain = level;
  }

  setRelease(s) {
    this._release = s;
  }

  /* ---- delay controls ---- */

  setDelayTime(s) {
    this._delayTime = s;
    if (this._delayNode) this._delayNode.delayTime.value = s;
  }

  setDelayFeedback(level) {
    this._delayFeedbackValue = level;
    if (this._delayFeedback) this._delayFeedback.gain.value = level;
  }

  setDelayEnabled(on) {
    this._delayEnabled = on;
    if (this._delayWet) {
      this._delayWet.gain.value = on ? 0.5 : 0;
    }
  }

  /* ---- master gain ---- */

  setGain(level) {
    this._masterGainValue = level;
    if (this._masterGain) this._masterGain.gain.value = level;
  }

  /* ---- internal: context & shared chain ---- */

  _ensureContext() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this._ctx.state === "suspended") {
      this._ctx.resume();
    }
  }

  /** Build the shared signal chain once (filter → delay → master → destination). */
  _ensureChain() {
    if (this._chainBuilt) {
      this._ensureContext();
      return;
    }
    this._ensureContext();
    const ctx = this._ctx;

    // Master gain → destination
    this._masterGain = ctx.createGain();
    this._masterGain.gain.value = this._masterGainValue;
    this._masterGain.connect(ctx.destination);

    // Delay effect
    this._dryGain = ctx.createGain();
    this._dryGain.gain.value = 1;
    this._dryGain.connect(this._masterGain);

    this._delayNode = ctx.createDelay(2.0);
    this._delayNode.delayTime.value = this._delayTime;

    this._delayFeedback = ctx.createGain();
    this._delayFeedback.gain.value = this._delayFeedbackValue;
    this._delayNode.connect(this._delayFeedback);
    this._delayFeedback.connect(this._delayNode);

    this._delayWet = ctx.createGain();
    this._delayWet.gain.value = this._delayEnabled ? 0.5 : 0;
    this._delayNode.connect(this._delayWet);
    this._delayWet.connect(this._masterGain);

    // Filter → dry + delay input
    this._filter = ctx.createBiquadFilter();
    this._filter.type = this._filterType;
    this._filter.frequency.value = this._filterCutoff;
    this._filter.Q.value = this._filterQ;
    this._filter.connect(this._dryGain);
    this._filter.connect(this._delayNode);

    this._chainBuilt = true;
  }

  /* ---- internal: per-voice creation ---- */

  _createVoice(freq) {
    const ctx = this._ctx;

    // Per-voice envelope gain → shared filter
    const envGain = ctx.createGain();
    envGain.gain.value = 0;
    envGain.connect(this._filter);

    // Create oscillators for this voice
    const oscs = [null, null, null];
    const oscGains = [null, null, null];

    for (let i = 0; i < 3; i++) {
      if (this._waveforms[i] === "off") continue;

      oscGains[i] = ctx.createGain();
      oscGains[i].gain.value = this._oscLevels[i];
      oscGains[i].connect(envGain);

      oscs[i] = ctx.createOscillator();
      oscs[i].type = this._waveforms[i];
      oscs[i].frequency.value = freq;
      oscs[i].connect(oscGains[i]);
      oscs[i].start();
    }

    // Trigger ADSR attack
    const now = ctx.currentTime;
    const g = envGain.gain;
    g.setValueAtTime(0, now);
    g.linearRampToValueAtTime(1, now + Math.max(this._attack, 0.002));
    g.linearRampToValueAtTime(
      this._sustain,
      now + Math.max(this._attack, 0.002) + Math.max(this._decay, 0.002)
    );

    return { oscs, oscGains, envGain };
  }

  _releaseVoice(voice) {
    const now = this._ctx.currentTime;
    const g = voice.envGain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0, now + Math.max(this._release, 0.005));

    // Schedule node cleanup after release completes
    const ms = this._release * 1000 + 80;
    setTimeout(() => {
      for (let i = 0; i < 3; i++) {
        if (voice.oscs[i]) {
          voice.oscs[i].stop();
          voice.oscs[i].disconnect();
        }
        if (voice.oscGains[i]) {
          voice.oscGains[i].disconnect();
        }
      }
      voice.envGain.disconnect();
    }, ms);
  }

  /* ---- MIDI helpers ---- */

  /** Convert MIDI note number to note name (e.g. 60 → "C4"). */
  static midiToName(midi) {
    const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const octave = Math.floor(midi / 12) - 1;
    return names[midi % 12] + octave;
  }
}
