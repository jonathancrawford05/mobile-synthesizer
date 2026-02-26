/**
 * Mobile Synthesizer — application entry point.
 *
 * Bootstraps the audio engine and wires UI controls on the synthesizer page.
 * Other pages load this script but the bindings silently no-op when the
 * expected DOM elements are absent.
 */

import { AudioEngine } from "./audio/engine.js";
import { bindControls } from "./ui/controls.js";
import { getAllPresets, applyPreset } from "./ui/presets.js";

document.addEventListener("DOMContentLoaded", () => {
  const engine = new AudioEngine();
  bindControls(engine);

  // Load preset from URL query parameter (e.g. ?preset=Warm+Bass)
  const params = new URLSearchParams(window.location.search);
  const presetName = params.get("preset");
  if (presetName) {
    const preset = getAllPresets().find((p) => p.name === presetName);
    if (preset) {
      applyPreset(preset.params, engine);
      // Update preset selector if present
      const select = document.getElementById("preset-select");
      if (select) {
        for (const opt of select.options) {
          if (opt.textContent.startsWith(presetName)) {
            select.value = opt.value;
            break;
          }
        }
      }
    }
  }
});
