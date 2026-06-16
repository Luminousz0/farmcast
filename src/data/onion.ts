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
  fertilization: {
    minUptakeTemp: 8,      // °C — ui heeft warmte nodig voor N-opname
    maxWindSpeed: 20,      // km/h
    minRainFreeHours: 48,  // h — gevoelig voor uitspoeling op lichte grond
    maxSoilMoisture: 0.38, // m³/m³
  },
  acceptedFertilizers: [
    { name: 'KAS (Kalkammonsalpeter)', useCase: 'Hoofd N-gift — gesplitste toediening voorjaar' },
    { name: 'Ammoniumsulfaat', useCase: 'N + S — voorkeur boven ureum (minder ammoniakverlies)' },
    { name: 'NPK 15-15-15 chloorvrij', useCase: 'Startgift — chloor beschadigt bolkwaliteit' },
    { name: 'Magnesiumsulfaat (Epsom)', useCase: 'Mg-correctie — voorkomt topbladverbranding' },
    { name: 'Kali 0-0-60 (chloorvrij)', useCase: 'K-gift — kieseriet of K₂SO₄ variant' },
  ],
  acceptedPesticides: [
    { name: 'Iprodion', useCase: 'Botrytis (nekrot) — preventief bij hoge luchtvochtigheid' },
    { name: 'Metalaxyl + Chloorothalonil', useCase: 'Valse meeldauw (Peronospora) — weerberichten volgen' },
    { name: 'Abamectine', useCase: 'Trips — systemisch, vroeg bij optreden schade' },
    { name: 'Deltamethrin', useCase: 'Uienvlieg — bij eiafzet (april–mei)' },
    { name: 'Tebuconazool', useCase: 'Stengelrot (Fusarium) — zaadbehandeling of vroeg gewas' },
  ],
};
