/**
 * Mobile Synthesizer — application entry point.
 *
 * Bootstraps the audio engine and wires UI controls on the synthesizer page.
 * Other pages load this script but the bindings silently no-op when the
 * expected DOM elements are absent.
 */

import { AudioEngine } from "./audio/engine.js";
import { bindControls } from "./ui/controls.js";

document.addEventListener("DOMContentLoaded", () => {
  const engine = new AudioEngine();
  bindControls(engine);
});
