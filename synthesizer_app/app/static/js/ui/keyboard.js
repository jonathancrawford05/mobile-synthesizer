/**
 * On-screen piano keyboard with computer-keyboard input.
 *
 * Renders a 2-octave keyboard into a container element.
 * Supports touch, mouse (via pointer events), and QWERTY input.
 *
 * Computer keyboard mapping (physical key codes, lower octave):
 *   A=C  W=C#  S=D  E=D#  D=E  F=F  T=F#  G=G  Y=G#  H=A  U=A#  J=B
 * Upper octave:
 *   K=C  O=C#  L=D  P=D#  ;=E  '=F  ]=F#  \=G  (remaining via touch/octave shift)
 * Uses e.code (physical position) for reliable cross-browser support.
 */

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const WHITE_INDICES = [0, 2, 4, 5, 7, 9, 11]; // C D E F G A B
const BLACK_INDICES = [1, 3, 6, 8, 10];         // C# D# F# G# A#

// Position of each black key as fraction of white-key width from left.
// C# sits between C and D, D# between D and E, etc.
const BLACK_POSITIONS = {
  1: 0.75,   // C# → after white key 0 (C)
  3: 1.75,   // D# → after white key 1 (D)
  6: 3.75,   // F# → after white key 3 (F)
  8: 4.75,   // G# → after white key 4 (G)
  10: 5.75,  // A# → after white key 5 (A)
};

// Physical key code → semitone offset from base octave.
// Using e.code (physical position) instead of e.key so that
// punctuation keys (Quote, Bracket, Backslash) work reliably
// across browsers, OS locales, and dead-key configurations.
const CODE_MAP = {
  KeyA: 0, KeyW: 1, KeyS: 2, KeyE: 3, KeyD: 4,
  KeyF: 5, KeyT: 6, KeyG: 7, KeyY: 8, KeyH: 9,
  KeyU: 10, KeyJ: 11,
  KeyK: 12, KeyO: 13, KeyL: 14, KeyP: 15, Semicolon: 16,
  Quote: 17, BracketRight: 18, Backslash: 19,
};

// Display labels for each offset (shown on piano keys)
const CODE_TO_LABEL = {
  0: "A", 1: "W", 2: "S", 3: "E", 4: "D",
  5: "F", 6: "T", 7: "G", 8: "Y", 9: "H",
  10: "U", 11: "J",
  12: "K", 13: "O", 14: "L", 15: "P", 16: ";",
  17: "'", 18: "]", 19: "\\",
};

/**
 * Build and bind a piano keyboard.
 *
 * @param {HTMLElement} container  — element with id="keyboard"
 * @param {import('../audio/engine.js').AudioEngine} engine
 */
export function initKeyboard(container, engine) {
  if (!container) return;

  const NUM_OCTAVES = 2;
  let baseOctave = 3; // start at C3 (MIDI 48)

  const octaveDisplay = document.getElementById("octave-display");
  const octaveDown = document.getElementById("octave-down");
  const octaveUp = document.getElementById("octave-up");

  function baseMidi() {
    return (baseOctave + 1) * 12; // C3 = 48, C4 = 60
  }

  function updateOctaveDisplay() {
    if (octaveDisplay) {
      octaveDisplay.textContent = "C" + baseOctave + "–B" + (baseOctave + NUM_OCTAVES - 1);
    }
  }

  // --- Render keys ---
  function render() {
    container.innerHTML = "";
    const totalWhite = NUM_OCTAVES * 7;

    // White keys
    for (let oct = 0; oct < NUM_OCTAVES; oct++) {
      for (let w = 0; w < WHITE_INDICES.length; w++) {
        const semitone = WHITE_INDICES[w];
        const midi = baseMidi() + oct * 12 + semitone;
        const offset = oct * 12 + semitone;
        const key = document.createElement("button");
        key.className = "piano-key piano-key--white";
        key.dataset.midi = midi;
        key.style.width = (100 / totalWhite) + "%";

        // Note name label
        const noteName = NOTE_NAMES[semitone] + (baseOctave + oct);
        const label = document.createElement("span");
        label.className = "piano-key__label";
        const shortcut = CODE_TO_LABEL[offset];
        label.textContent = shortcut ? noteName + "\n" + shortcut : noteName;
        key.appendChild(label);

        container.appendChild(key);
      }
    }

    // Black keys (absolute positioned)
    for (let oct = 0; oct < NUM_OCTAVES; oct++) {
      for (const semitone of BLACK_INDICES) {
        const midi = baseMidi() + oct * 12 + semitone;
        const key = document.createElement("button");
        key.className = "piano-key piano-key--black";
        key.dataset.midi = midi;

        const whiteWidth = 100 / totalWhite;
        const pos = BLACK_POSITIONS[semitone] + oct * 7;
        key.style.left = (pos * whiteWidth) + "%";
        key.style.width = (whiteWidth * 0.55) + "%";

        container.appendChild(key);
      }
    }
  }

  // --- Pointer events (touch + mouse) ---
  const activePointers = new Map(); // pointerId → midi

  function noteOnFromKey(keyEl, pointerId) {
    const midi = Number(keyEl.dataset.midi);
    if (isNaN(midi)) return;
    activePointers.set(pointerId, midi);
    engine.noteOn(midi);
    keyEl.classList.add("piano-key--active");
  }

  function noteOffFromPointer(pointerId) {
    const midi = activePointers.get(pointerId);
    if (midi === undefined) return;
    activePointers.delete(pointerId);
    engine.noteOff(midi);
    const el = container.querySelector(`[data-midi="${midi}"]`);
    if (el) el.classList.remove("piano-key--active");
  }

  container.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    const key = e.target.closest("[data-midi]");
    if (key) noteOnFromKey(key, e.pointerId);
  });

  container.addEventListener("pointerup", (e) => {
    noteOffFromPointer(e.pointerId);
  });

  container.addEventListener("pointerleave", (e) => {
    noteOffFromPointer(e.pointerId);
  });

  container.addEventListener("pointercancel", (e) => {
    noteOffFromPointer(e.pointerId);
  });

  // Glissando: slide between keys while holding
  container.addEventListener("pointermove", (e) => {
    if (!activePointers.has(e.pointerId)) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const key = el && el.closest("[data-midi]");
    if (!key) return;
    const midi = Number(key.dataset.midi);
    if (midi !== activePointers.get(e.pointerId)) {
      noteOffFromPointer(e.pointerId);
      noteOnFromKey(key, e.pointerId);
    }
  });

  // --- Computer keyboard ---
  const heldKeys = new Map(); // keyboard key → midi

  function handleKeyDown(e) {
    if (e.repeat) return;
    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "TEXTAREA") return;

    const code = e.code;

    // Octave shift (Z/X by physical position)
    if (code === "KeyZ" && baseOctave > 0) {
      baseOctave--;
      updateOctaveDisplay();
      render();
      return;
    }
    if (code === "KeyX" && baseOctave < 7) {
      baseOctave++;
      updateOctaveDisplay();
      render();
      return;
    }

    const offset = CODE_MAP[code];
    if (offset === undefined) return;
    e.preventDefault();

    const midi = baseMidi() + offset;
    if (heldKeys.has(code)) return;
    heldKeys.set(code, midi);
    engine.noteOn(midi);

    const el = container.querySelector(`[data-midi="${midi}"]`);
    if (el) el.classList.add("piano-key--active");
  }

  function handleKeyUp(e) {
    const code = e.code;
    const midi = heldKeys.get(code);
    if (midi === undefined) return;
    heldKeys.delete(code);
    engine.noteOff(midi);

    const el = container.querySelector(`[data-midi="${midi}"]`);
    if (el) el.classList.remove("piano-key--active");
  }

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);

  // --- Octave buttons ---
  if (octaveDown) {
    octaveDown.addEventListener("click", () => {
      if (baseOctave > 0) {
        baseOctave--;
        updateOctaveDisplay();
        render();
      }
    });
  }
  if (octaveUp) {
    octaveUp.addEventListener("click", () => {
      if (baseOctave < 7) {
        baseOctave++;
        updateOctaveDisplay();
        render();
      }
    });
  }

  // Initial render
  updateOctaveDisplay();
  render();
}
