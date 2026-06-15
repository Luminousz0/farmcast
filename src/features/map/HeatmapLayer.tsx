import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import type { GridPoint, OverlayLayer } from '@/types/weather';

interface HeatmapLayerProps {
  gridPoints: GridPoint[];
  activeLayer: OverlayLayer;
}

// MapLibre's heatmap layer type is a kernel-density estimator — overlapping
// kernels compound, making every temp look "hot". Circle layer with direct
// temperature → color expression is the right primitive here.
export function HeatmapLayer({ gridPoints, activeLayer }: HeatmapLayerProps) {
  const visible = activeLayer === 'temperature';

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
        layout={{ visibility: visible ? 'visible' : 'none' }}
        paint={{
          // Radius grows with zoom so circles always overlap and blend smoothly.
          // At NL zoom (~7), each circle covers roughly the same area as one
          // grid cell — the blur (=1) fades the edge to transparent, giving a
          // smooth interpolated look between the 36 grid points.
          'circle-radius': [
            'interpolate', ['exponential', 2], ['zoom'],
            3,  60,
            5,  100,
            7,  170,
            9,  280,
            11, 480,
          ],
          'circle-blur': 1,
          'circle-opacity': 0.55,
          // Direct temperature → color: no density math, always accurate.
          'circle-color': [
            'interpolate', ['linear'], ['get', 'temperature'],
            -5,  '#3264e6',  // deep blue  — cold / frost risk
             5,  '#00b4a0',  // teal       — cool
            15,  '#46d737',  // green      — mild (typical NL working conditions)
            22,  '#f5af00',  // amber      — warm
            28,  '#eb4614',  // orange-red — hot
            35,  '#b40032',  // deep red   — very hot
          ],
        }}
      />
    </Source>
  );
}
