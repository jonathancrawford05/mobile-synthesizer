/**
 * Audio engine — manages a multi-oscillator synth with filter, ADSR, and delay.
 *
 * Signal chain:
 *   Osc1 ─┐
 *   Osc2 ─┼─→ BiquadFilter ─→ ADSR Gain ─→ Delay (wet/dry) ─→ Master Gain ─→ Destination
 *   Osc3 ─┘
 *
 * Usage:
 *   const engine = new AudioEngine();
 *   engine.start();
 *   engine.setOscWaveform(0, "square");
 *   engine.setFilterCutoff(800);
 *   engine.setAttack(0.2);
 *   engine.setDelayEnabled(true);
 *   engine.stop();
 */

export class AudioEngine {
  constructor() {
    /** @type {AudioContext | null} */
    this._ctx = null;
    this._playing = false;

    // --- Oscillators (3) ---
    /** @type {(OscillatorNode | null)[]} */
    this._oscs = [null, null, null];
    /** @type {(GainNode | null)[]} */
    this._oscGains = [null, null, null];
    this._waveforms = ["sine", "square", "off"];
    this._oscLevels = [0.5, 0.5, 0.5];
    this._frequency = 440;

    // --- Filter ---
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
    /** @type {GainNode | null} */
    this._envGain = null;

    // --- Delay effect ---
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

    // --- Master ---
    this._masterGainValue = 0.5;
    /** @type {GainNode | null} */
    this._masterGain = null;

    // Cleanup timer for release tail
    this._releaseTimer = null;
  }

  /* ---- public getters ---- */

  get playing() {
    return this._playing;
  }

  /* ---- lifecycle ---- */

  /**
   * Start the synth. First call creates the AudioContext
   * (must happen inside a user-gesture handler on mobile).
   */
  start() {
    if (this._playing) return;

    // Cancel any pending release cleanup
    if (this._releaseTimer) {
      clearTimeout(this._releaseTimer);
      this._releaseTimer = null;
      this._teardown();
    }

    this._ensureContext();
    this._buildGraph();
    this._triggerAttack();
    this._playing = true;
  }

  /** Stop the synth — applies release envelope then cleans up. */
  stop() {
    if (!this._playing) return;
    this._playing = false;
    this._triggerRelease();

    // Teardown after release completes
    const ms = this._release * 1000 + 80;
    this._releaseTimer = setTimeout(() => {
      this._teardown();
      this._releaseTimer = null;
    }, ms);
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

  /* ---- oscillator controls ---- */

  /** Set frequency in Hz for all oscillators. */
  setFrequency(hz) {
    this._frequency = hz;
    for (const osc of this._oscs) {
      if (osc) osc.frequency.value = hz;
    }
  }

  /** Set waveform for a specific oscillator (index 0–2). */
  setOscWaveform(index, type) {
    this._waveforms[index] = type;
    // If playing, rebuild is needed when toggling off ↔ on
    if (this._oscs[index] && type !== "off") {
      this._oscs[index].type = type;
    } else if (this._playing) {
      // Toggled off→on or on→off: rebuild the graph
      this._rebuildWhilePlaying();
    }
  }

  /** Set individual oscillator gain (0–1). */
  setOscLevel(index, level) {
    this._oscLevels[index] = level;
    if (this._oscGains[index]) {
      this._oscGains[index].gain.value = level;
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

  /* ---- internal: context ---- */

  _ensureContext() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this._ctx.state === "suspended") {
      this._ctx.resume();
    }
  }

  /* ---- internal: graph construction ---- */

  _buildGraph() {
    const ctx = this._ctx;

    // Master gain → destination
    this._masterGain = ctx.createGain();
    this._masterGain.gain.value = this._masterGainValue;
    this._masterGain.connect(ctx.destination);

    // Delay effect → master
    this._buildDelay();
    this._dryGain.connect(this._masterGain);
    this._delayWet.connect(this._masterGain);

    // Envelope gain → dry + delay input
    this._envGain = ctx.createGain();
    this._envGain.gain.value = 0; // ADSR starts at 0
    this._envGain.connect(this._dryGain);
    this._envGain.connect(this._delayNode);

    // Filter → envelope
    this._filter = ctx.createBiquadFilter();
    this._filter.type = this._filterType;
    this._filter.frequency.value = this._filterCutoff;
    this._filter.Q.value = this._filterQ;
    this._filter.connect(this._envGain);

    // Oscillators → filter
    for (let i = 0; i < 3; i++) {
      if (this._waveforms[i] === "off") continue;

      this._oscGains[i] = ctx.createGain();
      this._oscGains[i].gain.value = this._oscLevels[i];
      this._oscGains[i].connect(this._filter);

      this._oscs[i] = ctx.createOscillator();
      this._oscs[i].type = this._waveforms[i];
      this._oscs[i].frequency.value = this._frequency;
      this._oscs[i].connect(this._oscGains[i]);
      this._oscs[i].start();
    }
  }

  _buildDelay() {
    const ctx = this._ctx;

    // Dry pass-through
    this._dryGain = ctx.createGain();
    this._dryGain.gain.value = 1;

    // Delay line
    this._delayNode = ctx.createDelay(2.0);
    this._delayNode.delayTime.value = this._delayTime;

    // Feedback loop
    this._delayFeedback = ctx.createGain();
    this._delayFeedback.gain.value = this._delayFeedbackValue;
    this._delayNode.connect(this._delayFeedback);
    this._delayFeedback.connect(this._delayNode);

    // Wet output
    this._delayWet = ctx.createGain();
    this._delayWet.gain.value = this._delayEnabled ? 0.5 : 0;
    this._delayNode.connect(this._delayWet);
  }

  /* ---- internal: ADSR ---- */

  _triggerAttack() {
    const now = this._ctx.currentTime;
    const g = this._envGain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(0, now);
    g.linearRampToValueAtTime(1, now + this._attack);
    g.linearRampToValueAtTime(this._sustain, now + this._attack + this._decay);
  }

  _triggerRelease() {
    const now = this._ctx.currentTime;
    const g = this._envGain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0, now + this._release);
  }

  /* ---- internal: teardown ---- */

  _teardown() {
    for (let i = 0; i < 3; i++) {
      if (this._oscs[i]) {
        this._oscs[i].stop();
        this._oscs[i].disconnect();
        this._oscs[i] = null;
      }
      if (this._oscGains[i]) {
        this._oscGains[i].disconnect();
        this._oscGains[i] = null;
      }
    }
    const nodes = [
      "_filter",
      "_envGain",
      "_masterGain",
      "_delayNode",
      "_delayFeedback",
      "_delayWet",
      "_dryGain",
    ];
    for (const key of nodes) {
      if (this[key]) {
        this[key].disconnect();
        this[key] = null;
      }
    }
  }

  /** Rebuild the graph without audible gap (used when toggling an osc on/off). */
  _rebuildWhilePlaying() {
    this._teardown();
    this._buildGraph();
    // Jump straight to sustain level (skip attack since we're already playing)
    const now = this._ctx.currentTime;
    this._envGain.gain.cancelScheduledValues(now);
    this._envGain.gain.setValueAtTime(this._sustain, now);
  }
}
