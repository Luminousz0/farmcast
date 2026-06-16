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
      paint: { "background-color": "#14110b" },
    },
    {
      id: "carto-dark",
      type: "raster",
      source: "carto",
      paint: { "raster-opacity": 0.92 },
    },
  ],
};

/** ESRI World Imagery satellite tiles — free, no API key required. */
export const SATELLITE_MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    esri: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution:
        'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP',
    },
  },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#000' } },
    { id: 'esri-satellite', type: 'raster', source: 'esri', paint: { 'raster-opacity': 1 } },
  ],
};

export type MapStyleMode = 'dark' | 'satellite';

// Netherlands centred, comfortable zoom for field-level browsing.
export const NL_VIEW = {
  longitude: 5.29,
  latitude: 52.13,
  zoom: 6.9,
} as const;
