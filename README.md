# PulseRadio

PulseRadio is a browser-based electronic radio tuner that blends curated SomaFM channels with high-traffic RadioBrowser stations. It provides a retro-inspired UI with live playback, genre/mood filtering, station discovery, and dynamic theming.

## Features

- Aggregates stations from:
  - SomaFM (`/channels.json`)
  - RadioBrowser search API
- Automatic station normalization, deduplication, and ranking
- Genre and mood filters (`Techno`, `House`, `Drum & Bass`, `Ambient`, `Trance`, `Experimental`)
- Live playback controls (`Scan -`, `Play/Pause`, `Scan +`, random pick)
- Station tuner slider and "More Like This" suggestions
- Lightweight visualizer meter and signal indicator
- Mood-based accent theme switching

## Tech Stack

- Plain HTML/CSS/JavaScript (no framework, no build step)
- HTML5 `<audio>` streaming
- Public station metadata APIs (SomaFM + RadioBrowser)

## Project Structure

- `index.html` - app layout and UI containers
- `styles.css` - retro styling, layout, responsive rules
- `script.js` - data fetching, station ranking, playback logic, UI state/events

## Run Locally

1. Open the project folder.
2. Serve files over HTTP (recommended to avoid browser restrictions), for example:
   - `python -m http.server 8080`
   - then open `http://localhost:8080`
3. Click `Play` to start listening.

You can also open `index.html` directly, but some browsers may handle remote audio requests less reliably from `file://`.

## How It Works

1. Fetches station metadata from SomaFM and RadioBrowser.
2. Normalizes both sources to a common channel shape.
3. Dedupe + ranking:
   - removes duplicates by stream URL/title
   - boosts SomaFM channels
   - ranks by source boost + listeners + bitrate
4. Applies selected genre/mood filters.
5. Resolves stream URL and starts playback.
6. Refreshes metadata periodically (every 45 seconds).

## Recent Quality Improvements

- Removed `innerHTML` rendering for externally sourced station cards to reduce XSS risk.
- Added debounced tuner `input` handling to prevent excessive retunes while dragging.
- Added album artwork fallback placeholder when station images fail to load.

## Major Improvements Recommended Next

1. Add stream health management:
   - detect stalled streams (`waiting`/`stalled`/no audio progress)
   - auto-failover to next station after timeout
2. Add request timeouts + caching:
   - wrap `fetch` calls with `AbortController`
   - cache station metadata in `localStorage` as warm fallback
3. Improve accessibility:
   - keyboard focus states and visible active controls
   - ARIA live region for now-playing updates
4. Harden playback UX:
   - preserve elapsed timer on pause/resume
   - add volume control and mute
5. Improve testability:
   - split `script.js` into modules (`api`, `ranking`, `player`, `ui`)
   - add unit tests for `inferGenre`, filtering, and dedupe/ranking

## Known Limitations

- Stream availability and metadata depend on third-party APIs.
- Some stations can fail due to CORS, codec support, or temporary outage.
- "Listeners" values differ by source and are not directly comparable.

## License

No license file is currently included. Add a `LICENSE` file if you want explicit usage terms.
