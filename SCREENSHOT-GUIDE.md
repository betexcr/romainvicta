# Imperium Romanum — Screenshot & Interaction Guide

## How to Capture Screenshots

1. **Start the server**: `npx serve -l 3000`
2. **Open** http://localhost:3000 in your browser
3. **Install Playwright** (optional, for automated capture):
   ```bash
   npm init -y && npm install playwright
   npx playwright install chromium
   node capture-screenshots.mjs
   ```
   Screenshots will be saved to `./screenshots/`

---

## What You'll See: Location Markers

### 1. **Dot Markers (Location Points)**
- **Appearance**: Small gold spheres (~0.018 radius) on the globe
- **Rome**: Special "S·P·Q·R" sprite instead of a dot
- **Glow**: Pulsing gold halo around each marker
- **Ring**: Thin gold ring at the base
- **Visibility**: Markers appear as the timeline year reaches their trigger year

### 2. **Arrow Markers (Route Paths)**
- **Appearance**: Curved red lines with cone-shaped arrowheads along the path
- **Color**: `#C41E3A` (red) for campaigns/military; gold for economy
- **Animation**: When playing, 3 small dots travel along each path
- **Paths**: Connect origin → destination (e.g., Rome → Carthage)

---

## Hover Tooltips

When you **hover** over a marker (without clicking):

| Type | Border Color | Content |
|------|--------------|---------|
| **Location** | Gold | Name, short `info` text, "CLICK TO READ MORE" if wiki exists |
| **Path/Route** | Red | Route label (e.g., "Siege of Veii, 396 BC") |
| **Territory** | Brown | Province name, Roman Province label |

Tooltip shows: **name**, **info**, optional image, and "CLICK TO READ MORE" hint.

---

## Click → Wiki Panel

When you **click** a marker or path:

### Location markers (with `wiki` field)
Opens **Encyclopedia** modal with:
- **Header**: "ENCYCLOPEDIA", location name, info subtitle
- **Image**: If `loc.img` exists
- **Full wiki text**: Multi-paragraph historical content
- **Close**: Click outside or ✕

### Path/arrow markers
Opens **Encyclopedia** with:
- **Route label** as title (e.g., "Roman fleets engage Carthage")
- **Origin** — [from location]: [info]
- **Destination** — [to location]: [info]
- **Event description** + wiki text from origin/destination
- **Image**: From origin or destination location if available

### Territory (Roman provinces)
Opens panel with province name, era dates, and governance info.

---

## Example Events to Try

| Event | Markers | Paths | Best for |
|-------|---------|-------|----------|
| Kingdom of Rome | 1 (Rome) | 0 | Simple dot, S·P·Q·R sprite |
| Conquest of Italy | 4 (Rome, Veii, Capua, Tarentum) | 3 arrows | Multiple dots + arrows |
| Hannibal's Italian Campaign | 5 | 4 arrows | Campaign routes |
| Caesar's Gallic Wars | 5 | 4 arrows | Route animation |
| Annexation of Egypt | 2 | 1 | Alexandria ↔ Rome |

---

## Sidebar → Globe Flow

1. Click **MENU** to open sidebar
2. Select **category** (e.g., Territorial Expansion)
3. Click an **event** (e.g., Conquest of Italy)
4. Globe **zooms** to first location, markers appear by year
5. Use **timeline** slider or ▶ to advance — markers/paths reveal over time
6. **Hover** markers for tooltips; **click** for full wiki
