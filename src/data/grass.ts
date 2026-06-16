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
  fertilization: {
    minUptakeTemp: 6,      // °C — grasgroei en N-opname starten bij ~6°C (NL richtlijn)
    maxWindSpeed: 20,      // km/h
    minRainFreeHours: 48,  // h — kunstmest mag niet afspoelen naar sloot
    maxSoilMoisture: 0.38, // m³/m³
  },
  acceptedFertilizers: [
    { name: 'KAS (Kalkammonsalpeter)', useCase: 'Hoofd N-gift per snede — max 80 kg N/ha/snede' },
    { name: 'Drijfmest (rundvee)', useCase: 'N + K — snede 1 en 2, voor maaien uitrijden' },
    { name: 'Urean (vloeibare ureum)', useCase: 'Vloeibare N — bijbemesting na maaien' },
    { name: 'Kali 60 (K₂SO₄)', useCase: 'K-correctie — zandgrond na intensieve maaischema' },
    { name: 'Zwavel (elementaire S)', useCase: 'S-gift — op eiwitarme gronden, april–mei' },
  ],
  acceptedPesticides: [
    { name: 'Pyrethroïde (bijv. cypermethrin)', useCase: 'Bladluis — alleen bij extreme schade, let op bijveiligheid' },
    { name: 'Trifloxystrobine', useCase: 'Roest / meeldauw — alleen bij gevoelige rassen, weidepercelen' },
    { name: 'Glyfosaat', useCase: 'Herinzaai — totaalherbicide, niet op productief grasland' },
    { name: 'MCPA', useCase: 'Breedbladige onkruiden (distels, boterbloem) — na beworteling' },
  ],
};
