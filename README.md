# Imperium Romanum

**Interactive 3D Atlas of the Roman World — 753 BC to 476 AD**

Explore 1,200 years of Roman history on an interactive globe. Navigate campaigns, conquests, historical figures, engineering marvels, and more — all rendered on a 3D Earth with animated routes, territory overlays, and a rich built-in encyclopedia.

[**Launch the Atlas**](https://romainvicta.surge.sh/)

---

## Features

### Interactive Globe
- **3D mode** — Three.js globe with pan, zoom, and rotation. Markers, animated route paths, and territory shading appear as you scrub through time.
- **2D mode** — flat equirectangular map for a traditional cartographic view.

### 309 Historical Entries across 15 Categories
Territorial Expansion · Military Campaigns · Historical Figures · Landmark Events · Engineering Marvels · Culture & Arts · Religion & Philosophy · Plagues & Disasters · Biographies · Economy & Trade · Law & Government · Army & Legions · Cities & Provinces · Science & Medicine · Daily Life & Society

### Timeline
Playable timeline with adjustable speed (1×, 2×, 5×). Locations and routes reveal progressively as events unfold. Era markers (Kingdom, Republic, Punic Wars, Empire, Crisis, Fall…) provide historical context.

### Built-in Encyclopedia
Every event, location, and route links to detailed articles with rich narrative text, key facts, and related locations. Full Wikipedia-style articles available for major entries in both English and Spanish.

### Guided Tours
Five narrated tours walk through key arcs of Roman history:
- Rise of the Republic
- The Punic Wars
- The Age of Caesar
- Fall of Rome
- Engineering Marvels

### Quiz Mode
10-question quiz with multiple question types — dates, figures, locations, and categories. Score tracking with themed feedback.

### Figures Gallery
Visual gallery of all historical figures and biographies with portraits, dates, and descriptions.

### Bilingual (English / Spanish)
Full UI and all 309 entries available in both languages. Language is auto-detected from the device and can be toggled manually.

### Dark & Light Theme
Follows the device/OS color scheme preference by default. Toggleable via the toolbar, with the choice persisted to `localStorage`.

### Additional Features
- **Search** — instant search across all events, locations, and figures
- **Keyboard shortcuts** — play/pause, scrub, fast scrub, search, close panels
- **Deep linking** — shareable URLs with event, year, and language parameters
- **Ambient soundtrack** — campaign-specific and general theme music
- **Image lightbox** — full-screen image viewer for historical illustrations
- **Real-time statistics** — population, territory, legions, and road network interpolated by year
- **Animated routes** — trade and campaign routes animate along the globe
- **Accessibility** — skip links, ARIA labels, keyboard navigation, screen reader announcements

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 18 (Vite + JSX build) |
| 3D | Three.js (npm) |
| Styling | Inline styles with theme system |
| Data | ES modules under `src/data/` |
| Build | Vite → `dist/` |
| Hosting | Surge (`romainvicta.surge.sh`) + meta CSP (HTTP `_headers` for portable hosts) |

---

## Project Structure

```
index.html            Vite HTML shell
src/main.jsx          React createRoot entry + observability
src/RomanGlobe.jsx    Main application UI
src/ErrorBoundary.jsx Runtime error fallback
src/lib/              Hardening helpers + client logging
src/data/             Historical data ESM modules (events, i18n, wiki, tours)
public/               Static assets (earth.jpg, audio/, _headers)
tests/                Vitest content/URL integrity tests
e2e/                  Playwright smoke tests
```

Legacy root `data_*.js` / `app-core.js` remain as the editable source for content; regenerate `src/data/` with `node scripts/setup-data-modules.mjs` after content edits.

---

## Running Locally

```bash
npm install
npm run dev
```

Open http://localhost:5173.

```bash
npm run build    # production bundle in dist/
npm test         # unit + content integrity
npm run test:e2e # Playwright smoke against preview
npm run deploy   # build + publish dist/ to Surge (requires SURGE_TOKEN / surge login)
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for adding events, Spanish index alignment, deploy/rollback, and CSP notes.

---

## URL Parameters

| Parameter | Example | Description |
|-----------|---------|-------------|
| `lang` | `?lang=es` | Force language (en/es) |
| `event` | `?event=cam1` | Open a specific event |
| `year` | `?year=-218` | Set the timeline year |

Parameters can be combined: `?lang=es&event=fig1&year=-44`

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause timeline |
| `← →` | Scrub timeline |
| `Shift + ← →` | Fast scrub (10%) |
| `/` | Focus search |
| `?` | Toggle shortcuts help |
| `Escape` | Close active panel |

---

## License

All rights reserved.
