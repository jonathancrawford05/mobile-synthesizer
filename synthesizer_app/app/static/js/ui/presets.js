/**
 * Preset management — save/load/delete synth parameter snapshots in localStorage.
 *
 * Each preset is a plain object with all synth parameter values.
 * Factory presets are built-in; user presets are stored in localStorage.
 */

const STORAGE_KEY = "mobileSynth_presets";

/** Default parameter values (matches engine constructor). */
const DEFAULT_PARAMS = {
  osc1: "sine",
  osc2: "square",
  osc3: "off",
  filterType: "lowpass",
  filterCutoff: 2000,
  filterQ: 1,
  attack: 0.01,
  decay: 0.1,
  sustain: 0.7,
  release: 0.3,
  delayEnabled: false,
  delayTime: 0.3,
  delayFeedback: 0.4,
  gain: 0.5,
};

/** Built-in presets users can start from. */
const FACTORY_PRESETS = [
  {
    name: "Init",
    category: "factory",
    params: { ...DEFAULT_PARAMS },
  },
  {
    name: "Warm Bass",
    category: "factory",
    params: {
      ...DEFAULT_PARAMS,
      osc1: "sawtooth",
      osc2: "square",
      osc3: "off",
      filterType: "lowpass",
      filterCutoff: 400,
      filterQ: 2,
      attack: 0.01,
      decay: 0.2,
      sustain: 0.6,
      release: 0.15,
    },
  },
  {
    name: "Bright Lead",
    category: "factory",
    params: {
      ...DEFAULT_PARAMS,
      osc1: "sawtooth",
      osc2: "sawtooth",
      osc3: "off",
      filterType: "lowpass",
      filterCutoff: 5000,
      filterQ: 3,
      attack: 0.01,
      decay: 0.1,
      sustain: 0.8,
      release: 0.2,
    },
  },
  {
    name: "Soft Pad",
    category: "factory",
    params: {
      ...DEFAULT_PARAMS,
      osc1: "triangle",
      osc2: "sine",
      osc3: "triangle",
      filterType: "lowpass",
      filterCutoff: 1200,
      filterQ: 0.5,
      attack: 0.8,
      decay: 0.5,
      sustain: 0.6,
      release: 1.5,
    },
  },
  {
    name: "Pluck",
    category: "factory",
    params: {
      ...DEFAULT_PARAMS,
      osc1: "triangle",
      osc2: "off",
      osc3: "off",
      filterType: "lowpass",
      filterCutoff: 3000,
      filterQ: 4,
      attack: 0.002,
      decay: 0.3,
      sustain: 0.0,
      release: 0.1,
    },
  },
  {
    name: "Echo Keys",
    category: "factory",
    params: {
      ...DEFAULT_PARAMS,
      osc1: "sine",
      osc2: "triangle",
      osc3: "off",
      filterType: "lowpass",
      filterCutoff: 2500,
      filterQ: 1,
      attack: 0.01,
      decay: 0.15,
      sustain: 0.5,
      release: 0.4,
      delayEnabled: true,
      delayTime: 0.35,
      delayFeedback: 0.45,
    },
  },
  {
    name: "Sub Drone",
    category: "factory",
    params: {
      ...DEFAULT_PARAMS,
      osc1: "sine",
      osc2: "sine",
      osc3: "sine",
      filterType: "lowpass",
      filterCutoff: 600,
      filterQ: 0.7,
      attack: 1.5,
      decay: 0.5,
      sustain: 0.9,
      release: 2.0,
    },
  },
];

/** Load user presets from localStorage. */
function loadUserPresets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Save user presets array to localStorage. */
function saveUserPresets(presets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

/** Get all presets (factory + user). */
export function getAllPresets() {
  return [...FACTORY_PRESETS, ...loadUserPresets()];
}

/** Get factory presets only. */
export function getFactoryPresets() {
  return [...FACTORY_PRESETS];
}

/** Get user presets only. */
export function getUserPresets() {
  return loadUserPresets();
}

/** Save a new user preset. Returns the full user preset list. */
export function savePreset(name, params) {
  const presets = loadUserPresets();
  // Overwrite if same name exists
  const idx = presets.findIndex((p) => p.name === name);
  const preset = { name, category: "user", params: { ...params } };
  if (idx >= 0) {
    presets[idx] = preset;
  } else {
    presets.push(preset);
  }
  saveUserPresets(presets);
  return presets;
}

/** Delete a user preset by name. */
export function deletePreset(name) {
  const presets = loadUserPresets().filter((p) => p.name !== name);
  saveUserPresets(presets);
  return presets;
}

/**
 * Read current synth params from the DOM (synthesizer page controls).
 * Returns a params object matching the preset format.
 */
export function readParamsFromDOM() {
  const val = (id, fallback) => {
    const el = document.getElementById(id);
    return el ? el.value : fallback;
  };
  return {
    osc1: val("osc1-type", DEFAULT_PARAMS.osc1),
    osc2: val("osc2-type", DEFAULT_PARAMS.osc2),
    osc3: val("osc3-type", DEFAULT_PARAMS.osc3),
    filterType: val("filter-type", DEFAULT_PARAMS.filterType),
    filterCutoff: Number(val("filter-cutoff", DEFAULT_PARAMS.filterCutoff)),
    filterQ: Number(val("filter-q", DEFAULT_PARAMS.filterQ)),
    attack: Number(val("attack", DEFAULT_PARAMS.attack)),
    decay: Number(val("decay", DEFAULT_PARAMS.decay)),
    sustain: Number(val("sustain", DEFAULT_PARAMS.sustain)),
    release: Number(val("release", DEFAULT_PARAMS.release)),
    delayEnabled: val("delay-enable", "off") === "on",
    delayTime: Number(val("delay-time", DEFAULT_PARAMS.delayTime)),
    delayFeedback: Number(val("delay-feedback", DEFAULT_PARAMS.delayFeedback)),
    gain: Number(val("gain-slider", DEFAULT_PARAMS.gain)),
  };
}

/**
 * Apply a preset's params to the engine and update DOM controls.
 * @param {object} params
 * @param {import('../audio/engine.js').AudioEngine} engine
 */
export function applyPreset(params, engine) {
  // Update engine
  engine.setOscWaveform(0, params.osc1);
  engine.setOscWaveform(1, params.osc2);
  engine.setOscWaveform(2, params.osc3);
  engine.setFilterType(params.filterType);
  engine.setFilterCutoff(params.filterCutoff);
  engine.setFilterQ(params.filterQ);
  engine.setAttack(params.attack);
  engine.setDecay(params.decay);
  engine.setSustain(params.sustain);
  engine.setRelease(params.release);
  engine.setDelayEnabled(params.delayEnabled);
  engine.setDelayTime(params.delayTime);
  engine.setDelayFeedback(params.delayFeedback);
  engine.setGain(params.gain);

  // Update DOM elements (if on synthesizer page)
  setVal("osc1-type", params.osc1);
  setVal("osc2-type", params.osc2);
  setVal("osc3-type", params.osc3);
  setVal("filter-type", params.filterType);
  setRange("filter-cutoff", params.filterCutoff, "filter-cutoff-value", Math.round(params.filterCutoff) + " Hz");
  setRange("filter-q", params.filterQ, "filter-q-value", params.filterQ.toFixed(1));
  setRange("attack", params.attack, "attack-value", params.attack.toFixed(2) + " s");
  setRange("decay", params.decay, "decay-value", params.decay.toFixed(2) + " s");
  setRange("sustain", params.sustain, "sustain-value", Math.round(params.sustain * 100) + "%");
  setRange("release", params.release, "release-value", params.release.toFixed(2) + " s");
  setVal("delay-enable", params.delayEnabled ? "on" : "off");
  setRange("delay-time", params.delayTime, "delay-time-value", Math.round(params.delayTime * 1000) + " ms");
  setRange("delay-feedback", params.delayFeedback, "delay-feedback-value", Math.round(params.delayFeedback * 100) + "%");
  setRange("gain-slider", params.gain, "gain-value", Math.round(params.gain * 100) + "%");
}

function setVal(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function setRange(sliderId, value, readoutId, displayText) {
  const slider = document.getElementById(sliderId);
  if (slider) slider.value = value;
  const readout = document.getElementById(readoutId);
  if (readout) readout.textContent = displayText;
}

export { DEFAULT_PARAMS };
