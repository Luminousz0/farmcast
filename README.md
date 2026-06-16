# Farmcast

Immersive weather intelligence for Dutch farmers. Pick a field on the map, get an instant go/no-go on whether it's a good day to spray, harvest, or mow — backed by live forecast data and Dutch legal thresholds.

**[farmcast-phi.vercel.app](https://farmcast-phi.vercel.app)**

---

## What it does

The Netherlands is the world's #2 agricultural exporter. Farmers lose money on bad spray days, missed harvest windows, and avoidable frost damage. Farmcast turns raw weather data into a single clear verdict — not numbers to interpret, but a decision.

- **Click any field** on the full-screen map to open a condition panel
- **Crop picker** (Maize, Potato, Wheat, Onion, Grass) rescores all advice instantly
- **Advice strip** shows spray go/no-go, frost alert, and harvest window with green/amber/red indicators
- **7-day windows** — one dot per day per activity; a farmer glances and knows Thursday works
- **Dutch legal spray limits** (CTGB wind thresholds by pesticide class) — flagged separately from agronomic advice
- **Spray intelligence** — Delta-T quality score, rain-free window, dew/inversion risk
- **Soil intelligence** — late blight pressure (potato), Septoria pressure (wheat), trafficability, ground frost
- **Irrigation advice** — 7-day ET₀ vs. precipitation water deficit
- **Satellite map** toggle — ESRI World Imagery, no API key
- **Field bookmarks** — save named fields to localStorage; each shows a live status dot
- **Deeplinks** — `?lat=&lon=` in the URL; shareable, zero backend
- **PWA** — installable to iPhone/Android home screen

---

## Tech stack

| | |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS + Framer Motion |
| Map | MapLibre GL JS + react-map-gl |
| Weather data | [Open-Meteo](https://open-meteo.com) — free, no API key |
| Rain radar | [RainViewer](https://www.rainviewer.com/api.html) — free, no API key |
| Satellite tiles | ESRI World Imagery — free, no API key |
| PWA | vite-plugin-pwa + Workbox |
| Deploy | Vercel |

$0 to run. No backend, no paid APIs, no usage fees.

---

## Local development

```bash
npm install
npm run dev
```

Requires Node 18+. No `.env` needed — all data sources are public and keyless.

```bash
npm run build   # TypeScript compile + Vite bundle
npm run preview # Preview the production build locally
```

---

## Crops supported

| Crop | Spray advice | Harvest window | Frost alert | Special |
|------|-------------|----------------|-------------|---------|
| Maize | ✓ | ✓ | ✓ | — |
| Potato | ✓ | ✓ | ✓ | Late blight (Phytophthora) pressure |
| Wheat | ✓ | ✓ | ✓ | Septoria pressure |
| Onion | ✓ | ✓ | ✓ | — |
| Grass | ✓ | Mowing window | ✓ | 3-consecutive-day mow window |

---

## License

MIT
