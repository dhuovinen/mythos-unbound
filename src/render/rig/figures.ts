/**
 * Every animated figure in the game, whatever its body: the biped recipes plus the serpents,
 * beasts and flyers built from the other body plans.
 */

import { spriteFigure } from '../art/sprites';
import type { UnitGraphics } from '../../ui/settings';
import type { Deity } from '../../sim/types';
import { makeBeast } from './beast';
import type { Figure } from './figure';
import { makeFlyer } from './flyer';
import { BIPED_FIGURES } from './recipes';
import { makeSerpent } from './serpent';
import { BLOOD, BONE, BONE_SHADE, GREY, SLATE } from './rig';

const JORMUNGANDR = makeSerpent({
  id: 'jormungandr',
  name: 'Jormungandr',
  tier: 'titan',
  length: 150,
  girth: 20,
  rear: 66,
  color: '#46505a',
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

export const FIGURES: readonly Figure[] = [...BIPED_FIGURES, JORMUNGANDR, TYPHON, FENRIR, HARPY];

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
