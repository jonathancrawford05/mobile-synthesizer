# Mobile Synthesizer Implementation Rubric

## Component Breakdown & Cost Analysis

### Phase 1: Foundation Components (Week 1-3) — COMPLETE

| Component | Description | Cost | Key Considerations | Testing Strategy |
|-----------|-------------|------|-------------------|------------------|
| **FastAPI Backend** | Web framework for API & WebSocket | FREE | Python-based, excellent documentation, async support | Unit tests for each endpoint |
| **SQLite Database** | Local data storage | FREE | File-based, no server required, perfect for prototyping | Database migration tests |
| **HTML/CSS Frontend** | Existing designs integration | FREE | Already created, need JS integration | Visual regression testing |
| **Web Audio API** | Browser-native audio synthesis | FREE | Built into browsers, no external dependencies | Audio parameter validation |
| **Docker** | Containerization | FREE | Moved from Phase 5 — simpler to containerize early | CI builds & tests inside container |
| **GitHub Actions CI** | Automated lint/typecheck/test | FREE | Docker-based pipeline, single environment source of truth | Runs on every push & PR |

### Phase 2: Audio Engine Components (Week 4-6)

| Component | Description | Cost | Key Considerations | Testing Strategy |
|-----------|-------------|------|-------------------|------------------|
| **Tone.js (Optional)** | High-level Web Audio library | FREE (MIT License) | Simplifies audio programming, good mobile support | Audio output verification |
| **WebSocket Communication** | Real-time parameter sync | FREE | Built into FastAPI, handles connection management | Connection stability tests |
| **Audio Context Management** | Browser audio permissions & lifecycle | FREE | Handle mobile audio restrictions | Cross-browser compatibility |

**Phase 2 architecture tasks** (carry-forward from refactor):
- Add IDs / `data-param` attributes to interactive UI elements as each page becomes functional
- Wire JS event handlers to audio parameters via `static/js/audio/` modules
- Consider moving heavyweight unused deps (librosa, sqlalchemy, etc.) to optional Poetry groups

### Phase 3: Synthesizer Engine Deepening (Week 7-9) — COMPLETE

| Component | Description | Cost | Key Considerations | Testing Strategy |
|-----------|-------------|------|-------------------|------------------|
| **Multi-oscillator** | 3 oscillators with independent waveform control | FREE | All 3 dropdowns already in UI; osc3 defaults to "off" | Verify each osc produces audio, mix is correct |
| **BiquadFilter** | Filter with cutoff frequency and resonance (Q) | FREE | Lowpass/highpass/bandpass types already in UI; add cutoff + Q sliders | Sweep cutoff, verify audible filtering |
| **ADSR Envelope** | Attack/Decay/Sustain/Release gain shaping | FREE | Shapes note on/off transitions; replaces abrupt start/stop | Verify smooth fade-in/out, sustain hold |
| **Delay Effect** | Delay with time and feedback controls | FREE | Uses native DelayNode + feedback loop; on/off via existing toggle | Verify echo repeats, feedback doesn't clip |

**Deferred to later phases:**
- Reverb (ConvolverNode with impulse response generation)
- Chorus/Flanger (modulated delay — more complex LFO routing)
- Filter rolloff cascading (12/24/36 dB — requires dynamic graph rebuild)
- Filter envelope modulation (ADSR → filter cutoff)

### Phase 4: Data, Storage & Presets (Week 10-12)

| Component | Description | Cost | Key Considerations | Testing Strategy |
|-----------|-------------|------|-------------------|------------------|
| **Preset save/load** | localStorage-based parameter snapshots | FREE | No database needed; wire up /presets page | Save/recall/delete presets |
| **SQLAlchemy ORM** | Database abstraction layer | FREE | Only when user accounts or shared presets are needed | Data integrity tests |
| **Alembic Migrations** | Database version control | FREE | Handles schema changes safely | Migration rollback tests |
| **File Storage (Local)** | Audio file storage | FREE | Local filesystem initially | File upload/download tests |

**Phase 4 architecture tasks:**
- Add `db` service to docker-compose.yml when moving beyond SQLite
- Populate `app/models/` and `app/services/` packages

### Phase 5: Advanced Features (Week 13-16)

| Component | Description | Cost | Key Considerations | Testing Strategy |
|-----------|-------------|------|-------------------|------------------|
| **WebSocket real-time sync** | Server-side parameter state | FREE | Enables multi-client sync and future collaboration | Connection stability tests |
| **JWT Authentication** | User session management | FREE (python-jose) | Secure, stateless authentication | Security penetration tests |
| **PWA Features** | Offline functionality | FREE | Service workers, app-like experience | Offline capability tests |
| **Audio Recording** | MediaRecorder API | FREE | Browser-native recording | Recording quality tests |
| **Advanced Effects** | Reverb, chorus, flanger | FREE | ConvolverNode + modulated delay lines | Audio quality tests |

### Phase 6: Deployment (Week 17-18)

| Component | Description | Cost | Key Considerations | Testing Strategy |
|-----------|-------------|------|-------------------|------------------|
| **Production Docker config** | Multi-stage prod build | FREE | Already containerized — focus on prod optimisation | Image size, startup time |
| **GitHub Pages/Vercel** | Free hosting | FREE | Static site hosting with API proxying | Deployment automation tests |
| **SQLite File Storage** | Production database | FREE | Simple, no server management needed | Backup/restore tests |
| **CD pipeline** | Deploy-on-merge workflow | FREE | Extend existing CI with deploy job | Smoke tests post-deploy |

## Implementation Priorities

### Iteration 1: Project Foundation — COMPLETE
- ✅ Create project structure
- ✅ Set up FastAPI basic application
- ✅ Integrate existing HTML designs
- ✅ Basic static file serving
- ✅ Docker containerization (multi-stage: production + development)
- ✅ GitHub Actions CI pipeline (lint, typecheck, test — all inside Docker)
- ✅ Jinja2 template inheritance (base.html)
- ✅ Router split (api/pages.py, api/endpoints.py)
- ✅ Static JS scaffold (audio/, ws/, ui/ directories)
- **Test**: Can we see the designs in browser? ✅

### Iteration 2: Basic Audio — COMPLETE
- ✅ Web Audio API integration (AudioContext → OscillatorNode → GainNode)
- ✅ Single oscillator with frequency control (20–2000 Hz slider)
- ✅ Gain slider (0–100%)
- ✅ Play/stop button with waveform selector
- ✅ ES module architecture (audio/engine.js, ui/controls.js, app.js)
- **Test**: Can we hear a tone and control its pitch? ✅

### Iteration 3: Synthesizer Engine Deepening — COMPLETE
- ✅ Wire all 3 oscillators with independent waveform control
- ✅ BiquadFilter with cutoff frequency and resonance sliders
- ✅ ADSR envelope (attack/decay/sustain/release) for smooth note shaping
- ✅ Delay effect with time, feedback, and enable/disable
- ✅ Polyphonic noteOn/noteOff engine (8-voice polyphony with voice stealing)
- ✅ On-screen piano keyboard with QWERTY input (A-row + K-row, Z/X octave shift)
- ✅ Note labels and shortcut hints on keyboard keys
- **Test**: Can we layer oscillators, shape the sound with filter + ADSR, and add delay? ✅

### Iteration 4: Presets & Step Sequencer — COMPLETE
- ✅ localStorage preset save/load with 7 factory presets
- ✅ /presets page: browse All/Factory/User tabs, load and delete presets
- ✅ Preset selector on synthesizer page with save button
- ✅ Cross-page preset loading via URL query parameter (?preset=name)
- ✅ 16-step × 14-note step sequencer on /sequencer page
- ✅ Sequencer transport controls (play/stop/clear, tempo 40–240 BPM)
- ✅ Sequencer sound controls (waveform, filter cutoff, gain)
- ✅ Space bar toggle for sequencer play/stop
- **Test**: Can we save/recall presets and compose patterns with the sequencer? ✅

### Iteration 5: WebSocket & Advanced Features
- Real-time parameter sync via WebSocket
- Advanced effects (reverb, chorus)
- PWA offline support, audio recording
- Visual/creative interface (FractalSoundExplorer-inspired)
- **Test**: Do changes sync across clients in real-time?

## Risk Mitigation

| Risk | Impact | Mitigation | Cost |
|------|--------|------------|------|
| **Browser Audio Compatibility** | High | Progressive enhancement, fallbacks | FREE |
| **Mobile Audio Latency** | Medium | AudioWorklets, optimized buffers | FREE |
| **WebSocket Connection Issues** | Medium | Automatic reconnection, graceful degradation | FREE |
| **File Storage Limits** | Low | Implement file cleanup, compression | FREE |

## Success Metrics

- **Functionality**: Each component works as designed
- **Performance**: Audio latency < 50ms on mobile
- **Usability**: Intuitive controls matching original designs
- **Reliability**: No crashes during normal usage
- **Maintainability**: Clean, documented code structure

---

*All components selected are open-source and free to use commercially.*
