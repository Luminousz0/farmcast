import type { RadarFrame } from '@/types/weather';

const RADAR_API = 'https://api.rainviewer.com/public/weather-maps.json';

interface RainViewerResponse {
  host: string;
  radar: {
    past: Array<{ time: number; path: string }>;
    nowcast?: Array<{ time: number; path: string }>;
  };
}

let _radarCache: { frames: { host: string; frame: RadarFrame }[]; expires: number } | null = null;

export async function getRadarFrames(): Promise<{ host: string; frame: RadarFrame }[]> {
  if (_radarCache && Date.now() < _radarCache.expires) {
    return _radarCache.frames;
  }

  const res = await fetch(RADAR_API);
  if (!res.ok) throw new Error(`RainViewer API failed: ${res.status}`);

  const data = (await res.json()) as RainViewerResponse;
  const host = data.host;
  const frames = data.radar.past.map((f) => ({ host, frame: { time: f.time, path: f.path } }));

  _radarCache = { frames, expires: Date.now() + 5 * 60 * 1000 };
  return frames;
}

/** Build a MapLibre tile URL template for the given radar frame. */
export function radarTileUrl(host: string, path: string): string {
  return `${host}${path}/256/{z}/{x}/{y}/4/1_1.png`;
}
