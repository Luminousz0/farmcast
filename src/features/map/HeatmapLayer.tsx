import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import type { GridPoint, OverlayLayer } from '@/types/weather';

interface HeatmapLayerProps {
  gridPoints: GridPoint[];
  activeLayer: OverlayLayer;
  /** True while the grid is stale (zooming / initial load) — keeps the layer
   *  invisible until fresh data arrives for the current viewport. */
  hidden: boolean;
}

export function HeatmapLayer({ gridPoints, activeLayer, hidden }: HeatmapLayerProps) {
  const visible = activeLayer === 'temperature' && !hidden;

  const geoData = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: gridPoints.map((p) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [p.lon, p.lat] as [number, number] },
        properties: { temperature: p.temperature },
      })),
    }),
    [gridPoints],
  );

  return (
    <Source id="fc-temp-src" type="geojson" data={geoData}>
      <Layer
        id="fc-temp"
        type="circle"
        maxzoom={9}
        layout={{ visibility: visible ? 'visible' : 'none' }}
        paint={{
          'circle-radius': [
            'interpolate', ['exponential', 2], ['zoom'],
            3,  90,
            5,  140,
            7,  220,
            9,  360,
          ],
          'circle-blur': 0.75,
          // Low opacity so the basemap reads through the colour wash.
          'circle-opacity': 0.35,
          'circle-color': [
            'interpolate', ['linear'], ['get', 'temperature'],
            -5,  '#3264e6',  // deep blue  — cold / frost risk
             5,  '#00b4a0',  // teal       — cool
            15,  '#46d737',  // green      — mild (typical NL conditions)
            22,  '#f5af00',  // amber      — warm
            28,  '#eb4614',  // orange-red — hot
            35,  '#b40032',  // deep red   — very hot
          ],
        }}
      />
    </Source>
  );
}
