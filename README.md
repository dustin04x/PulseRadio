<div align="center">

# PulseRadio

### A Retro-Inspired Electronic Radio Tuner for the Modern Web

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen?style=for-the-badge)](https://dustin04x.github.io/PulseRadio/)
[![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)

*Tune into curated electronic music streams with a nostalgic radio interface*

---

[Live Demo](https://dustin04x.github.io/PulseRadio/) · [Report Bug](https://github.com/dustin04x/PulseRadio/issues) · [Request Feature](https://github.com/dustin04x/PulseRadio/issues)

</div>

---

## Overview

**PulseRadio** is a browser-based electronic radio tuner that blends curated [SomaFM](https://somafm.com/) channels with high-traffic [RadioBrowser](https://www.radio-browser.info/) stations. Featuring a retro-inspired UI, it delivers live streaming playback, intelligent genre filtering, station discovery, and dynamic mood-based theming — all without any frameworks or build tools.

---

## Features

| Feature | Description |
|---------|-------------|
| **Multi-Source Aggregation** | Seamlessly combines stations from SomaFM and RadioBrowser APIs |
| **Smart Ranking** | Automatic normalization, deduplication, and intelligent ranking by listeners + bitrate |
| **Genre Filters** | Quick filtering by `Techno` · `House` · `Drum & Bass` · `Ambient` · `Trance` · `Experimental` |
| **Live Playback** | Full controls: `Scan -` · `Play/Pause` · `Scan +` · Random Pick |
| **Station Discovery** | Interactive tuner slider and "More Like This" recommendations |
| **Visual Feedback** | Lightweight audio visualizer meter and signal strength indicator |
| **Dynamic Themes** | Mood-based accent color switching for personalized vibes |

---

## Tech Stack

PulseRadio is built with a zero-dependency, no-build philosophy:

```
├── HTML5         → Semantic structure & audio streaming
├── CSS3          → Retro styling & responsive layout
└── Vanilla JS    → Data fetching, ranking & UI logic
```

**External APIs:**
- [SomaFM Channels API](https://somafm.com/channels.json)
- [RadioBrowser Search API](https://www.radio-browser.info/)

---

## Project Structure

```
PulseRadio/
├── index.html    # App layout and UI containers
├── styles.css    # Retro styling, layout, responsive rules
├── script.js     # Data fetching, station ranking, playback logic
└── README.md     # You are here
```

---

## Quick Start

### Option 1: Live Demo
Visit **[https://dustin04x.github.io/PulseRadio/](https://dustin04x.github.io/PulseRadio/)** and start listening instantly.

### Option 2: Run Locally

```bash
# Clone the repository
git clone https://github.com/dustin04x/PulseRadio.git

# Navigate to project directory
cd PulseRadio

# Serve over HTTP (recommended)
python -m http.server 8080

# Open in browser
open http://localhost:8080
```

> **Note:** You can open `index.html` directly, but serving over HTTP is recommended for reliable audio streaming.

---

## How It Works

```
┌─────────────┐    ┌─────────────┐
│   SomaFM    │    │ RadioBrowser│
│   Channels  │    │   Search    │
└──────┬──────┘    └──────┬──────┘
       │                  │
       └────────┬─────────┘
                ▼
        ┌───────────────┐
        │  Normalize &  │
        │   Deduplicate │
        └───────┬───────┘
                ▼
        ┌───────────────┐
        │    Ranking    │
        │ (source boost │
        │ + listeners   │
        │ + bitrate)    │
        └───────┬───────┘
                ▼
        ┌───────────────┐
        │ Genre/Mood    │
        │   Filtering   │
        └───────┬───────┘
                ▼
        ┌───────────────┐
        │   Playback    │
        │  (HTML5 Audio)│
        └───────────────┘
```

1. **Fetch** — Retrieves station metadata from SomaFM and RadioBrowser
2. **Normalize** — Converts both sources to a common channel schema
3. **Dedupe & Rank** — Removes duplicates, boosts SomaFM, ranks by quality metrics
4. **Filter** — Applies selected genre/mood filters
5. **Stream** — Resolves URL and starts HTML5 audio playback
6. **Refresh** — Updates metadata every 45 seconds

---

## Recent Improvements

- Removed `innerHTML` rendering for external station data (XSS mitigation)
- Added debounced tuner input handling to prevent excessive retunes
- Implemented album artwork fallback placeholder for failed images

---

## Roadmap

- [ ] **Stream Health Management** — Auto-detect stalled streams and failover
- [ ] **Request Optimization** — `AbortController` timeouts + `localStorage` caching
- [ ] **Accessibility** — Keyboard navigation, ARIA live regions, focus states
- [ ] **Enhanced Playback** — Volume control, mute toggle, elapsed time preservation
- [ ] **Code Modularity** — Split into `api`, `ranking`, `player`, `ui` modules
- [ ] **Testing** — Unit tests for `inferGenre`, filtering, and ranking logic

---

## Known Limitations

| Issue | Cause |
|-------|-------|
| Stream failures | CORS restrictions, codec incompatibility, or temporary outages |
| Inconsistent listener counts | Different sources report metrics differently |
| API dependency | Station availability relies on third-party services |

---

## Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project currently has no explicit license. Please add a `LICENSE` file to specify usage terms.

---

<div align="center">

**[Back to Top](#pulseradio)**

Made with passion for electronic music

</div>
