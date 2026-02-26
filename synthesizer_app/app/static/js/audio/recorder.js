/**
 * Audio recorder — captures output from an AudioContext using MediaRecorder.
 *
 * Usage:
 *   const rec = new AudioRecorder(audioContext);
 *   rec.start();
 *   // ... play sounds ...
 *   const blob = await rec.stop();  // returns a Blob (audio/webm or audio/ogg)
 *   // download or play the blob
 *
 * The recorder taps into the AudioContext destination via
 * createMediaStreamDestination(), so it captures everything the user hears.
 */

export class AudioRecorder {
  /**
   * @param {AudioContext} ctx — the AudioContext whose output to record
   * @param {GainNode} sourceNode — node to tap (typically masterGain)
   */
  constructor(ctx, sourceNode) {
    this._ctx = ctx;
    this._sourceNode = sourceNode;
    this._mediaRecorder = null;
    this._chunks = [];
    this._streamDest = null;
    this._recording = false;
  }

  get recording() {
    return this._recording;
  }

  /** Start recording. */
  start() {
    if (this._recording) return;

    this._streamDest = this._ctx.createMediaStreamDestination();
    this._sourceNode.connect(this._streamDest);

    // Prefer webm/opus, fall back to ogg/opus, then whatever is available
    const mimeOptions = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
    ];
    let mimeType = "";
    for (const mime of mimeOptions) {
      if (MediaRecorder.isTypeSupported(mime)) {
        mimeType = mime;
        break;
      }
    }

    const options = mimeType ? { mimeType } : {};
    this._mediaRecorder = new MediaRecorder(this._streamDest.stream, options);
    this._chunks = [];

    this._mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this._chunks.push(e.data);
    };

    this._mediaRecorder.start(100); // collect chunks every 100ms
    this._recording = true;
  }

  /**
   * Stop recording and return the audio as a Blob.
   * @returns {Promise<Blob>}
   */
  stop() {
    return new Promise((resolve) => {
      if (!this._recording || !this._mediaRecorder) {
        resolve(null);
        return;
      }

      this._mediaRecorder.onstop = () => {
        const mimeType = this._mediaRecorder.mimeType || "audio/webm";
        const blob = new Blob(this._chunks, { type: mimeType });
        this._chunks = [];

        // Disconnect the tap so it doesn't affect future audio
        try {
          this._sourceNode.disconnect(this._streamDest);
        } catch {
          // already disconnected
        }
        this._streamDest = null;
        this._recording = false;
        resolve(blob);
      };

      this._mediaRecorder.stop();
    });
  }
}

/**
 * Trigger a browser download of an audio Blob.
 * @param {Blob} blob
 * @param {string} filename
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
