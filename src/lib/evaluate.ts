import type { ConditionScore, CropConfig } from '@/types/crop';
import type { CurrentConditions, DailyForecast, HourlyForecast } from '@/types/weather';
import { CTGB_LEGAL_WIND_KMH } from '@/data/sprayLegal';

export interface CurrentAdvice {
  spray: ConditionScore;
  sprayReason: string;
  /** True when current wind exceeds the ctgb.nl legal limit for this crop's pesticide class */
  sprayLegallyBlocked: boolean;
  sprayLegalReason: string;
  frost: boolean;
  frostReason: string;
  harvest: ConditionScore;
  harvestReason: string;
}

export interface DayWindowScore {
  spray: ConditionScore;
  /** True when daily max wind exceeds the legal limit */
  sprayLegallyBlocked: boolean;
  harvest: ConditionScore;
  frost: boolean;
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

  return {
    groundFrost,
    groundFrostTemp: soilTemp0,
    trafficability,
    trafficabilityReason,
    lateBlightPressureHours,
    lateBlightScore,
  };
}

/** Score current conditions for the advice strip (uses full current data incl. wind). */
export function scoreCurrentConditions(
  current: CurrentConditions,
  crop: CropConfig,
): CurrentAdvice {
  const legalMaxWind = CTGB_LEGAL_WIND_KMH[crop.pesticideClass];

  // --- Legal spray check ---
  const sprayLegallyBlocked = current.windSpeed > legalMaxWind;
  const sprayLegalReason = sprayLegallyBlocked
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

  // --- Harvest ---
  let harvest: ConditionScore = 'go';
  let harvestReason = 'Goed oogstmoment';

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

  return { spray, sprayReason, sprayLegallyBlocked, sprayLegalReason, frost, frostReason, harvest, harvestReason };
}

/** Score a single daily forecast day for the 7-day best-window row. */
export function scoreDay(day: DailyForecast, crop: CropConfig): DayWindowScore {
  const legalMaxWind = CTGB_LEGAL_WIND_KMH[crop.pesticideClass];
  const sprayLegallyBlocked = day.windSpeedMax !== undefined && day.windSpeedMax > legalMaxWind;

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

  // --- Harvest ---
  let harvest: ConditionScore = 'go';

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

  // --- Frost ---
  const frost = day.tempMin <= crop.frost.alertBelowTemp;

  return { spray, sprayLegallyBlocked, harvest, frost };
}
