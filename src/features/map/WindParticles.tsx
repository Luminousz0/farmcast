import { useEffect, useRef } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import type { GridPoint } from '@/types/weather';
import { interpolateWind, NL_BBOX } from '@/lib/gridSampler';

interface WindParticlesProps {
  mapRef: React.RefObject<MapRef | null>;
  gridPoints: GridPoint[];
}

interface Particle {
  lat: number;
  lon: number;
  age: number;
  maxAge: number;
}

const NUM_PARTICLES = 1800;
// Pixels moved per frame per km/h of wind — tuned so 20 km/h ≈ 3 px/frame.
const SPEED_SCALE = 0.15;
const PARTICLE_COLOR = '56,189,248'; // brand cyan (RGB)

function randomInNL(): Pick<Particle, 'lat' | 'lon'> {
  return {
    lat: NL_BBOX.latMin + Math.random() * (NL_BBOX.latMax - NL_BBOX.latMin),
    lon: NL_BBOX.lonMin + Math.random() * (NL_BBOX.lonMax - NL_BBOX.lonMin),
  };
}

function makeParticle(): Particle {
  return {
    ...randomInNL(),
    age: Math.floor(Math.random() * 80), // stagger so they don't all reset together
    maxAge: 40 + Math.floor(Math.random() * 60),
  };
}

export function WindParticles({ mapRef, gridPoints }: WindParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gridPoints.length === 0) return;

    const particles: Particle[] = Array.from({ length: NUM_PARTICLES }, makeParticle);
    let frameId: number;

    function frame() {
      const map = mapRef.current?.getMap();
      if (!map || !canvas) { frameId = requestAnimationFrame(frame); return; }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Sync canvas buffer to its CSS display size (handles window resizes cleanly)
      const w = canvas.clientWidth || 1;
      const h = canvas.clientHeight || 1;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      // Fade existing trails by reducing alpha of every pixel
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = 'rgba(0,0,0,0.93)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';

      for (const p of particles) {
        const wind = interpolateWind(p.lat, p.lon, gridPoints);
        const speed = Math.hypot(wind.u, wind.v);

        if (speed < 1) {
          Object.assign(p, randomInNL());
          p.age = 0;
          continue;
        }

        // Project current lat/lon to canvas pixels (MapLibre returns CSS-pixel coords)
        const from = map.project([p.lon, p.lat]);

        const dx = (wind.u / speed) * speed * SPEED_SCALE;
        const dy = -(wind.v / speed) * speed * SPEED_SCALE; // screen y inverts north

        const nx = from.x + dx;
        const ny = from.y + dy;

        // Draw trail segment
        const alpha = (1 - p.age / p.maxAge) * 0.75;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(nx, ny);
        ctx.strokeStyle = `rgba(${PARTICLE_COLOR},${alpha.toFixed(2)})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Update position by unprojecting the new pixel
        const newLL = map.unproject([nx, ny]);
        p.lon = newLL.lng;
        p.lat = newLL.lat;
        p.age++;

        // Reset if aged out or drifted off-screen
        const offscreen = nx < -40 || nx > w + 40 || ny < -40 || ny > h + 40;
        if (p.age > p.maxAge || offscreen) {
          Object.assign(p, randomInNL());
          p.age = 0;
        }
      }

      frameId = requestAnimationFrame(frame);
    }

    frameId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(frameId);
      // Clear canvas on unmount so no stale pixels remain if layer is re-enabled
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [gridPoints, mapRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
}
