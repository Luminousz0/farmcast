import type { CropConfig } from '@/types/crop';

export const onion: CropConfig = {
  id: 'onion',
  name: 'Ui',
  pesticideClass: 'I',   // onion pesticides often require buffer zones — class I legal limit
  spray: {
    maxWindSpeed: 10,      // km/h — agronomic limit (stricter than legal for quality)
    maxPrecipitation: 0.5, // mm
    minTemp: 10,           // °C
    maxTemp: 28,           // °C
  },
  frost: {
    alertBelowTemp: 0,     // °C — bulbs freeze and rot at 0°C
    alertBelowSoilTemp: 2, // °C — root activity halts
  },
  harvest: {
    minTemp: 15,           // °C — bulbs need warmth to dry down
    maxTemp: 35,           // °C
    maxPrecipitation: 2,   // mm — very sensitive; wet bulbs rot in storage
    maxWindSpeed: 40,      // km/h
  },
};
