// WMO weather interpretation codes → short Dutch label + emoji glyph.
// https://open-meteo.com/en/docs (WMO Weather interpretation codes)

interface CodeInfo {
  label: string;
  glyph: string;
}

const CODES: Record<number, CodeInfo> = {
  0: { label: "Helder", glyph: "☀️" },
  1: { label: "Overwegend helder", glyph: "🌤️" },
  2: { label: "Half bewolkt", glyph: "⛅" },
  3: { label: "Bewolkt", glyph: "☁️" },
  45: { label: "Mist", glyph: "🌫️" },
  48: { label: "Aanvriezende mist", glyph: "🌫️" },
  51: { label: "Lichte motregen", glyph: "🌦️" },
  53: { label: "Motregen", glyph: "🌦️" },
  55: { label: "Dichte motregen", glyph: "🌧️" },
  61: { label: "Lichte regen", glyph: "🌦️" },
  63: { label: "Regen", glyph: "🌧️" },
  65: { label: "Zware regen", glyph: "🌧️" },
  71: { label: "Lichte sneeuw", glyph: "🌨️" },
  73: { label: "Sneeuw", glyph: "🌨️" },
  75: { label: "Zware sneeuw", glyph: "❄️" },
  80: { label: "Buien", glyph: "🌦️" },
  81: { label: "Buien", glyph: "🌧️" },
  82: { label: "Hevige buien", glyph: "⛈️" },
  95: { label: "Onweer", glyph: "⛈️" },
  96: { label: "Onweer met hagel", glyph: "⛈️" },
  99: { label: "Zwaar onweer", glyph: "⛈️" },
};

export function describeWeatherCode(code: number): CodeInfo {
  return CODES[code] ?? { label: "Onbekend", glyph: "🌡️" };
}
