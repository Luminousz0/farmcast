import type { ConditionScore, CropConfig } from '@/types/crop';
import type { CurrentConditions, DailyForecast, HourlyForecast } from '@/types/weather';
import { CTGB_LEGAL_WIND_KMH } from '@/data/sprayLegal';

export interface CurrentAdvice {
  spray: ConditionScore;
  sprayReason: string;
  /** True when current wind exceeds the ctgb.nl legal limit for this crop's pesticide class */
  sprayLegallyBlocked: boolean;
  /** Undefined for global (non-NL) crops where ctgb.nl limits don't apply */
  sprayLegalReason?: string;
  frost: boolean;
  frostReason: string;
  /** Present for arable crops with harvest thresholds */
  harvest?: ConditionScore;
  harvestReason?: string;
  /** Present for dairy/grassland crops with mowing thresholds */
  mowing?: ConditionScore;
  mowingReason?: string;
}

export interface DayWindowScore {
  spray: ConditionScore;
  /** True when daily max wind exceeds the legal limit */
  sprayLegallyBlocked: boolean;
  /** Present for arable crops */
  harvest?: ConditionScore;
  /** Present for dairy/grassland crops */
  mowing?: ConditionScore;
  frost: boolean;
}

export interface MowingWindowInfo {
  /** 0-based index into daily[] where the first qualifying window starts, or null */
  windowStart: number | null;
  /** YYYY-MM-DD dates of each day in the window */
  windowDates: string[];
}

// ── Hourly spray intelligence ────────────────────────────────────────────────

export interface SprayIntelligence {
  /** Delta-T = dry-bulb − wet-bulb (°C). Optimal 2–8 for NL field spraying. */
  deltaT: number;
  deltaTScore: ConditionScore;
  /** Consecutive rain-free hours from now (precip < 0.1 mm/h). */
  rainFreeHours: number;
  /** True when T − dew point < 3 °C — dew formation / leaf-wetness risk. */
  dewRisk: boolean;
}

/**
 * Stull (2011) wet-bulb approximation from dry-bulb (°C) and relative humidity (%).
 * Accurate within ~0.65 °C for 5% ≤ RH ≤ 99%, −20 ≤ T ≤ 50 °C.
 */
function stullWetBulb(t: number, rh: number): number {
  return (
    t * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) +
    Math.atan(t + rh) -
    Math.atan(rh - 1.676331) +
    0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) -
    4.686035
  );
}

/**
 * Derive spray intelligence metrics from the next 24 h of hourly data.
 * Uses the first (current) hour for Delta-T and dew risk; scans forward for rain-free window.
 */
export function computeSprayIntelligence(hourly: HourlyForecast[]): SprayIntelligence | null {
  if (hourly.length === 0) return null;

  const h0 = hourly[0];
  const wetBulb = stullWetBulb(h0.temperature, h0.humidity);
  const deltaT = Math.round((h0.temperature - wetBulb) * 10) / 10;

  let deltaTScore: ConditionScore;
  if (deltaT < 2) deltaTScore = 'caution';       // won't evaporate; drift risk
  else if (deltaT > 8) deltaTScore = 'stop';     // too dry; evaporation / phytotox risk
  else deltaTScore = 'go';                        // 2–8 °C optimal window

  // Count consecutive hours where precipitation < 0.1 mm/h
  let rainFreeHours = 0;
  for (const h of hourly) {
    if (h.precipitation < 0.1) rainFreeHours++;
    else break;
  }

  // Dew risk: air near saturation → condensation on leaves within the hour
  const dewRisk = (h0.temperature - h0.dewPoint) < 3;

  return { deltaT, deltaTScore, rainFreeHours, dewRisk };
}

// ── Soil intelligence ────────────────────────────────────────────────────────

export interface SoilIntelligence {
  /** True when soil surface (0 cm) temperature ≤ 0°C */
  groundFrost: boolean;
  groundFrostTemp?: number;
  /** Machinery trafficability based on soil moisture 0–1 cm */
  trafficability: ConditionScore;
  trafficabilityReason: string;
  /** Late-blight pressure (potato only) — hours in next 24h meeting Smith Period conditions */
  lateBlightPressureHours?: number;
  lateBlightScore?: 'none' | 'low' | 'high';
  /** Septoria pressure (wheat only) — leaf-wetness hours in next 24h */
  septoriaPressureHours?: number;
  septoriaScore?: 'none' | 'low' | 'high';
}

// ── Irrigation advice ─────────────────────────────────────────────────────────

export interface IrrigationAdvice {
  /** Cumulative 7-day water deficit (ET0 − precip), mm. Negative = surplus. */
  weeklyDeficitMm: number;
  score: ConditionScore;
  reason: string;
  /** Per-day deficit (ET0 − precip, clamped to ≥ 0) */
  dailyDeficits: number[];
}

/**
 * Compute irrigation advice from the 7-day daily forecast.
 * Returns null when ET0 data is unavailable (shouldn't happen with Open-Meteo).
 */
export function computeIrrigationAdvice(daily: DailyForecast[]): IrrigationAdvice | null {
  if (daily.length === 0 || daily[0].et0 === undefined) return null;

  const dailyDeficits = daily.map((d) => Math.max(0, (d.et0 ?? 0) - d.precipitation));
  const weeklyDeficitMm = Math.round(dailyDeficits.reduce((a, b) => a + b, 0) * 10) / 10;

  let score: ConditionScore;
  let reason: string;

  if (weeklyDeficitMm > 20) {
    score = 'stop';
    reason = `Beregening aanbevolen — tekort ${weeklyDeficitMm} mm/week`;
  } else if (weeklyDeficitMm > 10) {
    score = 'caution';
    reason = `Let op — tekort ${weeklyDeficitMm} mm/week`;
  } else {
    score = 'go';
    reason = `Geen beregening nodig — tekort ${weeklyDeficitMm} mm/week`;
  }

  return { weeklyDeficitMm, score, reason, dailyDeficits };
}

/**
 * Derive soil intelligence from next-24h hourly data.
 * Uses first-hour soil readings for ground frost and trafficability.
 * Scans all 24 hours for late-blight pressure (potato only).
 */
export function computeSoilIntelligence(
  hourly: HourlyForecast[],
  crop: CropConfig,
): SoilIntelligence | null {
  if (hourly.length === 0) return null;

  // Ground frost: surface soil temp of first hour
  const soilTemp0 = hourly[0].soilTemperature0cm;
  const groundFrost = soilTemp0 !== undefined && soilTemp0 <= 0;

  // Trafficability: soil moisture 0–1 cm of first hour
  // Thresholds for NL agricultural soils (m³/m³):
  // > 0.38 = saturated → machinery will compact / sink
  // 0.30–0.38 = marginal
  // < 0.30 = firm
  const moisture = hourly[0].soilMoisture0to1cm;
  let trafficability: ConditionScore = 'go';
  let trafficabilityReason = 'Bodem berijdbaar';

  if (moisture !== undefined) {
    if (moisture > 0.38) {
      trafficability = 'stop';
      trafficabilityReason = `Bodem te nat (${(moisture * 100).toFixed(0)}% vol.)`;
    } else if (moisture > 0.30) {
      trafficability = 'caution';
      trafficabilityReason = `Bodem nat (${(moisture * 100).toFixed(0)}% vol.)`;
    } else {
      trafficabilityReason = `Bodem stevig (${(moisture * 100).toFixed(0)}% vol.)`;
    }
  }

  // Late-blight pressure (Smith Period) — potato only
  let lateBlightPressureHours: number | undefined;
  let lateBlightScore: 'none' | 'low' | 'high' | undefined;

  if (crop.lateBlight) {
    const { minTempC, minRhPct, pressureHoursThreshold } = crop.lateBlight;
    const pressureHours = hourly.filter(
      (h) => h.temperature >= minTempC && h.humidity >= minRhPct,
    ).length;
    lateBlightPressureHours = pressureHours;
    if (pressureHours >= pressureHoursThreshold) lateBlightScore = 'high';
    else if (pressureHours >= Math.floor(pressureHoursThreshold / 2)) lateBlightScore = 'low';
    else lateBlightScore = 'none';
  }

  // Septoria pressure (wheat only)
  let septoriaPressureHours: number | undefined;
  let septoriaScore: 'none' | 'low' | 'high' | undefined;

  if (crop.septoria) {
    const { minTempC, maxTempC, minRhPct, pressureHoursHigh, pressureHoursLow } = crop.septoria;
    const pressureHours = hourly.filter(
      (h) =>
        h.temperature >= minTempC &&
        h.temperature <= maxTempC &&
        (h.humidity >= minRhPct || h.precipitation > 0),
    ).length;
    septoriaPressureHours = pressureHours;
    if (pressureHours >= pressureHoursHigh) septoriaScore = 'high';
    else if (pressureHours >= pressureHoursLow) septoriaScore = 'low';
    else septoriaScore = 'none';
  }

  return {
    groundFrost,
    groundFrostTemp: soilTemp0,
    trafficability,
    trafficabilityReason,
    lateBlightPressureHours,
    lateBlightScore,
    septoriaPressureHours,
    septoriaScore,
  };
}

// ── Fertilization advice ─────────────────────────────────────────────────────

export interface FertilizationAdvice {
  score: ConditionScore;
  reason: string;
  /** Consecutive rain-free hours from now (precip < 0.1 mm/h) */
  rainFreeHours: number;
}

/**
 * Weather-driven fertilization timing advice.
 * Checks: rain-free window, soil moisture, temperature, and wind.
 * Returns null when crop has no fertilization thresholds defined.
 */
export function computeFertilizationAdvice(
  hourly: HourlyForecast[],
  daily: DailyForecast[],
  crop: CropConfig,
): FertilizationAdvice | null {
  if (!crop.fertilization || hourly.length === 0) return null;
  const { minUptakeTemp, maxWindSpeed, minRainFreeHours, maxSoilMoisture } = crop.fertilization;

  const h0 = hourly[0];

  // Count consecutive rain-free hours
  let rainFreeHours = 0;
  for (const h of hourly) {
    if (h.precipitation < 0.1) rainFreeHours++;
    else break;
  }

  // Rain expected soon (next 24h daily sum)
  const rainToday = daily[0]?.precipitation ?? 0;
  const rainTomorrow = daily[1]?.precipitation ?? 0;

  const soilMoisture = h0.soilMoisture0to1cm;
  const soilTooWet = soilMoisture !== undefined && soilMoisture > maxSoilMoisture;
  const tooCold = h0.temperature < minUptakeTemp;
  const tooWindy = h0.windSpeed > maxWindSpeed;

  // STOP conditions
  if (soilTooWet) {
    return { score: 'stop', reason: `Bodem te nat — machines beschadigen structuur`, rainFreeHours };
  }
  if (rainFreeHours < 2 && rainToday > 2) {
    return { score: 'stop', reason: `Neerslag — meststof spoelt af (${rainToday.toFixed(1)} mm vandaag)`, rainFreeHours };
  }
  if (tooCold) {
    return { score: 'stop', reason: `Te koud voor N-opname (${h0.temperature.toFixed(1)}°C, min ${minUptakeTemp}°C)`, rainFreeHours };
  }
  if (tooWindy) {
    return { score: 'stop', reason: `Wind te sterk voor strooinauwkeurigheid (${Math.round(h0.windSpeed)} km/u)`, rainFreeHours };
  }

  // CAUTION conditions
  if (rainFreeHours < minRainFreeHours) {
    return { score: 'caution', reason: `Droog venster te kort — ${rainFreeHours}u droog, min ${minRainFreeHours}u nodig`, rainFreeHours };
  }
  if (rainTomorrow > 5) {
    return { score: 'caution', reason: `Zware neerslag morgen (${rainTomorrow.toFixed(1)} mm) — risico op uitspoeling`, rainFreeHours };
  }
  if (rainTomorrow > 1) {
    return { score: 'caution', reason: `Neerslag verwacht morgen (${rainTomorrow.toFixed(1)} mm) — monitor`, rainFreeHours };
  }

  return { score: 'go', reason: `Goede omstandigheden — ${rainFreeHours}u droog venster`, rainFreeHours };
}

// ── Mowing window ─────────────────────────────────────────────────────────────

/**
 * Find the first run of `dryDaysRequired` consecutive good mowing days in the
 * 7-day daily forecast. A "good" day meets all mowing thresholds.
 */
export function computeMowingWindow(
  daily: DailyForecast[],
  crop: CropConfig,
): MowingWindowInfo | null {
  if (!crop.mowing) return null;
  const { maxPrecipitation, maxWindSpeed, minTemp, dryDaysRequired } = crop.mowing;

  const isGoodDay = (d: DailyForecast): boolean =>
    d.precipitation <= maxPrecipitation &&
    d.tempMax >= minTemp &&
    (d.windSpeedMax === undefined || d.windSpeedMax <= maxWindSpeed);

  for (let i = 0; i <= daily.length - dryDaysRequired; i++) {
    const window = daily.slice(i, i + dryDaysRequired);
    if (window.every(isGoodDay)) {
      return { windowStart: i, windowDates: window.map((d) => d.date) };
    }
  }

  return { windowStart: null, windowDates: [] };
}

/** Score current conditions for the advice strip (uses full current data incl. wind). */
export function scoreCurrentConditions(
  current: CurrentConditions,
  crop: CropConfig,
): CurrentAdvice {
  const isGlobal = crop.region === 'global';
  const legalMaxWind = isGlobal ? Infinity : CTGB_LEGAL_WIND_KMH[crop.pesticideClass];

  // --- Legal spray check (NL only) ---
  const sprayLegallyBlocked = isGlobal ? false : current.windSpeed > legalMaxWind;
  const sprayLegalReason = isGlobal
    ? undefined
    : sprayLegallyBlocked
      ? `Wettelijk verboden — wind ${Math.round(current.windSpeed)} km/u (max ${legalMaxWind} km/u klasse ${crop.pesticideClass})`
      : `Klasse ${crop.pesticideClass} — max ${legalMaxWind} km/u`;

  // --- Spray (agronomic) ---
  let spray: ConditionScore = 'go';
  let sprayReason = 'Condities gunstig';

  if (current.precipitation > crop.spray.maxPrecipitation) {
    spray = 'stop';
    sprayReason = `Neerslag te hoog (${current.precipitation.toFixed(1)} mm)`;
  } else if (current.windSpeed > crop.spray.maxWindSpeed) {
    spray = 'stop';
    sprayReason = `Wind te sterk (${Math.round(current.windSpeed)} km/u)`;
  } else if (current.temperature < crop.spray.minTemp) {
    spray = 'stop';
    sprayReason = `Te koud voor opname (${current.temperature.toFixed(1)}°C)`;
  } else if (current.temperature > crop.spray.maxTemp) {
    spray = 'caution';
    sprayReason = `Warm — verdampingsrisico`;
  } else if (current.windSpeed > crop.spray.maxWindSpeed * 0.75) {
    spray = 'caution';
    sprayReason = `Wind aan de hoge kant (${Math.round(current.windSpeed)} km/u)`;
  }

  // --- Frost ---
  const soilFrost =
    current.soilTemperature !== undefined &&
    crop.frost.alertBelowSoilTemp !== undefined &&
    current.soilTemperature <= crop.frost.alertBelowSoilTemp;

  const frost = current.temperature <= crop.frost.alertBelowTemp || soilFrost;
  const frostReason = frost
    ? soilFrost
      ? `Bodemtemp. laag (${current.soilTemperature?.toFixed(1)}°C)`
      : `Vorstrisico (${current.temperature.toFixed(1)}°C)`
    : 'Geen vorstrisico';

  // --- Harvest (arable crops only) ---
  let harvest: ConditionScore | undefined;
  let harvestReason: string | undefined;

  if (crop.harvest) {
    harvest = 'go';
    harvestReason = 'Goed oogstmoment';

    if (current.windSpeed > crop.harvest.maxWindSpeed) {
      harvest = 'stop';
      harvestReason = `Wind te sterk voor machines`;
    } else if (current.precipitation > crop.harvest.maxPrecipitation) {
      harvest = 'stop';
      harvestReason = `Veld te nat (${current.precipitation.toFixed(1)} mm)`;
    } else if (current.temperature < crop.harvest.minTemp) {
      harvest = 'caution';
      harvestReason = `Koud — vochtgehalte hoog`;
    } else if (current.temperature > crop.harvest.maxTemp) {
      harvest = 'caution';
      harvestReason = `Erg warm`;
    } else if (current.precipitation > crop.harvest.maxPrecipitation * 0.4) {
      harvest = 'caution';
      harvestReason = `Enige neerslag (${current.precipitation.toFixed(1)} mm)`;
    }
  }

  // --- Mowing (dairy/grassland crops only) ---
  let mowing: ConditionScore | undefined;
  let mowingReason: string | undefined;

  if (crop.mowing) {
    mowing = 'go';
    mowingReason = 'Goed maaimoment';

    if (current.precipitation > crop.mowing.maxPrecipitation) {
      mowing = 'stop';
      mowingReason = `Neerslag — veld te nat (${current.precipitation.toFixed(1)} mm)`;
    } else if (current.windSpeed > crop.mowing.maxWindSpeed) {
      mowing = 'stop';
      mowingReason = `Wind te sterk (${Math.round(current.windSpeed)} km/u)`;
    } else if (current.temperature < crop.mowing.minTemp) {
      mowing = 'caution';
      mowingReason = `Koud — drogen gaat traag (${current.temperature.toFixed(1)}°C)`;
    } else if (current.precipitation > crop.mowing.maxPrecipitation * 0.4) {
      mowing = 'caution';
      mowingReason = `Enige neerslag — gras droogt langzamer`;
    }
  }

  return { spray, sprayReason, sprayLegallyBlocked, sprayLegalReason, frost, frostReason, harvest, harvestReason, mowing, mowingReason };
}

/** Score a single daily forecast day for the 7-day best-window row. */
export function scoreDay(day: DailyForecast, crop: CropConfig): DayWindowScore {
  const isGlobal = crop.region === 'global';
  const legalMaxWind = isGlobal ? Infinity : CTGB_LEGAL_WIND_KMH[crop.pesticideClass];
  const sprayLegallyBlocked = isGlobal ? false : (day.windSpeedMax !== undefined && day.windSpeedMax > legalMaxWind);

  // --- Spray ---
  let spray: ConditionScore = 'go';

  if (
    day.windSpeedMax !== undefined &&
    day.windSpeedMax > crop.spray.maxWindSpeed
  ) {
    spray = 'stop';
  } else if (day.precipitation > crop.spray.maxPrecipitation * 3) {
    spray = 'stop';
  } else if (
    day.tempMax < crop.spray.minTemp ||
    day.precipitation > crop.spray.maxPrecipitation
  ) {
    spray = 'caution';
  } else if (
    day.windSpeedMax !== undefined &&
    day.windSpeedMax > crop.spray.maxWindSpeed * 0.75
  ) {
    spray = 'caution';
  } else if (day.tempMax > crop.spray.maxTemp) {
    spray = 'caution';
  }

  // --- Harvest (arable crops only) ---
  let harvest: ConditionScore | undefined;

  if (crop.harvest) {
    harvest = 'go';

    if (day.precipitation > crop.harvest.maxPrecipitation) {
      harvest = 'stop';
    } else if (
      day.windSpeedMax !== undefined &&
      day.windSpeedMax > crop.harvest.maxWindSpeed
    ) {
      harvest = 'stop';
    } else if (
      day.tempMax < crop.harvest.minTemp ||
      day.precipitation > crop.harvest.maxPrecipitation * 0.4
    ) {
      harvest = 'caution';
    } else if (day.tempMax > crop.harvest.maxTemp) {
      harvest = 'caution';
    }
  }

  // --- Mowing (dairy/grassland crops only) ---
  let mowing: ConditionScore | undefined;

  if (crop.mowing) {
    mowing = 'go';

    if (day.precipitation > crop.mowing.maxPrecipitation) {
      mowing = 'stop';
    } else if (
      day.windSpeedMax !== undefined &&
      day.windSpeedMax > crop.mowing.maxWindSpeed
    ) {
      mowing = 'stop';
    } else if (day.tempMax < crop.mowing.minTemp) {
      mowing = 'caution';
    } else if (day.precipitation > crop.mowing.maxPrecipitation * 0.4) {
      mowing = 'caution';
    }
  }

  // --- Frost ---
  const frost = day.tempMin <= crop.frost.alertBelowTemp;

  return { spray, sprayLegallyBlocked, harvest, mowing, frost };
}
