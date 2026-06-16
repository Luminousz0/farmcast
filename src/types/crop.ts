export type ConditionScore = 'go' | 'caution' | 'stop';

/** ctgb.nl pesticide drift class — determines legal max wind speed for outdoor spraying */
export type PesticideClass = 'I' | 'II' | 'III';

export interface SprayThresholds {
  /** Max wind speed km/h */
  maxWindSpeed: number;
  /** Max precipitation mm — above this spray washes off */
  maxPrecipitation: number;
  /** Min air temp °C — below this uptake is poor */
  minTemp: number;
  /** Max air temp °C — above this evaporation risk */
  maxTemp: number;
}

export interface FrostThresholds {
  /** Air temp °C at or below which frost alert fires */
  alertBelowTemp: number;
  /** Soil temp °C at or below which frost alert fires (optional) */
  alertBelowSoilTemp?: number;
}

export interface HarvestThresholds {
  minTemp: number;
  maxTemp: number;
  /** Max precipitation mm — above this field is too wet */
  maxPrecipitation: number;
  /** Max wind speed km/h — structural limit for harvest machinery */
  maxWindSpeed: number;
}

export interface MowingThresholds {
  /** Max precipitation mm/day — wet field risks compaction and poor wilting */
  maxPrecipitation: number;
  /** Max wind speed km/h */
  maxWindSpeed: number;
  /** Min temp °C — grass quality and drying poor below this */
  minTemp: number;
  /** Number of consecutive good days required for a mowing window */
  dryDaysRequired: number;
}

/** Septoria (Zymoseptoria tritici) pressure configuration (wheat-specific). */
export interface SeptoriaConfig {
  /** Min air temperature °C for a pressure hour */
  minTempC: number;
  /** Max air temperature °C for a pressure hour */
  maxTempC: number;
  /** Min relative humidity % OR precip > 0 counts as leaf-wetness */
  minRhPct: number;
  /** Hours per 24h window that trigger high pressure */
  pressureHoursHigh: number;
  /** Hours per 24h window that trigger low pressure */
  pressureHoursLow: number;
}

/** Smith Period late-blight pressure configuration (potato-specific). */
export interface LateBlightConfig {
  /** Min air temperature °C for a pressure hour (Smith Period: 10°C) */
  minTempC: number;
  /** Min relative humidity % for a pressure hour (Smith Period: 90%) */
  minRhPct: number;
  /** Hours per 24h window that trigger a pressure day (Smith Period: 11h) */
  pressureHoursThreshold: number;
}

export interface FertilizationThresholds {
  /** Min air temp °C — below this soil biology is too slow for N uptake */
  minUptakeTemp: number;
  /** Max wind speed km/h — above this spread accuracy is poor */
  maxWindSpeed: number;
  /** Min consecutive rain-free hours required before + after application */
  minRainFreeHours: number;
  /** Max soil moisture m³/m³ — above this field is too wet for machinery */
  maxSoilMoisture: number;
}

export interface CropInput {
  name: string;
  useCase: string;
}

export interface CropConfig {
  id: string;
  name: string;
  /** ctgb.nl drift class — used to look up the legal spray wind limit */
  pesticideClass: PesticideClass;
  /** 'global' = non-NL crop; skips ctgb.nl legal spray limit display */
  region?: 'global';
  spray: SprayThresholds;
  frost: FrostThresholds;
  /** Not present on dairy/grassland crops — use mowing instead */
  harvest?: HarvestThresholds;
  /** Present on dairy/grassland crops — drives mowing window */
  mowing?: MowingThresholds;
  /** Present only on crops susceptible to late blight (Phytophthora infestans) */
  lateBlight?: LateBlightConfig;
  /** Present only on crops susceptible to Septoria (Zymoseptoria tritici) */
  septoria?: SeptoriaConfig;
  /** Weather-driven fertilization timing thresholds */
  fertilization?: FertilizationThresholds;
  /** Accepted fertilizer types for this crop (NL/EU agronomic practice) */
  acceptedFertilizers?: CropInput[];
  /** Accepted pesticide/fungicide active ingredient categories (CTGB-registered classes) */
  acceptedPesticides?: CropInput[];
}
