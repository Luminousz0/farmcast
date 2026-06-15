// Open-Meteo client — free, no API key required.
// Docs: https://open-meteo.com/en/docs
//
// Session 1 exposes getForecast() for a single point (the glass panel).
// getGridForecast() (Session 3, country overlay) will be added on top of the
// same `current` parameter set using Open-Meteo's multi-coordinate support.

import type { CurrentConditions, LatLon, PointForecast } from "@/types/weather";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

// The `current` fields we request. Soil fields aren't available everywhere, so
// they're treated as optional downstream.
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

interface OpenMeteoCurrentResponse {
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
}

function mapCurrent(
  raw: NonNullable<OpenMeteoCurrentResponse["current"]>,
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

/** Fetch current conditions for a single point. Units: °C, km/h, mm. */
export async function getForecast(loc: LatLon): Promise<PointForecast> {
  const params = new URLSearchParams({
    latitude: loc.lat.toFixed(4),
    longitude: loc.lon.toFixed(4),
    current: CURRENT_FIELDS.join(","),
    wind_speed_unit: "kmh",
    timezone: "Europe/Amsterdam",
  });

  const res = await fetch(`${FORECAST_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Open-Meteo request failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as OpenMeteoCurrentResponse;
  if (!data.current) {
    throw new Error("Open-Meteo response had no current conditions");
  }

  return { location: loc, current: mapCurrent(data.current) };
}
