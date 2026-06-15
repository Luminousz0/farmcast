import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { DailyForecast, PointForecast } from "@/types/weather";
import { describeWeatherCode } from "@/lib/weatherCode";
import { AnimatedNumber } from "@/components/AnimatedNumber";

interface ConditionPanelProps {
  forecast: PointForecast | null;
  loading: boolean;
  error: string | null;
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

function WeekSparkline({ daily }: { daily: DailyForecast[] }) {
  if (daily.length < 2) return null;

  const temps = daily.map((d) => d.tempMax);
  const dataLo = Math.min(...temps);
  const dataHi = Math.max(...temps);
  const dataRange = dataHi - dataLo || 1;
  // Add 1°C padding above and below so the extreme days never sit flush
  // against the chart edge — they stay clearly visible in the middle area.
  const domainPad = Math.max(dataRange * 0.12, 1);
  const lo = dataLo - domainPad;
  const hi = dataHi + domainPad;
  const range = hi - lo;

  const W = 100;
  const H = 50; // viewBox height — rendered at h-16 (64px) so 1 unit ≈ 1.28px

  const pts = temps.map((t, i) => ({
    x: (i / (temps.length - 1)) * W,
    y: ((hi - t) / range) * H,
  }));

  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const area =
    line +
    ` L ${pts[pts.length - 1].x.toFixed(1)} ${H} L ${pts[0].x.toFixed(1)} ${H} Z`;

  const days = daily.map((d) =>
    // append T12:00 to avoid UTC-midnight timezone drift in NL (UTC+2)
    new Date(`${d.date}T12:00:00`).toLocaleDateString("nl-NL", {
      weekday: "short",
    }),
  );

  return (
    <div className="mt-4 border-t border-white/[0.06] pt-3">
      <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-white/40">
        7 dagen · max. temp.
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-16 w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="fc-spark-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#fc-spark-grad)" />
        <path
          d={line}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={1.8} fill="#38bdf8" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-white/30">
        {days.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] tabular-nums text-white/50">
        {temps.map((t, i) => (
          <span key={i}>{t.toFixed(0)}°</span>
        ))}
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

  // Esc closes the panel (matches the search palette's behaviour).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-medium uppercase tracking-widest text-brand">
              Veldcondities
            </div>
            <div className="mt-0.5 truncate text-sm text-white/60">{label}</div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg px-2 py-1 text-white/40 transition hover:bg-white/10 hover:text-white"
            aria-label="Sluiten"
          >
            ✕
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-8 text-center text-sm text-white/50">
            Gegevens laden…
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="mt-3 rounded-xl border border-stop/30 bg-stop/10 px-3 py-2 text-sm text-stop">
            {error}
          </div>
        )}

        {/* Main content */}
        {current && !loading && !error && (
          <>
            {/* Big weather glyph + temperature */}
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

            {/* Metric grid */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Metric label="Wind" value={current.windSpeed} unit="km/u" />
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

            {/* 7-day trend sparkline */}
            {forecast.daily.length > 0 && (
              <WeekSparkline daily={forecast.daily} />
            )}

            {/* Timestamp */}
            <div className="mt-3 text-[11px] text-white/30">
              Bron: Open-Meteo ·{" "}
              {new Date(current.time).toLocaleString("nl-NL")}
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
