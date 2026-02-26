/**
 * Step sequencer — a grid of note × step cells that loops and triggers
 * the AudioEngine's noteOn/noteOff.
 *
 * Grid: 16 steps × configurable note rows (default 1 octave, C4–B4).
 * Each cell toggles on/off. Playback loops through columns left→right.
 */

import { AudioEngine } from "../audio/engine.js";

const STEPS = 16;

// Notes from high to low (rows top→bottom)
const SCALE_NOTES = [
  { name: "B4", midi: 71 },
  { name: "A4", midi: 69 },
  { name: "G4", midi: 67 },
  { name: "F4", midi: 65 },
  { name: "E4", midi: 64 },
  { name: "D4", midi: 62 },
  { name: "C4", midi: 60 },
  { name: "B3", midi: 59 },
  { name: "A3", midi: 57 },
  { name: "G3", midi: 55 },
  { name: "F3", midi: 53 },
  { name: "E3", midi: 52 },
  { name: "D3", midi: 50 },
  { name: "C3", midi: 48 },
];

/**
 * @param {HTMLElement} container — element with id="seq-grid"
 * @param {AudioEngine} engine
 */
export function initSequencer(container, engine) {
  if (!container) return;

  // State
  const grid = []; // grid[row][step] = boolean
  for (let r = 0; r < SCALE_NOTES.length; r++) {
    grid.push(new Array(STEPS).fill(false));
  }

  let playing = false;
  let currentStep = -1;
  let tempo = 120;
  let timerId = null;
  let stepDuration = 60000 / tempo / 4; // 16th notes

  // DOM refs
  const playBtn = document.getElementById("seq-play");
  const stopBtn = document.getElementById("seq-stop");
  const clearBtn = document.getElementById("seq-clear");
  const tempoSlider = document.getElementById("seq-tempo");
  const tempoValue = document.getElementById("seq-tempo-value");
  const stepIndicators = [];

  // --- Build grid ---
  function render() {
    container.innerHTML = "";

    // Header row with step numbers
    const headerRow = document.createElement("div");
    headerRow.className = "seq-row seq-header";
    const cornerCell = document.createElement("div");
    cornerCell.className = "seq-label";
    headerRow.appendChild(cornerCell);
    for (let s = 0; s < STEPS; s++) {
      const cell = document.createElement("div");
      cell.className = "seq-step-num";
      cell.textContent = s + 1;
      const indicator = document.createElement("div");
      indicator.className = "seq-indicator";
      cell.appendChild(indicator);
      stepIndicators.push(indicator);
      headerRow.appendChild(cell);
    }
    container.appendChild(headerRow);

    // Note rows
    for (let r = 0; r < SCALE_NOTES.length; r++) {
      const row = document.createElement("div");
      row.className = "seq-row";

      const label = document.createElement("div");
      label.className = "seq-label";
      label.textContent = SCALE_NOTES[r].name;
      // Highlight C notes
      if (SCALE_NOTES[r].name.startsWith("C")) {
        label.classList.add("seq-label--root");
      }
      row.appendChild(label);

      for (let s = 0; s < STEPS; s++) {
        const cell = document.createElement("button");
        cell.className = "seq-cell";
        if (s % 4 === 0) cell.classList.add("seq-cell--beat");
        cell.dataset.row = r;
        cell.dataset.step = s;
        if (grid[r][s]) cell.classList.add("seq-cell--on");
        row.appendChild(cell);
      }

      container.appendChild(row);
    }
  }

  // --- Cell toggle ---
  container.addEventListener("click", (e) => {
    const cell = e.target.closest(".seq-cell");
    if (!cell) return;
    const r = Number(cell.dataset.row);
    const s = Number(cell.dataset.step);
    grid[r][s] = !grid[r][s];
    cell.classList.toggle("seq-cell--on");
  });

  // --- Playback ---
  function tick() {
    // Turn off notes from previous step
    if (currentStep >= 0) {
      for (let r = 0; r < SCALE_NOTES.length; r++) {
        if (grid[r][currentStep]) {
          engine.noteOff(SCALE_NOTES[r].midi);
        }
      }
      stepIndicators[currentStep].classList.remove("seq-indicator--active");
    }

    // Advance
    currentStep = (currentStep + 1) % STEPS;

    // Highlight current step
    stepIndicators[currentStep].classList.add("seq-indicator--active");
    highlightColumn(currentStep);

    // Turn on notes for this step
    for (let r = 0; r < SCALE_NOTES.length; r++) {
      if (grid[r][currentStep]) {
        engine.noteOn(SCALE_NOTES[r].midi);
      }
    }
  }

  function highlightColumn(step) {
    // Remove previous highlight
    container.querySelectorAll(".seq-cell--playing").forEach((c) => {
      c.classList.remove("seq-cell--playing");
    });
    // Add to current column
    container.querySelectorAll(`[data-step="${step}"]`).forEach((c) => {
      c.classList.add("seq-cell--playing");
    });
  }

  function startPlayback() {
    if (playing) return;
    playing = true;
    stepDuration = 60000 / tempo / 4;
    tick();
    timerId = setInterval(tick, stepDuration);
    if (playBtn) playBtn.classList.add("hidden");
    if (stopBtn) stopBtn.classList.remove("hidden");
  }

  function stopPlayback() {
    if (!playing) return;
    playing = false;
    clearInterval(timerId);
    timerId = null;

    // Release all playing notes
    if (currentStep >= 0) {
      for (let r = 0; r < SCALE_NOTES.length; r++) {
        if (grid[r][currentStep]) {
          engine.noteOff(SCALE_NOTES[r].midi);
        }
      }
      stepIndicators[currentStep].classList.remove("seq-indicator--active");
      highlightColumn(-1);
    }
    currentStep = -1;

    if (playBtn) playBtn.classList.remove("hidden");
    if (stopBtn) stopBtn.classList.add("hidden");
  }

  function clearGrid() {
    for (let r = 0; r < SCALE_NOTES.length; r++) {
      for (let s = 0; s < STEPS; s++) {
        grid[r][s] = false;
      }
    }
    container.querySelectorAll(".seq-cell--on").forEach((c) => {
      c.classList.remove("seq-cell--on");
    });
  }

  // --- Controls ---
  if (playBtn) playBtn.addEventListener("click", startPlayback);
  if (stopBtn) stopBtn.addEventListener("click", stopPlayback);
  if (clearBtn) clearBtn.addEventListener("click", clearGrid);

  if (tempoSlider) {
    tempoSlider.addEventListener("input", () => {
      tempo = Number(tempoSlider.value);
      if (tempoValue) tempoValue.textContent = tempo + " BPM";
      if (playing) {
        clearInterval(timerId);
        stepDuration = 60000 / tempo / 4;
        timerId = setInterval(tick, stepDuration);
      }
    });
  }

  // --- Keyboard shortcut: space to toggle play ---
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
    if (e.code === "Space") {
      e.preventDefault();
      playing ? stopPlayback() : startPlayback();
    }
  });

  render();
}
