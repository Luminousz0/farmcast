import { AnimatePresence, motion } from "framer-motion";
import type { PointForecast } from "@/types/weather";
import { describeWeatherCode } from "@/lib/weatherCode";
import { AnimatedNumber } from "@/components/AnimatedNumber";

interface ConditionPanelProps {
  forecast: PointForecast | null;
  loading: boolean;
  error: string | null;
  /** Human label for the selected point (e.g. "52.13, 5.29"). */
  label: string;
  onClose: () => void;
}

interface MetricProps {
  label: string;
  value: number | undefined;
  unit: string;
  decimals?: number;
}

function Metric({ label, value, unit, decimals = 0 }: MetricProps) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5">
      <div className="text-[11px] font-medium uppercase tracking-wide text-white/40">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-semibold text-white">
          {value === undefined ? (
            <span className="text-white/30">—</span>
          ) : (
            <AnimatedNumber value={value} decimals={decimals} />
          )}
        </span>
        <span className="text-sm text-white/40">{unit}</span>
      </div>
    </div>
  );
}

export function ConditionPanel({
  forecast,
  loading,
  error,
  label,
  onClose,
}: ConditionPanelProps) {
  const current = forecast?.current;
  const weather = current ? describeWeatherCode(current.weatherCode) : null;

  return (
    <AnimatePresence>
      <motion.div
        key="condition-panel"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="glass pointer-events-auto w-[min(92vw,360px)] p-4 text-white"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-widest text-brand">
              Veldcondities
            </div>
            <div className="mt-0.5 text-sm text-white/60">{label}</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-white/40 transition hover:bg-white/10 hover:text-white"
            aria-label="Sluiten"
          >
            ✕
          </button>
        </div>

        {loading && (
          <div className="py-8 text-center text-sm text-white/50">
            Gegevens laden…
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-xl border border-stop/30 bg-stop/10 px-3 py-2 text-sm text-stop">
            {error}
          </div>
        )}

        {current && !loading && !error && (
          <>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-4xl">{weather?.glyph}</span>
              <div>
                <div className="text-3xl font-bold">
                  <AnimatedNumber value={current.temperature} decimals={1} />
                  <span className="ml-0.5 text-xl font-medium text-white/50">
                    °C
                  </span>
                </div>
                <div className="text-sm text-white/50">{weather?.label}</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Metric
                label="Wind"
                value={current.windSpeed}
                unit="km/u"
              />
              <Metric
                label="Neerslag"
                value={current.precipitation}
                unit="mm"
                decimals={1}
              />
              <Metric
                label="Bodemtemp."
                value={current.soilTemperature}
                unit="°C"
                decimals={1}
              />
              <Metric
                label="Vochtigheid"
                value={current.humidity}
                unit="%"
              />
            </div>

            <div className="mt-3 text-[11px] text-white/30">
              Bron: Open-Meteo · {new Date(current.time).toLocaleString("nl-NL")}
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
