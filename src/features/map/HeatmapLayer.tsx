import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import type { GridPoint, OverlayLayer } from '@/types/weather';
import { scoreForLayer } from '@/lib/gridSampler';

interface HeatmapLayerProps {
  gridPoints: GridPoint[];
  activeLayer: OverlayLayer;
}

export function HeatmapLayer({ gridPoints, activeLayer }: HeatmapLayerProps) {
  const visible = activeLayer === 'temperature';

  const geoData = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: gridPoints.map((p) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [p.lon, p.lat] as [number, number] },
        properties: { score: scoreForLayer(p, 'temperature') },
      })),
    }),
    [gridPoints],
  );

  if (!visible || gridPoints.length === 0) return null;

  return (
    <Source id="fc-heatmap-src" type="geojson" data={geoData}>
      <Layer
        id="fc-heatmap"
        type="heatmap"
        paint={{
          'heatmap-weight': ['get', 'score'],
          'heatmap-intensity': 1.2,
          // Radius scales with zoom so neighbouring points always overlap and
          // produce a smooth interpolated look at every zoom level.
          'heatmap-radius': [
            'interpolate',
            ['exponential', 2],
            ['zoom'],
            5, 18,
            7, 65,
            9, 260,
            11, 1040,
          ],
          'heatmap-opacity': 0.72,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,    'rgba(0,0,0,0)',
            0.12, 'rgba(65,105,225,0.75)',
            0.30, 'rgba(0,180,160,0.82)',
            0.50, 'rgba(80,210,60,0.85)',
            0.70, 'rgba(245,175,0,0.85)',
            0.88, 'rgba(235,70,20,0.87)',
            1,    'rgba(180,0,50,0.90)',
          ],
        }}
      />
    </Source>
  );
}
