import { AnimatePresence, motion } from "framer-motion";
import type { SavedField } from "@/types/field";
import type { CropConfig } from "@/types/crop";
import type { ConditionScore } from "@/types/crop";
import { usePointForecast } from "@/hooks/usePointForecast";
import { scoreCurrentConditions } from "@/lib/evaluate";

const STATUS_COLOR: Record<ConditionScore, string> = {
  go: "#34d399",
  caution: "#fbbf24",
  stop: "#f87171",
};

function FieldRow({
  field,
  crop,
  onSelect,
  onRemove,
}: {
  field: SavedField;
  crop: CropConfig;
  onSelect: (f: SavedField) => void;
  onRemove: (id: string) => void;
}) {
  const { forecast } = usePointForecast({ lat: field.lat, lon: field.lon });
  const advice = forecast?.current
    ? scoreCurrentConditions(forecast.current, crop)
    : null;
  const color = advice
    ? STATUS_COLOR[advice.spray]
    : "rgba(255,255,255,0.15)";

  return (
    <div
      className="group flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-white/[0.05]"
      onClick={() => onSelect(field)}
    >
      <div
        className="h-2 w-2 flex-shrink-0 rounded-full"
        style={{
          backgroundColor: color,
          boxShadow: advice ? `0 0 5px 1px ${color}66` : "none",
        }}
      />
      <span className="min-w-0 flex-1 truncate text-[12px] text-white/70">
        {field.name}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(field.id);
        }}
        className="text-[11px] text-white/30 opacity-0 transition hover:text-white/60 group-hover:opacity-100"
        aria-label="Verwijder perceel"
      >
        ✕
      </button>
    </div>
  );
}

interface FieldsPanelProps {
  fields: SavedField[];
  crop: CropConfig;
  onSelect: (f: SavedField) => void;
  onRemove: (id: string) => void;
}

export function FieldsPanel({
  fields,
  crop,
  onSelect,
  onRemove,
}: FieldsPanelProps) {
  if (fields.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="glass pointer-events-auto absolute left-5 top-20 z-10 w-44 p-2"
    >
      <div className="mb-1.5 px-1 text-[10px] font-medium uppercase tracking-wide text-white/30">
        Mijn percelen
      </div>
      <AnimatePresence initial={false}>
        {fields.map((f) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
          >
            <FieldRow
              field={f}
              crop={crop}
              onSelect={onSelect}
              onRemove={onRemove}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
