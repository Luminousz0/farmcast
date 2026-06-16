import type { PesticideClass } from '@/types/crop';

/**
 * Legal max wind speed (km/h) for outdoor spraying per ctgb.nl drift class.
 * Class I = strictest (buffer zones, aquatic risk); III = low-drift nozzles.
 */
export const CTGB_LEGAL_WIND_KMH: Record<PesticideClass, number> = {
  'I':   8,
  'II':  12,
  'III': 18,
};
