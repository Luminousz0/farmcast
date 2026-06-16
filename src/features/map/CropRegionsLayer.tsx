import { Source, Layer } from 'react-map-gl/maplibre';

export const CROP_CIRCLE_LAYER_ID = 'crop-circles';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CROP_COLORS: any = [
  'match',
  ['get', 'crop_id'],
  'rice',    '#8FB339',
  'soy',     '#6B9E5E',
  'cassava', '#C99B4A',
  'cacao',   '#8B4513',
  'coffee',  '#7B5D3A',
  '#aaaaaa',
];

export function CropRegionsLayer() {
  return (
    <Source
      id="crop-regions"
      type="geojson"
      data="/crop-regions/regions.geojson"
    >
      <Layer
        id={CROP_CIRCLE_LAYER_ID}
        type="circle"
        paint={{
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 1, 4, 4, 7, 8, 10],
          'circle-color': CROP_COLORS,
          'circle-opacity': 0.88,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': 'rgba(255,255,255,0.45)',
        }}
      />
      <Layer
        id="crop-labels"
        type="symbol"
        layout={{
          'text-field': ['get', 'emoji'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 1, 8, 4, 11, 8, 14],
          'text-offset': [0, -1.8],
          'text-allow-overlap': false,
          'text-ignore-placement': false,
        }}
        paint={{
          'text-halo-color': 'rgba(0,0,0,0.75)',
          'text-halo-width': 1.5,
        }}
      />
    </Source>
  );
}
