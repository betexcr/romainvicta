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
| UI | React 18 (CDN, JSX via Babel standalone) |
| 3D | Three.js r128 |
| Styling | Inline styles with theme system |
| Data | Static JS modules (~4,500 lines of historical content) |
| Build | None — single `index.html`, zero build step |

---

## Project Structure

```
index.html            Main application (React + Three.js, single file)
data_es.js            Spanish translations for all 309 entries
data_wiki.js          English encyclopedia articles
data_wiki_es.js       Spanish encyclopedia articles
data_stats.js         Historical statistics (population, territory, legions, roads)
data_tours.js         Guided tour definitions (EN/ES)
data_images.js        Image URLs for entries
earth.jpg             Earth texture for the 3D globe
audio/                Ambient soundtrack files
favicon.svg           SPQR laurel wreath favicon
og-image.png          Open Graph social sharing image
og-image.svg          Source SVG for the OG image
```

---

## Running Locally

No build step required. Serve the directory with any static file server:

```bash
npx serve
```

Then open http://localhost:3000.

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
