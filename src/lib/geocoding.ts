// Open-Meteo Geocoding API — free, no key required.
// Docs: https://open-meteo.com/en/docs/geocoding-api

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

export interface GeoResult {
  id: number;
  name: string;
  lat: number;
  lon: number;
  country: string;
  admin1?: string;
}

interface GeocodingResponse {
  results?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    country: string;
    admin1?: string;
  }>;
}

export async function searchLocation(
  query: string,
  count = 6,
): Promise<GeoResult[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    name: query.trim(),
    count: String(count),
    language: "nl",
    format: "json",
  });

  const res = await fetch(`${GEOCODING_URL}?${params}`);
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);

  const data = (await res.json()) as GeocodingResponse;
  return (data.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    lat: r.latitude,
    lon: r.longitude,
    country: r.country,
    admin1: r.admin1,
  }));
}
