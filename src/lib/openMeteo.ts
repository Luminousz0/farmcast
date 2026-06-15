// Open-Meteo client — free, no API key required.
// Docs: https://open-meteo.com/en/docs

import type {
  CurrentConditions,
  DailyForecast,
  LatLon,
  PointForecast,
} from "@/types/weather";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const CURRENT_FIELDS = [
  "temperature_2m",
  "relative_humidity_2m",
  "precipitation",
  "weather_code",
  "wind_speed_10m",
  "wind_direction_10m",
  "soil_temperature_6cm",
  "soil_moisture_3_to_9cm",
] as const;

const DAILY_FIELDS = [
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_sum",
  "weather_code",
] as const;

interface OpenMeteoResponse {
  current?: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    soil_temperature_6cm?: number;
    soil_moisture_3_to_9cm?: number;
  };
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    weather_code: number[];
  };
}

function mapCurrent(
  raw: NonNullable<OpenMeteoResponse["current"]>,
): CurrentConditions {
  return {
    time: raw.time,
    temperature: raw.temperature_2m,
    humidity: raw.relative_humidity_2m,
    precipitation: raw.precipitation,
    weatherCode: raw.weather_code,
    windSpeed: raw.wind_speed_10m,
    windDirection: raw.wind_direction_10m,
    soilTemperature: raw.soil_temperature_6cm,
    soilMoisture: raw.soil_moisture_3_to_9cm,
  };
}

function mapDaily(
  raw: NonNullable<OpenMeteoResponse["daily"]>,
): DailyForecast[] {
  return raw.time.map((date, i) => ({
    date,
    tempMax: raw.temperature_2m_max[i] ?? 0,
    tempMin: raw.temperature_2m_min[i] ?? 0,
    precipitation: raw.precipitation_sum[i] ?? 0,
    weatherCode: raw.weather_code[i] ?? 0,
  }));
}

/** Fetch current conditions + 7-day daily forecast for a single point. */
export async function getForecast(loc: LatLon): Promise<PointForecast> {
  const params = new URLSearchParams({
    latitude: loc.lat.toFixed(4),
    longitude: loc.lon.toFixed(4),
    current: CURRENT_FIELDS.join(","),
    daily: DAILY_FIELDS.join(","),
    wind_speed_unit: "kmh",
    timezone: "Europe/Amsterdam",
    forecast_days: "7",
  });

  const res = await fetch(`${FORECAST_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(
      `Open-Meteo request failed: ${res.status} ${res.statusText}`,
    );
  }

  const data = (await res.json()) as OpenMeteoResponse;
  if (!data.current) {
    throw new Error("Open-Meteo response had no current conditions");
  }

  return {
    location: loc,
    current: mapCurrent(data.current),
    daily: data.daily ? mapDaily(data.daily) : [],
  };
}
