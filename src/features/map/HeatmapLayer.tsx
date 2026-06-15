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
        properties: { score: scoreForLayer(p, 'temperature'), temperature: p.temperature },
      })),
    }),
    [gridPoints],
  );

  // Always render the source so it persists across layer-switcher toggling.
  // Visibility is controlled via layout, not by returning null.
  return (
    <Source id="fc-heatmap-src" type="geojson" data={geoData}>
      <Layer
        id="fc-heatmap"
        type="heatmap"
        layout={{ visibility: visible ? 'visible' : 'none' }}
        paint={{
          // Weight = normalised temperature score (0 cold → 1 hot)
          'heatmap-weight': ['get', 'score'],
          // With 36 points (6×6 viewport grid), intensity 1.0 gives good density.
          'heatmap-intensity': 1.0,
          // Radius scales exponentially with zoom so neighbouring points always
          // blend smoothly regardless of how far the user has zoomed in or out.
          'heatmap-radius': [
            'interpolate', ['exponential', 2], ['zoom'],
            3, 40,
            5, 60,
            7, 100,
            9, 200,
            11, 500,
          ],
          'heatmap-opacity': 0.70,
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0,    'rgba(0,0,0,0)',
            0.10, 'rgba(50,100,230,0.75)',  // deep blue  — cold
            0.30, 'rgba(0,180,160,0.82)',   // teal       — cool
            0.50, 'rgba(70,215,55,0.85)',   // green      — mild/optimal
            0.70, 'rgba(245,175,0,0.86)',   // amber      — warm
            0.88, 'rgba(235,70,20,0.88)',   // orange-red — hot
            1.0,  'rgba(180,0,50,0.90)',    // deep red   — very hot
          ],
        }}
      />
    </Source>
  );
}
