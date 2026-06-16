import type { CropConfig } from '@/types/crop';

export const coffee: CropConfig = {
  id: 'coffee',
  name: 'Koffie',
  region: 'global',
  pesticideClass: 'II',
  spray: {
    maxWindSpeed: 12,
    maxPrecipitation: 0.5, // mm — spray op droge bladeren voor maximale opname
    minTemp: 15,
    maxTemp: 30,
  },
  frost: {
    alertBelowTemp: 4,    // °C — hooglanders zijn vorstgevoelig; C. arabica sterft al bij -2°C
    alertBelowSoilTemp: 6,
  },
  harvest: {
    minTemp: 15,
    maxTemp: 34,
    maxPrecipitation: 3,  // mm — natte kersen → fermentatieproblemen bij processing
    maxWindSpeed: 35,
  },
  fertilization: {
    minUptakeTemp: 14,    // °C — arabica groeit op hoogten met koele nachten; uptake OK van 14°C
    maxWindSpeed: 20,
    minRainFreeHours: 36,
    maxSoilMoisture: 0.42,
  },
  acceptedFertilizers: [
    { name: 'NPK 17-6-18 + Mg + S', useCase: 'Koffiespecifieke formule — hoog K voor kwaliteit; Mg voor chlorofyl' },
    { name: 'Ureum (46-0-0)', useCase: 'Stikstofbijbemesting na bloei — vruchtgroei en opbrengst' },
    { name: 'Kieseriet (MgSO₄)', useCase: 'Mg-tekort veelvoorkomend bij intensieve teelt op uitgespoelde vulkaangronden' },
    { name: 'Borium (Borax)', useCase: 'Bloeiverbetering en vruchtzetting; tekort → lege kersen' },
    { name: 'Organische compost', useCase: 'Bodembehoud op hellingen; Arabica presteert beter op organisch rijke bodems' },
  ],
  acceptedPesticides: [
    { name: 'Triadimefon + Mancozeb', useCase: 'Hemileia vastatrix (koffieblastroest / CBR) — preventief fungicide' },
    { name: 'Propiconazool / Trifloxystrobine', useCase: 'Koffieblastroest curatief + Cercospora koffievlek' },
    { name: 'Chlorantraniliprole / Spinosad', useCase: 'Coffeeberry borer (Hypothenemus hampei) — biologisch of synthetisch insecticide' },
    { name: 'Imidacloprid (bodemdrench)', useCase: 'Wolluis, miridenplaag — systemisch; voorkomt TW/CWD uitbraak' },
    { name: 'Koperhydroxide', useCase: 'Bacteriebrand (Pseudomonas) en Colletotrichum — preventief contactfungicide' },
  ],
};
