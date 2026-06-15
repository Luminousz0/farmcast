import { useEffect, useRef } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import type { Bbox, GridPoint } from '@/types/weather';
import { interpolateWind, GRID_DENSITY } from '@/lib/gridSampler';

interface WindParticlesProps {
  mapRef: React.RefObject<MapRef | null>;
  gridPoints: GridPoint[];
  gridBbox: Bbox;
}

interface Particle {
  lat: number;
  lon: number;
  age: number;
  maxAge: number;
}

const NUM_PARTICLES = 1800;
const SPEED_SCALE = 0.15;   // px per frame per km/h of wind
const PARTICLE_COLOR = '56,189,248'; // brand cyan RGB

function randomParticle(bounds: { west: number; east: number; south: number; north: number }): Particle {
  return {
    lat: bounds.south + Math.random() * (bounds.north - bounds.south),
    lon: bounds.west  + Math.random() * (bounds.east  - bounds.west),
    age: Math.floor(Math.random() * 80),
    maxAge: 40 + Math.floor(Math.random() * 60),
  };
}

export function WindParticles({ mapRef, gridPoints, gridBbox }: WindParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Keep a stable array of particles — updated every animation frame.
  const particlesRef = useRef<Particle[]>([]);

  // Re-initialise particles whenever the grid bbox changes (user panned to new area).
  useEffect(() => {
    const map = mapRef.current?.getMap();
    const b = map?.getBounds();
    const bounds = b
      ? { west: b.getWest(), east: b.getEast(), south: b.getSouth(), north: b.getNorth() }
      : { west: gridBbox.lonMin, east: gridBbox.lonMax, south: gridBbox.latMin, north: gridBbox.latMax };

    particlesRef.current = Array.from({ length: NUM_PARTICLES }, () => randomParticle(bounds));
  }, [gridBbox, mapRef]);

  // Animation loop — runs while the wind layer is active.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let frameId: number;

    function frame() {
      const map = mapRef.current?.getMap();
      if (!map || !canvas) { frameId = requestAnimationFrame(frame); return; }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Sync canvas buffer to its CSS display size.
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) { frameId = requestAnimationFrame(frame); return; }
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        // Clear on resize — trail rebuilds naturally within 1–2 seconds.
      }

      // Fade existing trail by reducing all pixel alphas.
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = 'rgba(0,0,0,0.93)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';

      const mb = map.getBounds();
      const spawnBounds = {
        west: mb.getWest(), east: mb.getEast(),
        south: mb.getSouth(), north: mb.getNorth(),
      };

      for (const p of particlesRef.current) {
        const wind = interpolateWind(p.lat, p.lon, gridPoints, gridBbox, GRID_DENSITY);
        const speed = Math.hypot(wind.u, wind.v);

        // Particles in no-wind areas (outside grid or calm) just age out.
        if (speed < 0.5) {
          p.age++;
          if (p.age > p.maxAge) Object.assign(p, randomParticle(spawnBounds));
          continue;
        }

        const from = map.project([p.lon, p.lat]);
        const dx = (wind.u / speed) * speed * SPEED_SCALE;
        const dy = -(wind.v / speed) * speed * SPEED_SCALE; // screen y is inverted
        const nx = from.x + dx;
        const ny = from.y + dy;

        const alpha = (1 - p.age / p.maxAge) * 0.78;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(nx, ny);
        ctx.strokeStyle = `rgba(${PARTICLE_COLOR},${alpha.toFixed(2)})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        const nll = map.unproject([nx, ny]);
        p.lon = nll.lng;
        p.lat = nll.lat;
        p.age++;

        const offscreen = nx < -40 || nx > w + 40 || ny < -40 || ny > h + 40;
        if (p.age > p.maxAge || offscreen) {
          Object.assign(p, randomParticle(spawnBounds));
        }
      }

      frameId = requestAnimationFrame(frame);
    }

    frameId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(frameId);
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [gridPoints, gridBbox, mapRef]);

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
