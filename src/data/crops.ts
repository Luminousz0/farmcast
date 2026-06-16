import type { CropConfig } from '@/types/crop';
import { maize } from './maize';
import { potato } from './potato';
import { wheat } from './wheat';
import { onion } from './onion';
import { grass } from './grass';
import { rice } from './rice';
import { soy } from './soy';
import { cassava } from './cassava';
import { cacao } from './cacao';
import { coffee } from './coffee';

export const ALL_CROPS: CropConfig[] = [maize, potato, wheat, onion, grass, rice, soy, cassava, cacao, coffee];

export const NL_CROPS = ALL_CROPS.filter(c => c.region !== 'global');
export const GLOBAL_CROPS = ALL_CROPS.filter(c => c.region === 'global');
