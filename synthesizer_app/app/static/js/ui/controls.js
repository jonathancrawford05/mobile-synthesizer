/**
 * UI control bindings — wires DOM elements on the synthesizer page
 * to the AudioEngine instance.
 */

/**
 * Bind all synthesizer controls to the given engine.
 * Safe to call on pages that lack these elements — missing IDs are skipped.
 *
 * @param {import('../audio/engine.js').AudioEngine} engine
 */
export function bindControls(engine) {
  bindPlayButton(engine);
  bindWaveformSelect(engine);
  bindFrequencySlider(engine);
  bindGainSlider(engine);
}

/* ---- individual bindings ---- */

function bindPlayButton(engine) {
  const btn = document.getElementById("play-toggle");
  if (!btn) return;

  const label = btn.querySelector(".play-label");

  btn.addEventListener("click", () => {
    const playing = engine.toggle();
    if (label) {
      label.textContent = playing ? "Stop" : "Play";
    }
    btn.setAttribute("aria-pressed", String(playing));
  });
}

function bindWaveformSelect(engine) {
  const select = document.getElementById("osc1-type");
  if (!select) return;

  select.addEventListener("change", () => {
    engine.setWaveform(select.value);
  });
}

function bindFrequencySlider(engine) {
  const slider = document.getElementById("freq-slider");
  const readout = document.getElementById("freq-value");
  if (!slider) return;

  const update = () => {
    const hz = Number(slider.value);
    engine.setFrequency(hz);
    if (readout) {
      readout.textContent = hz + " Hz";
    }
  };

  slider.addEventListener("input", update);
  // Set initial readout
  update();
}

function bindGainSlider(engine) {
  const slider = document.getElementById("gain-slider");
  const readout = document.getElementById("gain-value");
  if (!slider) return;

  const update = () => {
    const level = Number(slider.value);
    engine.setGain(level);
    if (readout) {
      readout.textContent = Math.round(level * 100) + "%";
    }
  };

  slider.addEventListener("input", update);
  // Set initial readout
  update();
}
