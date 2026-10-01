/**
 * Biped characters, as specs over the parts library.
 *
 * The five comparison deities — Hoplite, Anubis, Zeus, Thor, Cronus — rebuilt from shared parts so
 * the library is proven on real characters. The identifying attribute is deliberately large: a
 * hoplite is mostly shield, Zeus is beard and bolt, Anubis is ears and muzzle, Cronus is hood and
 * scythe. No gold: bone, ink, blood and greys only.
 */

import type { Figure } from './figure';
import { makeBiped } from './compose';
import type { BipedSpec } from './compose';
import { BLOOD, BLOOD_DARK, BONE, BONE_SHADE, GREY, SLATE } from './rig';
import type { Recipe } from './rig';

const SPECS: readonly BipedSpec[] = [
  {
    id: 'hoplite',
    name: 'Hoplite',
    tier: 'chaff',
    build: { bulk: 1, legs: 1, hunch: 0.05, head: 1 },
    limb: BONE,
    skin: '#3b3b45',
    attack: 'thrust',
    rest: 0.08,
    tones: { cloth: '#3b3b45', cloth2: BLOOD_DARK, metal: SLATE, accent: BLOOD },
    head: 'human',
    gear: ['corinthian'],
    body: ['tunic', 'cuirass', 'greaves'],
    weapon: 'spear',
    offhand: 'shieldRound',
  },
  {
    id: 'anubis',
    name: 'Anubis',
    tier: 'demigod',
    build: { bulk: 0.88, legs: 1.06, hunch: 0.04, head: 1.05 },
    limb: '#56535e',
    skin: SLATE,
    attack: 'thrust',
    rest: 0.1,
    tones: { fur: '#2b2a32', cloth2: BLOOD_DARK },
    head: 'jackal',
    body: ['kilt', 'collar'],
    weapon: 'was',
    view: { x: -26, y: -112, w: 78, h: 62 },
  },
  {
    id: 'zeus',
    name: 'Zeus',
    tier: 'god',
    build: { bulk: 1.3, legs: 0.96, hunch: 0.03, head: 1.12 },
    limb: BONE,
    skin: BONE_SHADE,
    attack: 'overhead',
    rest: 0.5,
    tones: { cloth: BONE_SHADE, cloth2: BLOOD_DARK, hair: '#d3cab4' },
    head: 'human',
    beard: 'swept',
    hair: 'long',
    body: ['chiton', 'aegis'],
    weapon: 'bolt',
  },
  {
    id: 'thor',
    name: 'Thor',
    tier: 'god',
    build: { bulk: 1.5, legs: 0.88, hunch: 0.07, head: 1.08 },
    limb: BONE,
    skin: '#3d3a42',
    attack: 'overhead',
    rest: 0.75,
    tones: { cloth: '#3d3a42', cloth2: BLOOD_DARK, metal: GREY, accent: BLOOD, hair: BLOOD_DARK },
    head: 'human',
    beard: 'braided',
    gear: ['helmWinged'],
    behind: ['cloak'],
    body: ['tunic', 'pauldron'],
    weapon: 'hammer',
  },
  {
    id: 'cronus',
    name: 'Cronus',
    tier: 'titan',
    build: { bulk: 1.75, legs: 0.92, hunch: 0.32, head: 1 },
    limb: GREY,
    skin: '#2e2c34',
    attack: 'sweep',
    rest: 0.3,
    tones: { skin: '#b9b09c', cloth: '#26242c', cloth2: BLOOD_DARK },
    head: 'human',
    eyes: BLOOD,
    gear: ['hood'],
    behind: ['hoodCloak'],
    body: ['rags'],
    weapon: 'sickle',
  },
];

const built = SPECS.map(makeBiped);

export const RECIPES: readonly Recipe[] = built.map((b) => b.recipe);
export const BIPED_FIGURES: readonly Figure[] = built.map((b) => b.figure);
