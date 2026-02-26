/**
 * UI control bindings — wires DOM elements on the synthesizer page
 * to the AudioEngine instance.
 *
 * Safe to call on pages that lack these elements — missing IDs are skipped.
 */

import { initKeyboard } from "./keyboard.js";
import {
  getAllPresets,
  savePreset,
  readParamsFromDOM,
  applyPreset,
} from "./presets.js";

/**
 * @param {import('../audio/engine.js').AudioEngine} engine
 */
export function bindControls(engine) {
  initKeyboard(document.getElementById("keyboard"), engine);
  bindGainSlider(engine);
  bindOscillators(engine);
  bindFilter(engine);
  bindADSR(engine);
  bindDelay(engine);
  bindPresetSelector(engine);
}

/* ---- master gain ---- */

function bindGainSlider(engine) {
  const slider = document.getElementById("gain-slider");
  const readout = document.getElementById("gain-value");
  if (!slider) return;

  const update = () => {
    const level = Number(slider.value);
    engine.setGain(level);
    if (readout) readout.textContent = Math.round(level * 100) + "%";
  };

  slider.addEventListener("input", update);
  update();
}

/* ---- oscillators (3) ---- */

function bindOscillators(engine) {
  const ids = ["osc1-type", "osc2-type", "osc3-type"];

  ids.forEach((id, index) => {
    const select = document.getElementById(id);
    if (!select) return;

    // Sync initial value from DOM → engine
    engine.setOscWaveform(index, select.value);

    select.addEventListener("change", () => {
      engine.setOscWaveform(index, select.value);
    });
  });
}

/* ---- filter ---- */

function bindFilter(engine) {
  bindSelect("filter-type", (val) => engine.setFilterType(val));

  bindSlider("filter-cutoff", "filter-cutoff-value", (val) => {
    engine.setFilterCutoff(val);
    return Math.round(val) + " Hz";
  });

  bindSlider("filter-q", "filter-q-value", (val) => {
    engine.setFilterQ(val);
    return val.toFixed(1);
  });
}

/* ---- ADSR ---- */

function bindADSR(engine) {
  bindSlider("attack", "attack-value", (val) => {
    engine.setAttack(val);
    return val.toFixed(2) + " s";
  });

  bindSlider("decay", "decay-value", (val) => {
    engine.setDecay(val);
    return val.toFixed(2) + " s";
  });

  bindSlider("sustain", "sustain-value", (val) => {
    engine.setSustain(val);
    return Math.round(val * 100) + "%";
  });

  bindSlider("release", "release-value", (val) => {
    engine.setRelease(val);
    return val.toFixed(2) + " s";
  });
}

/* ---- delay ---- */

function bindDelay(engine) {
  const toggle = document.getElementById("delay-enable");
  if (toggle) {
    toggle.addEventListener("change", () => {
      engine.setDelayEnabled(toggle.value === "on");
    });
  }

  bindSlider("delay-time", "delay-time-value", (val) => {
    engine.setDelayTime(val);
    return Math.round(val * 1000) + " ms";
  });

  bindSlider("delay-feedback", "delay-feedback-value", (val) => {
    engine.setDelayFeedback(val);
    return Math.round(val * 100) + "%";
  });
}

/* ---- presets ---- */

function bindPresetSelector(engine) {
  const select = document.getElementById("preset-select");
  const saveBtn = document.getElementById("preset-save");
  if (!select) return;

  function populateList() {
    const presets = getAllPresets();
    // Keep the first "Select preset..." option
    select.innerHTML = '<option value="">Select preset...</option>';
    presets.forEach((p, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = p.name + (p.category === "factory" ? "" : " (user)");
      select.appendChild(opt);
    });
  }

  select.addEventListener("change", () => {
    const idx = Number(select.value);
    if (isNaN(idx)) return;
    const presets = getAllPresets();
    if (presets[idx]) {
      applyPreset(presets[idx].params, engine);
    }
  });

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const name = prompt("Preset name:");
      if (!name || !name.trim()) return;
      const params = readParamsFromDOM();
      savePreset(name.trim(), params);
      populateList();
    });
  }

  populateList();
}

/* ---- helpers ---- */

function bindSlider(sliderId, readoutId, handler) {
  const slider = document.getElementById(sliderId);
  const readout = document.getElementById(readoutId);
  if (!slider) return;

  const update = () => {
    const val = Number(slider.value);
    const label = handler(val);
    if (readout && label !== undefined) {
      readout.textContent = label;
    }
  };

  slider.addEventListener("input", update);
  update();
}

function bindSelect(selectId, handler) {
  const select = document.getElementById(selectId);
  if (!select) return;

  handler(select.value);
  select.addEventListener("change", () => handler(select.value));
}
