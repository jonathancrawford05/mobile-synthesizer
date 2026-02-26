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
import { AudioRecorder, downloadBlob } from "./audio/recorder.js";

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

  // --- Recording ---
  const recordBtn = document.getElementById("record-btn");
  const recordLabel = document.getElementById("record-label");
  const recordTimer = document.getElementById("record-timer");
  if (recordBtn) {
    let recorder = null;
    let timerInterval = null;
    let startTime = 0;

    function formatTime(ms) {
      const s = Math.floor(ms / 1000);
      const m = Math.floor(s / 60);
      return m + ":" + String(s % 60).padStart(2, "0");
    }

    recordBtn.addEventListener("click", async () => {
      if (recorder && recorder.recording) {
        // Stop recording
        const blob = await recorder.stop();
        recordLabel.textContent = "Record";
        document.body.classList.remove("recording-active");
        recordTimer.classList.add("hidden");
        clearInterval(timerInterval);

        if (blob && blob.size > 0) {
          const ext = blob.type.includes("ogg") ? "ogg" : "webm";
          const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
          downloadBlob(blob, "synth-recording-" + ts + "." + ext);
        }
      } else {
        // Need the audio chain to exist first — play a silent note to init
        if (!engine.context || !engine.masterGainNode) {
          engine.noteOn(0);
          engine.noteOff(0);
          // Small delay to let the chain build
          await new Promise((r) => setTimeout(r, 100));
        }
        recorder = new AudioRecorder(engine.context, engine.masterGainNode);
        recorder.start();
        recordLabel.textContent = "Stop";
        document.body.classList.add("recording-active");
        startTime = Date.now();
        recordTimer.textContent = "0:00";
        recordTimer.classList.remove("hidden");
        timerInterval = setInterval(() => {
          recordTimer.textContent = formatTime(Date.now() - startTime);
        }, 500);
      }
    });
  }
});
