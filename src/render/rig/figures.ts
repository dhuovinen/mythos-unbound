/**
 * Every animated figure in the game, whatever its body: the biped recipes plus the serpents,
 * beasts and flyers built from the other body plans.
 */

import { spriteFigure } from '../art/sprites';
import { GREEK_DEITIES } from '../../data/greek';
import { NORSE_DEITIES } from '../../data/norse';
import { EGYPTIAN_DEITIES } from '../../data/egyptian';
import type { UnitGraphics } from '../../ui/settings';
import type { Deity } from '../../sim/types';
import { makeBeast } from './beast';
import type { Figure } from './figure';
import { makeFlyer } from './flyer';
import { BIPED_FIGURES } from './recipes';
import { makeSerpent } from './serpent';
import { BLOOD, BONE, BONE_SHADE, GREY, SLATE } from './rig';
import { RIG_THEMES } from './themes';

const JORMUNGANDR = makeSerpent({
  id: 'jormungandr',
  name: 'Jormungandr',
  tier: 'titan',
  length: 150,
  girth: 20,
  rear: 66,
  color: '#465b61',
  belly: BONE_SHADE,
  pattern: 'diamond',
  patternColor: '#262a30',
  eye: BLOOD,
  crest: true,
});

const TYPHON = makeSerpent({
  id: 'typhon',
  name: 'Typhon',
  tier: 'titan',
  length: 160,
  girth: 26,
  rear: 78,
  heads: 3,
  color: '#3d3a42',
  belly: GREY,
  pattern: 'bands',
  patternColor: '#26242c',
  eye: BLOOD,
  crest: true,
  horns: true,
});

const FENRIR = makeBeast({
  id: 'fenrir',
  name: 'Fenrir',
  tier: 'titan',
  length: 66,
  depth: 30,
  leg: 38,
  color: '#585a64',
  belly: '#8a8474',
  head: 'wolf',
  headScale: 1.3,
  tail: 'bushy',
  ridge: true,
  tones: { fur: '#585a64', accent: BLOOD },
});

const HARPY = makeFlyer({
  id: 'harpy',
  name: 'Harpy',
  tier: 'chaff',
  hover: 40,
  wing: 64,
  torso: '#6a6455',
  feathers: SLATE,
  feathers2: '#7a7468',
  legs: '#b9b09c',
  head: 'human',
  hair: 'long',
  tones: { skin: BONE, hair: '#2b2a32' },
  headScale: 1.15,
});

const APEP = makeSerpent({
  id: 'apep', name: 'Apep', tier: 'titan', length: 170, girth: 24, rear: 60,
  color: '#554556', belly: '#ad9384', pattern: 'bands', patternColor: '#292430',
  eye: RIG_THEMES.egyptian.accent,
});

const AMMIT = makeBeast({
  id: 'ammit', name: 'Ammit', tier: 'titan', length: 82, depth: 38, leg: 26,
  color: '#71636b', belly: '#ae9885', head: 'crocodile', headScale: 1.2,
  tail: 'whip', ridge: true, tones: { fur: '#65756d', accent: '#bd8c7b' },
  decorate(ctx, shoulder, hip) {
    // Lion's mane at the shoulders, broad hippopotamus hindquarters.
    ctx.strokeStyle = '#ae9885'; ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath(); ctx.moveTo(shoulder.x - 12 - i * 2, shoulder.y - 13);
      ctx.lineTo(shoulder.x - 8 - i * 2, shoulder.y + 15); ctx.stroke();
    }
    ctx.fillStyle = '#8d7a80'; ctx.beginPath();
    ctx.ellipse(hip.x + 4, hip.y, 15, 12, 0, 0, Math.PI * 2); ctx.fill();
  },
});

const BA = makeFlyer({
  id: 'ba', name: 'Ba', tier: 'chaff', hover: 36, wing: 52,
  torso: '#c6ae9b', feathers: '#54465d', feathers2: '#b9a99b', legs: '#ad9384',
  head: 'human', gear: ['nemes'], tones: RIG_THEMES.egyptian.tones,
});

export const RIG_ROSTER = [...GREEK_DEITIES, ...NORSE_DEITIES, ...EGYPTIAN_DEITIES];
const built = new Map([...BIPED_FIGURES, JORMUNGANDR, TYPHON, FENRIR, HARPY, APEP, AMMIT, BA].map((f) => [f.id, f]));
/** Roster order and display names are shared with the game, including accented names. */
export const FIGURES: readonly Figure[] = RIG_ROSTER.flatMap((deity) => {
  const figure = built.get(deity.id);
  return figure === undefined ? [] : [{ ...figure, name: deity.name }];
});

export const FIGURE_BY_ID: ReadonlyMap<string, Figure> = new Map(FIGURES.map((f) => [f.id, f]));

const spriteCache = new Map<string, Figure>();

/**
 * The figure to draw for a deity under the chosen graphics mode, or undefined to draw a block.
 *
 * `sprites` prefers hand-drawn art and falls back to the rig, then to blocks, so a half-delivered
 * roster still renders a complete battlefield. `rig` uses the code-drawn figures only.
 */
export function figureFor(deity: Pick<Deity, 'id' | 'name' | 'tier'>, mode: UnitGraphics): Figure | undefined {
  if (mode === 'blocks') return undefined;
  if (mode === 'sprites') {
    let sprite = spriteCache.get(deity.id);
    if (sprite === undefined) {
      const made = spriteFigure(deity.id, deity.name, deity.tier);
      if (made !== null) {
        spriteCache.set(deity.id, made);
        sprite = made;
      }
    }
    if (sprite !== undefined) return sprite;
  }
  return FIGURE_BY_ID.get(deity.id);
}
