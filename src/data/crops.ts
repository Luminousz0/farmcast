import type { CropConfig } from '@/types/crop';
import { maize } from './maize';
import { potato } from './potato';
import { wheat } from './wheat';
import { onion } from './onion';
import { grass } from './grass';

export const ALL_CROPS: CropConfig[] = [maize, potato, wheat, onion, grass];
