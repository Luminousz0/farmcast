import { motion } from 'framer-motion';
import type { OverlayLayer } from '@/types/weather';

interface LayerSwitcherProps {
  activeLayer: OverlayLayer;
  onChange: (layer: OverlayLayer) => void;
}

const LAYERS: { id: OverlayLayer; label: string; title: string }[] = [
  { id: 'none',        label: 'Kaart', title: 'Geen overlay' },
  { id: 'temperature', label: 'Temp.', title: 'Temperatuurkaart' },
  { id: 'rain',        label: 'Radar', title: 'Neerslageradar' },
];

export function LayerSwitcher({ activeLayer, onChange }: LayerSwitcherProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.7, duration: 0.5 }}
      className="pointer-events-auto flex flex-col gap-1"
    >
      {LAYERS.map(({ id, label, title }) => {
        const isActive = activeLayer === id;
        return (
          <button
            key={id}
            title={title}
            onClick={() => onChange(id)}
            className={[
              'glass cursor-pointer px-3 py-2 text-sm font-medium transition-all duration-200',
              isActive
                ? 'border-brand/50 bg-brand/10 text-white'
                : 'text-white/60 hover:text-white',
            ].join(' ')}
          >
            <span className="flex items-center gap-2 leading-none">
              {label}
              {isActive && (
                <motion.span
                  layoutId="active-dot"
                  className="h-1.5 w-1.5 rounded-full bg-brand"
                />
              )}
            </span>
          </button>
        );
      })}
    </motion.div>
  );
}
