import type { Pantheon } from '../../sim/types';
import type { Tones } from './parts';

/** The first art-direction pass: shared ink silhouettes, distinct cloth, metal and cadence. */
export const RIG_THEMES: Readonly<Record<Pantheon, {
  label: string; feel: string; accent: string; tones: Partial<Tones>;
  motion: { cadence: number; stride: number; sway: number; weight: number };
}>> = {
  greek: {
    label: 'Greek', feel: 'Marble & wine · poised strides, flowing drapery, clear weapon silhouettes',
    accent: '#b4becf', tones: { cloth: '#cdc8bd', cloth2: '#743b48', metal: '#747986', accent: '#ab5965', hair: '#37313c' },
    motion: { cadence: 1, stride: 1, sway: 0.85, weight: 0.9 },
  },
  norse: {
    label: 'Norse', feel: 'Iron & frost · grounded steps, broad armour, fur and restless cloaks',
    accent: '#90b5b6', tones: { cloth: '#3c4d55', cloth2: '#567879', metal: '#909ca4', accent: '#90b5b6', hair: '#8b6960' },
    motion: { cadence: 0.87, stride: 1.12, sway: 1.15, weight: 1.5 },
  },
  egyptian: {
    label: 'Egyptian', feel: 'Linen & obsidian · measured steps, upright bearing, ceremonial crowns',
    accent: '#bd8c7b', tones: { skin: '#c6ae9b', cloth: '#ddd2be', cloth2: '#645269', metal: '#92909c', accent: '#bd8c7b', hair: '#282630' },
    motion: { cadence: 0.94, stride: 0.75, sway: 0.45, weight: 0.65 },
  },
};
