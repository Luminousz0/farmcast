import { AnimatePresence, motion } from "framer-motion";
import type { SavedField } from "@/types/field";
import type { CropConfig } from "@/types/crop";
import { usePointForecast } from "@/hooks/usePointForecast";
import { scoreCurrentConditions } from "@/lib/evaluate";
import { CONDITION_COLORS } from "@/lib/theme";

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
    ? CONDITION_COLORS[advice.spray]
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
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function PanelContent({
  fields,
  crop,
  onSelect,
  onRemove,
  onMobileClose,
}: {
  fields: SavedField[];
  crop: CropConfig;
  onSelect: (f: SavedField) => void;
  onRemove: (id: string) => void;
  onMobileClose?: () => void;
}) {
  return (
    <>
      <div className="mb-1.5 flex items-center justify-between px-1">
        <span className="font-display text-[12px] font-medium text-white/45">
          Mijn percelen
        </span>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="text-[11px] text-white/30 transition hover:text-white/60 md:hidden"
            aria-label="Sluiten"
          >
            ✕
          </button>
        )}
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
              onSelect={(field) => {
                onSelect(field);
                onMobileClose?.();
              }}
              onRemove={onRemove}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </>
  );
}

export function FieldsPanel({
  fields,
  crop,
  onSelect,
  onRemove,
  mobileOpen = false,
  onMobileClose,
}: FieldsPanelProps) {
  if (fields.length === 0) return null;

  return (
    <>
      {/* Desktop: floating card, always visible */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="glass pointer-events-auto absolute left-5 top-20 z-10 hidden w-44 p-2 md:block"
      >
        <PanelContent
          fields={fields}
          crop={crop}
          onSelect={onSelect}
          onRemove={onRemove}
        />
      </motion.div>

      {/* Mobile: bottom drawer, shown when mobileOpen */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="fields-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-20 bg-black/50 md:hidden"
              onClick={onMobileClose}
            />
            <motion.div
              key="fields-drawer"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 32 }}
              className="glass pointer-events-auto fixed inset-x-0 bottom-0 z-20 rounded-t-2xl p-4 pb-safe md:hidden"
            >
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
              <PanelContent
                fields={fields}
                crop={crop}
                onSelect={onSelect}
                onRemove={onRemove}
                onMobileClose={onMobileClose}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
