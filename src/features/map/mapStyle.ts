import type { StyleSpecification } from "maplibre-gl";

// A dark basemap built from CARTO's free "dark_all" raster tiles.
// No API key / token required ($0 constraint). Attribution to CARTO + OSM is
// rendered by the map control. We start with raster for reliability; a vector
// style can be swapped in later for richer overlay styling.
export const DARK_MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#070b14" },
    },
    {
      id: "carto-dark",
      type: "raster",
      source: "carto",
      paint: { "raster-opacity": 0.92 },
    },
  ],
};

// Netherlands centred, comfortable zoom for field-level browsing.
export const NL_VIEW = {
  longitude: 5.29,
  latitude: 52.13,
  zoom: 6.9,
} as const;
