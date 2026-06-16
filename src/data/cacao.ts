import type { CropConfig } from '@/types/crop';

export const cacao: CropConfig = {
  id: 'cacao',
  name: 'Cacao',
  region: 'global',
  pesticideClass: 'II',
  spray: {
    maxWindSpeed: 10,     // km/h — schaduwgewas; spray onder bladerdek moet precies vallen
    maxPrecipitation: 2,
    minTemp: 18,
    maxTemp: 32,
  },
  frost: {
    alertBelowTemp: 15,   // °C — tropische boom; al bij 15°C stagnatie; <10°C = ernstige schade
    alertBelowSoilTemp: 18,
  },
  harvest: {
    minTemp: 20,
    maxTemp: 36,
    maxPrecipitation: 8,  // mm — natte peulen = schimmelrot (Monilia, Black Pod)
    maxWindSpeed: 25,     // km/h — handmatige oogst; wind verspreidt sporen van Phytophthora
  },
  fertilization: {
    minUptakeTemp: 18,
    maxWindSpeed: 15,
    minRainFreeHours: 24,
    maxSoilMoisture: 0.50,
  },
  acceptedFertilizers: [
    { name: 'NPK 12-12-17 + Mg + S', useCase: 'Basisgift boomgewas — cacao exporteert veel K; Mg-tekort is wijdverspreid' },
    { name: 'Ureum (46-0-0)', useCase: 'Stikstofbijbemesting in gesplitste gift — voor en na bloei' },
    { name: 'Kieseriet (MgSO₄)', useCase: 'Magnesiumgebrek zichtbaar als geelgroen blad; corrigeert ook bodem-S' },
    { name: 'Borium (Borax)', useCase: 'Vruchtzetting en peulontwikkeling; tekort → knopmisvorming' },
    { name: 'Compost / cacaoschillencompost', useCase: 'Bodemstructuur en vochthoudend vermogen; vervangt gedeeltelijk kunstmest' },
  ],
  acceptedPesticides: [
    { name: 'Koperoxychloride / Bordeaux-pap', useCase: 'Phytophthora palmivora (Black Pod) — preventief contactfungicide' },
    { name: 'Metalaxyl-M + Mancozeb', useCase: 'Phytophthora megakarya (Afrikaans Black Pod) — curatief systeem-fungicide' },
    { name: 'Propiconazool', useCase: 'Witrot (Oncobasidium theobromae) — schaduwbodem fungicide' },
    { name: 'Chlorpyrifos / Bifenthrin', useCase: 'Cacaoboorder (Conopomorpha cramerella) en miridenplaag — contactinsecticide' },
    { name: 'Imidacloprid (bodembehandeling)', useCase: 'Wolluis en schildluis — systemisch; voorkomt virusverspreiding' },
  ],
};
