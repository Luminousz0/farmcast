import { useEffect, useRef, useState } from 'react';
import { getRadarFrames, radarTileUrl } from '@/lib/rainViewer';

interface RadarState {
  tileUrl: string | null;
  frameCount: number;
  loading: boolean;
}

const FRAME_INTERVAL_MS = 600;

export function useRadarFrames(active: boolean): RadarState {
  const [tileUrl, setTileUrl] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const framesRef = useRef<{ host: string; frame: { path: string } }[]>([]);
  const idxRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getRadarFrames()
      .then((frames) => {
        if (cancelled || frames.length === 0) return;
        framesRef.current = frames;
        setFrameCount(frames.length);
        setLoading(false);

        const advance = () => {
          const { host, frame } = frames[idxRef.current % frames.length];
          setTileUrl(radarTileUrl(host, frame.path));
          idxRef.current = (idxRef.current + 1) % frames.length;
        };

        advance();
        intervalRef.current = setInterval(advance, FRAME_INTERVAL_MS);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active]);

  return { tileUrl, frameCount, loading };
}
