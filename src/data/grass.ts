import type { CropConfig } from '@/types/crop';

export const grass: CropConfig = {
  id: 'grass',
  name: 'Gras',
  pesticideClass: 'I',
  spray: {
    maxWindSpeed: 8,       // km/h — herbicides / liquid fertilizer on grassland
    maxPrecipitation: 0.5, // mm — wash-off threshold
    minTemp: 6,            // °C — minimal metabolic uptake below this
    maxTemp: 28,           // °C — heat stress on applicator
  },
  frost: {
    alertBelowTemp: 0,     // °C — grass growth stalls; frost on mown field delays drying
  },
  mowing: {
    maxPrecipitation: 2,   // mm/day — wet conditions cause compaction and slow wilting
    maxWindSpeed: 45,      // km/h — mowers are not wind-limited beyond gale force
    minTemp: 8,            // °C — below this grass dries slowly and loses feed quality
    dryDaysRequired: 3,    // days — Dutch silage standard: 3 consecutive dry days to wilt + bale
  },
};
