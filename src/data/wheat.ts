import type { CropConfig } from '@/types/crop';

export const wheat: CropConfig = {
  id: 'wheat',
  name: 'Tarwe',
  pesticideClass: 'II',
  spray: {
    maxWindSpeed: 12,      // km/h
    maxPrecipitation: 0.5, // mm
    minTemp: 8,            // °C
    maxTemp: 25,           // °C — fungicide uptake impaired in heat
  },
  frost: {
    alertBelowTemp: -3,    // °C — winter wheat is frost-hardy; alert only at hard frost
  },
  harvest: {
    minTemp: 15,           // °C — grain must be warm enough to dry to <14% moisture
    maxTemp: 38,           // °C
    maxPrecipitation: 3,   // mm — grain quality degrades fast when wet; mould risk
    maxWindSpeed: 50,      // km/h — combine header limit; grain shedding above this
  },
};
