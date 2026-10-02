/**
 * Builds a biped from a spec: a list of part names, not drawing code.
 *
 * `makeBiped` turns a `BipedSpec` into a `Recipe` the rig can draw. Adding a character is writing
 * that spec; anything the parts library cannot yet express is a new part, written once and then
 * available to every character after it.
 */

import type { Figure, View } from './figure';
import type { BeardKind, BehindKind, BodyKind, GearKind, HairKind, HeadKind, OffhandKind, Tones, WeaponKind } from './parts';
import { BEARDS, BEHIND, BODY, DEFAULT_TONES, GEAR, HAIR, HEADS, OFFHAND, WEAPONS, atHead } from './parts';
import type { AttackStyle, Build, Recipe } from './rig';
import { bipedFigure } from './rig';

export interface BipedSpec {
  readonly id: string;
  readonly name: string;
  readonly tier: Recipe['tier'];
  readonly build: Build;
  /** Colour of the limbs. */
  readonly limb: string;
  /** Colour of the torso under any clothing. */
  readonly skin: string;
  readonly attack: AttackStyle;
  /** Resting weapon angle, radians from straight up, positive forward. */
  readonly rest: number;
  readonly tones?: Partial<Tones>;
  readonly head: HeadKind;
  readonly beard?: BeardKind;
  readonly hair?: HairKind;
  readonly gear?: readonly GearKind[];
  /** A colour for glowing eyes, if the character has them. */
  readonly eyes?: string;
  readonly body?: readonly BodyKind[];
  readonly behind?: readonly BehindKind[];
  readonly weapon?: WeaponKind;
  readonly offhand?: OffhandKind;
  readonly view?: View;
  readonly motion?: Recipe['motion'];
}

/** Headgear that sits behind the face rather than over it. */
const BEHIND_FACE: ReadonlySet<GearKind> = new Set<GearKind>(['hood']);

export const BIPED_VIEW: View = { x: -30, y: -112, w: 60, h: 62 };

export function makeBiped(spec: BipedSpec): { recipe: Recipe; figure: Figure } {
  const tones: Tones = { ...DEFAULT_TONES, ...spec.tones };
  const gear = spec.gear ?? [];

  const recipe: Recipe = {
    id: spec.id,
    name: spec.name,
    tier: spec.tier,
    build: spec.build,
    skin: spec.skin,
    limbColor: spec.limb,
    attack: spec.attack,
    weaponRest: spec.rest,
    motion: spec.motion,
    drawBehind(ctx, s) {
      for (const kind of spec.behind ?? []) BEHIND[kind](ctx, s, tones);
    },
    drawBody(ctx, s) {
      for (const kind of spec.body ?? []) BODY[kind](ctx, s, tones);
    },
    drawHead(ctx, s) {
      atHead(ctx, s, (r) => {
        if (spec.hair !== undefined) HAIR[spec.hair].back(ctx, r, tones.hair);
        for (const kind of gear) if (BEHIND_FACE.has(kind)) GEAR[kind](ctx, r, tones);
        HEADS[spec.head](ctx, r, tones);
        if (spec.eyes !== undefined) {
          ctx.fillStyle = spec.eyes;
          ctx.fillRect(r * 0.46, -r * 0.14, 3, 2.6);
        }
        if (spec.beard !== undefined) BEARDS[spec.beard](ctx, r, tones.hair);
        if (spec.hair !== undefined) HAIR[spec.hair].front(ctx, r, tones.hair);
        for (const kind of gear) if (!BEHIND_FACE.has(kind)) GEAR[kind](ctx, r, tones);
      });
    },
    drawWeapon(ctx) {
      if (spec.weapon !== undefined) WEAPONS[spec.weapon](ctx, tones);
    },
    drawOffhand:
      spec.offhand === undefined
        ? undefined
        : (ctx, s) => {
            OFFHAND[spec.offhand as OffhandKind](ctx, s, tones);
          },
  };
  return { recipe, figure: bipedFigure(recipe, spec.view ?? BIPED_VIEW) };
}
