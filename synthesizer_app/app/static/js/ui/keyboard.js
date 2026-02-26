/**
 * On-screen piano keyboard with computer-keyboard input.
 *
 * Renders a 2-octave keyboard into a container element.
 * Supports touch, mouse (via pointer events), and QWERTY input.
 *
 * Computer keyboard mapping (lower octave):
 *   A=C  W=C#  S=D  E=D#  D=E  F=F  T=F#  G=G  Y=G#  H=A  U=A#  J=B
 * Upper octave:
 *   K=C  O=C#  L=D  P=D#  ;=E  '=F  ]=F#  \=G  (remaining via touch/octave shift)
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

// QWERTY → semitone offset from base octave
const KEY_MAP = {
  a: 0, w: 1, s: 2, e: 3, d: 4,
  f: 5, t: 6, g: 7, y: 8, h: 9,
  u: 10, j: 11,
  k: 12, o: 13, l: 14, p: 15, ";": 16,
  "'": 17, "]": 18, "\\": 19,
};

// Reverse lookup: semitone offset → display key label
const OFFSET_TO_KEY = {};
for (const [k, v] of Object.entries(KEY_MAP)) {
  OFFSET_TO_KEY[v] = k.toUpperCase();
}

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
        const shortcut = OFFSET_TO_KEY[offset];
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

    const k = e.key.toLowerCase();

    // Octave shift
    if (k === "z" && baseOctave > 0) {
      baseOctave--;
      updateOctaveDisplay();
      render();
      return;
    }
    if (k === "x" && baseOctave < 7) {
      baseOctave++;
      updateOctaveDisplay();
      render();
      return;
    }

    const offset = KEY_MAP[k];
    if (offset === undefined) return;
    e.preventDefault();

    const midi = baseMidi() + offset;
    if (heldKeys.has(k)) return;
    heldKeys.set(k, midi);
    engine.noteOn(midi);

    const el = container.querySelector(`[data-midi="${midi}"]`);
    if (el) el.classList.add("piano-key--active");
  }

  function handleKeyUp(e) {
    const k = e.key.toLowerCase();
    const midi = heldKeys.get(k);
    if (midi === undefined) return;
    heldKeys.delete(k);
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
