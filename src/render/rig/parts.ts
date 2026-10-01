/**
 * The parts library: heads, headgear, beards, hair, clothing, weapons and shields.
 *
 * Every part draws in a fixed local frame so any deity can wear any part:
 *  - Heads, headgear, beards and hair draw in the HEAD frame: origin at the head's centre, radius
 *    `r`, facing +x, -y up.
 *  - Weapons draw in the HAND frame: origin at the fist, the weapon rising along -y.
 *  - Clothing draws in WORLD (rig) coordinates from the skeleton's joints.
 *
 * A character is then a short list of part names (see compose.ts), not hand-written drawing code.
 *
 * Art rules: heavy ink outline, flat fills, **no gold**. Colours come from the character's `Tones`,
 * which are bone, ink, blood and greys mixed from them.
 */

import type { Skel } from './rig';
import { BLOOD, BLOOD_DARK, BONE, BONE_SHADE, GREY, INK, SLATE, capsule, inked, poly } from './rig';

type Ctx = CanvasRenderingContext2D;

/** The palette a character's parts are painted from. */
export interface Tones {
  readonly skin: string;
  readonly hair: string;
  readonly cloth: string;
  readonly cloth2: string;
  readonly metal: string;
  readonly accent: string;
  /** Fur, feathers, scales — the colour of an animal head. */
  readonly fur: string;
}

export const DEFAULT_TONES: Tones = {
  skin: BONE,
  hair: '#d3cab4',
  cloth: BONE_SHADE,
  cloth2: BLOOD_DARK,
  metal: GREY,
  accent: BLOOD,
  fur: '#2b2a32',
};

/** Runs `draw` in the head frame: translated to the head and rotated with it. */
export function atHead(ctx: Ctx, s: Pick<Skel, 'head' | 'headAngle' | 'headR'>, draw: (r: number) => void): void {
  ctx.save();
  ctx.translate(s.head.x, s.head.y);
  ctx.rotate(s.headAngle);
  draw(s.headR);
  ctx.restore();
}

const line = (ctx: Ctx, color: string, width: number, pts: readonly (readonly [number, number])[]): void => {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.stroke();
};

// ===========================================================================
// HEADS
// ===========================================================================

/** A plain human face in profile: skull, nose, brow, eye, ear. */
export function faceHuman(ctx: Ctx, r: number, skin: string): void {
  inked(ctx, skin, 1.8, () => ctx.arc(0, 0, r, 0, Math.PI * 2));
  inked(ctx, skin, 1.4, () => poly(ctx, [[r * 0.85, -r * 0.05], [r * 1.3, r * 0.25], [r * 0.85, r * 0.42]]));
  line(ctx, INK, 2.2, [[r * 0.25, -r * 0.28], [r * 0.78, -r * 0.2]]);
  ctx.fillStyle = INK;
  ctx.fillRect(r * 0.46, -r * 0.1, 2.2, 2.2);
  inked(ctx, skin, 1.2, () => ctx.arc(-r * 0.15, r * 0.12, r * 0.22, 0, Math.PI * 2));
}

export type HeadKind = 'human' | 'skull' | 'jackal' | 'wolf' | 'falcon' | 'ibis' | 'lion' | 'setbeast';

export const HEADS: Readonly<Record<HeadKind, (ctx: Ctx, r: number, t: Tones) => void>> = {
  human: (ctx, r, t) => faceHuman(ctx, r, t.skin),

  skull: (ctx, r, t) => {
    inked(ctx, BONE_SHADE, 1.8, () => ctx.arc(0, 0, r, 0, Math.PI * 2));
    inked(ctx, BONE_SHADE, 1.4, () => poly(ctx, [[r * 0.4, r * 0.35], [r * 1.0, r * 0.4], [r * 0.95, r * 1.0], [r * 0.35, r * 0.95]]));
    inked(ctx, INK, 1, () => ctx.ellipse(r * 0.45, -r * 0.1, r * 0.3, r * 0.34, 0, 0, Math.PI * 2));
    inked(ctx, INK, 1, () => poly(ctx, [[r * 0.95, r * 0.15], [r * 1.1, r * 0.35], [r * 0.85, r * 0.38]]));
    line(ctx, INK, 1.2, [[r * 0.4, r * 0.75], [r * 0.95, r * 0.72]]);
    ctx.fillStyle = t.accent;
    ctx.fillRect(r * 0.42, -r * 0.14, 2, 2);
  },

  jackal: (ctx, r, t) => {
    // Two tall ears first so the skull overlaps their roots.
    inked(ctx, t.fur, 1.6, () => poly(ctx, [[-r * 0.5, -r * 0.6], [-r * 0.15, -r * 2.5], [r * 0.35, -r * 0.7]]));
    inked(ctx, t.fur, 1.6, () => poly(ctx, [[r * 0.05, -r * 0.7], [r * 0.6, -r * 2.3], [r * 0.85, -r * 0.45]]));
    inked(ctx, BLOOD_DARK, 1, () => poly(ctx, [[r * 0.15, -r * 0.8], [r * 0.55, -r * 1.85], [r * 0.7, -r * 0.6]]));
    inked(ctx, t.fur, 1.8, () => ctx.arc(0, 0, r, 0, Math.PI * 2));
    inked(ctx, t.fur, 1.8, () => poly(ctx, [[r * 0.35, -r * 0.55], [r * 2.35, r * 0.12], [r * 2.3, r * 0.5], [r * 0.45, r * 0.75]]));
    inked(ctx, INK, 1, () => ctx.ellipse(r * 2.3, r * 0.2, r * 0.22, r * 0.2, 0, 0, Math.PI * 2));
    line(ctx, SLATE, 1.2, [[r * 0.5, r * 0.4], [r * 2.1, r * 0.34]]);
    inked(ctx, BONE, 1, () => ctx.ellipse(r * 0.6, -r * 0.12, r * 0.3, r * 0.17, 0.15, 0, Math.PI * 2));
    ctx.fillStyle = INK;
    ctx.fillRect(r * 0.66, -r * 0.16, 2.2, 2.2);
  },

  wolf: (ctx, r, t) => {
    inked(ctx, t.fur, 1.6, () => poly(ctx, [[-r * 0.4, -r * 0.6], [-r * 0.1, -r * 1.6], [r * 0.35, -r * 0.7]]));
    inked(ctx, t.fur, 1.6, () => poly(ctx, [[r * 0.1, -r * 0.7], [r * 0.5, -r * 1.5], [r * 0.8, -r * 0.5]]));
    inked(ctx, t.fur, 1.8, () => ctx.arc(0, 0, r, 0, Math.PI * 2));
    inked(ctx, t.fur, 1.8, () => poly(ctx, [[r * 0.3, -r * 0.45], [r * 1.9, r * 0.1], [r * 1.85, r * 0.62], [r * 0.4, r * 0.85]]));
    inked(ctx, INK, 1, () => ctx.ellipse(r * 1.88, r * 0.2, r * 0.24, r * 0.22, 0, 0, Math.PI * 2));
    // Teeth, because wolves are for biting.
    inked(ctx, BONE, 1, () => poly(ctx, [[r * 1.2, r * 0.55], [r * 1.32, r * 0.85], [r * 1.44, r * 0.52]]));
    line(ctx, INK, 1.2, [[r * 0.5, r * 0.5], [r * 1.8, r * 0.42]]);
    ctx.fillStyle = t.accent;
    ctx.fillRect(r * 0.55, -r * 0.18, 3, 2.4);
  },

  falcon: (ctx, r, t) => {
    inked(ctx, t.fur, 1.8, () => ctx.arc(0, 0, r, 0, Math.PI * 2));
    inked(ctx, BONE, 1.4, () => ctx.ellipse(r * 0.5, -r * 0.1, r * 0.34, r * 0.3, 0, 0, Math.PI * 2));
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(r * 0.55, -r * 0.1, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
    // The hooked beak.
    inked(ctx, BONE_SHADE, 1.6, () => {
      ctx.moveTo(r * 0.8, -r * 0.3);
      ctx.quadraticCurveTo(r * 1.9, -r * 0.25, r * 1.55, r * 0.75);
      ctx.quadraticCurveTo(r * 1.4, r * 0.35, r * 0.8, r * 0.4);
      ctx.closePath();
    });
    // The Horus teardrop under the eye.
    line(ctx, INK, 2.4, [[r * 0.5, r * 0.15], [r * 0.45, r * 0.8], [r * 0.15, r * 1.05]]);
  },

  ibis: (ctx, r, t) => {
    inked(ctx, t.fur, 1.8, () => ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2));
    inked(ctx, INK, 1.2, () => {
      ctx.moveTo(r * 0.7, -r * 0.35);
      ctx.bezierCurveTo(r * 2.2, -r * 0.4, r * 3.0, r * 0.2, r * 2.7, r * 1.4);
      ctx.bezierCurveTo(r * 2.5, r * 0.5, r * 1.4, r * 0.35, r * 0.7, r * 0.45);
      ctx.closePath();
    });
    inked(ctx, BONE, 1.2, () => ctx.ellipse(r * 0.45, -r * 0.1, r * 0.3, r * 0.26, 0, 0, Math.PI * 2));
    ctx.fillStyle = INK;
    ctx.fillRect(r * 0.5, -r * 0.14, 2.2, 2.2);
  },

  lion: (ctx, r, t) => {
    // The mane: a ring of tufts behind the face.
    ctx.fillStyle = t.hair;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2 + 0.3;
      const x = Math.cos(a) * r * 1.15;
      const y = Math.sin(a) * r * 1.15;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    inked(ctx, t.fur, 1.8, () => ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2));
    inked(ctx, t.fur, 1.8, () => poly(ctx, [[r * 0.4, -r * 0.1], [r * 1.5, r * 0.15], [r * 1.45, r * 0.7], [r * 0.5, r * 0.85]]));
    inked(ctx, INK, 1, () => poly(ctx, [[r * 1.4, r * 0.08], [r * 1.6, r * 0.2], [r * 1.4, r * 0.38]]));
    line(ctx, INK, 2, [[r * 0.3, -r * 0.35], [r * 0.85, -r * 0.2]]);
    ctx.fillStyle = INK;
    ctx.fillRect(r * 0.55, -r * 0.08, 2.4, 2.4);
    line(ctx, INK, 1.2, [[r * 0.7, r * 0.6], [r * 1.35, r * 0.55]]);
  },

  setbeast: (ctx, r, t) => {
    // Tall square-tipped ears, and a long snout curving down.
    inked(ctx, t.fur, 1.6, () => poly(ctx, [[-r * 0.7, -r * 0.5], [-r * 0.75, -r * 2.2], [-r * 0.15, -r * 2.2], [r * 0.1, -r * 0.7]]));
    inked(ctx, t.fur, 1.6, () => poly(ctx, [[-r * 0.05, -r * 0.7], [-r * 0.05, -r * 2.3], [r * 0.55, -r * 2.2], [r * 0.7, -r * 0.5]]));
    inked(ctx, t.fur, 1.8, () => ctx.arc(0, 0, r, 0, Math.PI * 2));
    inked(ctx, t.fur, 1.8, () => {
      ctx.moveTo(r * 0.3, -r * 0.5);
      ctx.quadraticCurveTo(r * 1.8, -r * 0.55, r * 2.5, r * 0.9);
      ctx.lineTo(r * 2.1, r * 1.0);
      ctx.quadraticCurveTo(r * 1.4, r * 0.3, r * 0.4, r * 0.7);
      ctx.closePath();
    });
    inked(ctx, BONE, 1, () => ctx.ellipse(r * 0.6, -r * 0.1, r * 0.28, r * 0.17, 0.1, 0, Math.PI * 2));
    ctx.fillStyle = t.accent;
    ctx.fillRect(r * 0.66, -r * 0.14, 2.2, 2.2);
  },
};

// ===========================================================================
// HEADGEAR
// ===========================================================================

export type GearKind =
  | 'corinthian'
  | 'crestedHelm'
  | 'helmWinged'
  | 'helmHorned'
  | 'helmViking'
  | 'crown'
  | 'laurel'
  | 'hood'
  | 'hat'
  | 'nemes'
  | 'atef'
  | 'sundisc'
  | 'cowhorns'
  | 'crescent'
  | 'feathers'
  | 'cap'
  | 'topknot';

const dome = (ctx: Ctx, r: number, fill: string): void => {
  inked(ctx, fill, 1.6, () => {
    ctx.moveTo(-r * 1.12, r * 0.25);
    ctx.arc(0, 0, r * 1.16, Math.PI * 0.94, Math.PI * 2.08);
    ctx.lineTo(r * 0.85, -r * 0.3);
    ctx.lineTo(-r * 0.6, -r * 0.1);
    ctx.closePath();
  });
};

export const GEAR: Readonly<Record<GearKind, (ctx: Ctx, r: number, t: Tones) => void>> = {
  corinthian: (ctx, r, t) => {
    dome(ctx, r, t.metal);
    inked(ctx, t.metal, 1.6, () => poly(ctx, [[r * 0.3, r * 0.1], [r * 0.85, r * 0.15], [r * 0.6, r * 0.95], [r * 0.15, r * 0.8]]));
    inked(ctx, t.accent, 1.6, () => {
      ctx.moveTo(-r * 1.1, -r * 0.7);
      ctx.quadraticCurveTo(-r * 0.4, -r * 2.1, r * 0.9, -r * 1.3);
      ctx.quadraticCurveTo(r * 0.2, -r * 1.25, -r * 0.7, -r * 0.5);
      ctx.closePath();
    });
  },

  crestedHelm: (ctx, r, t) => {
    dome(ctx, r, t.metal);
    inked(ctx, t.accent, 1.6, () => {
      ctx.moveTo(-r * 0.9, -r * 0.6);
      ctx.lineTo(-r * 1.1, -r * 2.5);
      ctx.quadraticCurveTo(r * 0.3, -r * 2.8, r * 0.9, -r * 1.0);
      ctx.lineTo(r * 0.5, -r * 0.9);
      ctx.quadraticCurveTo(r * 0.1, -r * 1.7, -r * 0.4, -r * 0.7);
      ctx.closePath();
    });
  },

  helmWinged: (ctx, r, t) => {
    dome(ctx, r, INK);
    for (const dir of [-1, 1] as const) {
      inked(ctx, BONE, 1.6, () => {
        const x0 = dir < 0 ? -r * 0.3 : r * 0.3;
        ctx.moveTo(x0, -r * 0.95);
        ctx.quadraticCurveTo(x0 + dir * r * 1.1, -r * 2.6, x0 + dir * r * 2.0, -r * 1.3);
        ctx.quadraticCurveTo(x0 + dir * r * 1.0, -r * 1.5, x0 + dir * r * 0.2, -r * 0.7);
        ctx.closePath();
      });
    }
    void t;
  },

  helmHorned: (ctx, r, t) => {
    dome(ctx, r, t.metal);
    for (const dir of [-1, 1] as const) {
      inked(ctx, BONE, 1.6, () => {
        const x0 = dir * r * 0.9;
        ctx.moveTo(x0, -r * 0.4);
        ctx.quadraticCurveTo(x0 + dir * r * 1.2, -r * 0.7, x0 + dir * r * 0.9, -r * 2.2);
        ctx.quadraticCurveTo(x0 + dir * r * 0.5, -r * 1.2, x0 - dir * r * 0.2, -r * 0.9);
        ctx.closePath();
      });
    }
  },

  helmViking: (ctx, r, t) => {
    dome(ctx, r, t.metal);
    // Nasal bar and an ink brow band.
    inked(ctx, t.metal, 1.4, () => poly(ctx, [[r * 0.75, -r * 0.2], [r * 1.0, -r * 0.2], [r * 1.0, r * 0.7], [r * 0.75, r * 0.7]]));
    line(ctx, INK, 2, [[-r * 1.1, r * 0.05], [r * 0.8, -r * 0.2]]);
  },

  crown: (ctx, r, t) => {
    inked(ctx, t.metal, 1.6, () => {
      ctx.moveTo(-r * 0.95, -r * 0.5);
      for (let i = 0; i < 5; i++) {
        const x = -r * 0.95 + (i * r * 1.9) / 4;
        ctx.lineTo(x, -r * 1.7);
        ctx.lineTo(x + (r * 0.95) / 4, -r * 0.95);
      }
      ctx.lineTo(r * 0.95, -r * 0.5);
      ctx.closePath();
    });
  },

  laurel: (ctx, r, t) => {
    ctx.fillStyle = t.metal;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * 0.95 + (i / 6) * Math.PI * 1.1;
      const x = Math.cos(a) * r * 1.05;
      const y = Math.sin(a) * r * 1.05;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a + Math.PI / 2);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.22, r * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  },

  hood: (ctx, r, t) => {
    inked(ctx, t.cloth, 1.8, () => {
      ctx.moveTo(-r * 1.3, r * 0.9);
      ctx.quadraticCurveTo(-r * 1.6, -r * 1.7, r * 0.3, -r * 1.65);
      ctx.quadraticCurveTo(r * 1.6, -r * 1.3, r * 1.45, r * 0.25);
      ctx.lineTo(r * 0.55, r * 0.15);
      ctx.lineTo(r * 0.1, r * 0.95);
      ctx.closePath();
    });
  },

  hat: (ctx, r, t) => {
    // A wide brim pulled low, and a shallow crown.
    inked(ctx, t.cloth, 1.8, () => ctx.ellipse(0, -r * 0.55, r * 1.9, r * 0.35, -0.08, 0, Math.PI * 2));
    inked(ctx, t.cloth, 1.8, () => {
      ctx.moveTo(-r * 0.95, -r * 0.55);
      ctx.quadraticCurveTo(-r * 0.9, -r * 1.7, 0, -r * 1.7);
      ctx.quadraticCurveTo(r * 0.9, -r * 1.7, r * 0.95, -r * 0.55);
      ctx.closePath();
    });
  },

  nemes: (ctx, r, t) => {
    // The striped royal headcloth: a cap, lappets falling behind and a striped frame.
    inked(ctx, t.cloth, 1.8, () => {
      ctx.moveTo(-r * 0.9, -r * 0.2);
      ctx.quadraticCurveTo(-r * 1.0, -r * 1.5, r * 0.2, -r * 1.35);
      ctx.quadraticCurveTo(r * 1.0, -r * 1.2, r * 1.05, -r * 0.2);
      ctx.lineTo(r * 0.7, -r * 0.5);
      ctx.lineTo(-r * 0.5, -r * 0.4);
      ctx.closePath();
    });
    inked(ctx, t.cloth, 1.8, () => poly(ctx, [[-r * 0.8, -r * 0.1], [-r * 1.6, r * 1.5], [-r * 0.5, r * 1.5], [-r * 0.2, r * 0.3]]));
    for (let i = 0; i < 4; i++) line(ctx, INK, 1.2, [[-r * (0.7 + i * 0.28), r * 0.1 + i * 0.2], [-r * (1.4 + i * 0.05), r * (0.2 + i * 0.25)]]);
  },

  atef: (ctx, r, t) => {
    // The white crown of Upper Egypt between two ostrich feathers.
    inked(ctx, t.cloth, 1.8, () => {
      ctx.moveTo(-r * 0.7, -r * 0.6);
      ctx.quadraticCurveTo(-r * 0.8, -r * 1.6, -r * 0.25, -r * 2.6);
      ctx.quadraticCurveTo(r * 0.3, -r * 1.7, r * 0.7, -r * 0.6);
      ctx.closePath();
    });
    for (const dir of [-1, 1] as const) {
      inked(ctx, BONE, 1.4, () => {
        ctx.moveTo(dir * r * 0.5, -r * 1.4);
        ctx.quadraticCurveTo(dir * r * 1.5, -r * 2.2, dir * r * 0.9, -r * 3.0);
        ctx.quadraticCurveTo(dir * r * 0.5, -r * 2.2, dir * r * 0.1, -r * 1.4);
        ctx.closePath();
      });
    }
  },

  sundisc: (ctx, r, t) => {
    inked(ctx, t.accent, 1.8, () => ctx.arc(0, -r * 1.8, r * 0.9, 0, Math.PI * 2));
    inked(ctx, t.cloth, 1.4, () => ctx.arc(0, -r * 1.8, r * 0.45, 0, Math.PI * 2));
    // The cobra rearing at the brow.
    inked(ctx, t.accent, 1.4, () => {
      ctx.moveTo(r * 0.7, -r * 0.7);
      ctx.quadraticCurveTo(r * 1.4, -r * 0.9, r * 1.2, -r * 1.5);
      ctx.quadraticCurveTo(r * 0.9, -r * 1.2, r * 0.5, -r * 0.8);
      ctx.closePath();
    });
  },

  cowhorns: (ctx, r, t) => {
    for (const dir of [-1, 1] as const) {
      inked(ctx, BONE, 1.6, () => {
        ctx.moveTo(dir * r * 0.5, -r * 0.8);
        ctx.quadraticCurveTo(dir * r * 2.0, -r * 0.9, dir * r * 1.6, -r * 2.0);
        ctx.quadraticCurveTo(dir * r * 1.3, -r * 1.3, dir * r * 0.3, -r * 1.1);
        ctx.closePath();
      });
    }
    inked(ctx, t.accent, 1.6, () => ctx.arc(0, -r * 1.6, r * 0.55, 0, Math.PI * 2));
  },

  crescent: (ctx, r, t) => {
    inked(ctx, t.metal, 1.6, () => {
      ctx.moveTo(-r * 0.8, -r * 1.3);
      ctx.bezierCurveTo(-r * 0.2, -r * 2.6, r * 1.0, -r * 2.6, r * 1.2, -r * 1.3);
      ctx.bezierCurveTo(r * 0.6, -r * 2.0, -r * 0.2, -r * 2.0, -r * 0.8, -r * 1.3);
      ctx.closePath();
    });
    inked(ctx, t.metal, 1.4, () => ctx.arc(0, -r * 1.35, r * 0.4, 0, Math.PI * 2));
  },

  feathers: (ctx, r, t) => {
    for (let i = -2; i <= 2; i++) {
      inked(ctx, i % 2 === 0 ? t.cloth2 : t.cloth, 1.4, () => {
        ctx.moveTo(i * r * 0.3, -r * 0.8);
        ctx.quadraticCurveTo(i * r * 0.8 - r * 0.2, -r * 1.8, i * r * 0.55, -r * 2.5);
        ctx.quadraticCurveTo(i * r * 0.3 + r * 0.3, -r * 1.7, i * r * 0.3 + r * 0.25, -r * 0.8);
        ctx.closePath();
      });
    }
  },

  cap: (ctx, r, t) => {
    inked(ctx, t.cloth, 1.8, () => {
      ctx.moveTo(-r * 1.05, -r * 0.1);
      ctx.quadraticCurveTo(-r * 1.0, -r * 1.35, r * 0.1, -r * 1.3);
      ctx.quadraticCurveTo(r * 1.0, -r * 1.15, r * 1.05, -r * 0.2);
      ctx.lineTo(r * 0.5, -r * 0.45);
      ctx.closePath();
    });
  },

  topknot: (ctx, r, t) => {
    inked(ctx, t.hair, 1.6, () => ctx.ellipse(-r * 0.2, -r * 1.4, r * 0.5, r * 0.55, 0, 0, Math.PI * 2));
    inked(ctx, t.hair, 1.6, () => {
      ctx.moveTo(-r * 1.0, -r * 0.2);
      ctx.quadraticCurveTo(-r * 0.6, -r * 1.2, r * 0.9, -r * 0.5);
      ctx.quadraticCurveTo(r * 0.3, -r * 0.8, -r * 0.4, -r * 0.3);
      ctx.closePath();
    });
  },
};

// ===========================================================================
// BEARDS AND HAIR
// ===========================================================================

export type BeardKind = 'swept' | 'braided' | 'pointed' | 'short' | 'long';

export const BEARDS: Readonly<Record<BeardKind, (ctx: Ctx, r: number, color: string) => void>> = {
  swept: (ctx, r, c) => {
    inked(ctx, c, 1.8, () => {
      ctx.moveTo(r * 0.75, r * 0.25);
      ctx.quadraticCurveTo(r * 1.6, r * 0.9, r * 0.85, r * 2.3);
      ctx.quadraticCurveTo(r * 0.1, r * 2.6, -r * 0.45, r * 1.5);
      ctx.quadraticCurveTo(-r * 0.75, r * 0.6, -r * 0.4, r * 0.1);
      ctx.quadraticCurveTo(r * 0.25, r * 0.45, r * 0.75, r * 0.25);
    });
    line(ctx, GREY, 1.2, [[r * 0.35, r * 0.7], [r * 0.45, r * 1.4], [r * 0.3, r * 2]]);
    line(ctx, GREY, 1.2, [[-r * 0.05, r * 0.8], [-r * 0.05, r * 1.4], [-r * 0.1, r * 1.9]]);
  },
  braided: (ctx, r, c) => {
    inked(ctx, c, 1.8, () => {
      ctx.moveTo(r * 0.85, r * 0.3);
      ctx.quadraticCurveTo(r * 1.4, r * 0.9, r * 0.7, r * 1.9);
      ctx.quadraticCurveTo(r * 0.1, r * 2.1, -r * 0.35, r * 1.1);
      ctx.quadraticCurveTo(r * 0.2, r * 0.5, r * 0.85, r * 0.3);
    });
    for (let i = 0; i < 3; i++) line(ctx, INK, 1.2, [[r * 0.2, r * (1.0 + i * 0.3)], [r * 0.7, r * (1.15 + i * 0.3)]]);
  },
  pointed: (ctx, r, c) => {
    inked(ctx, c, 1.8, () => poly(ctx, [[r * 0.8, r * 0.25], [r * 0.9, r * 1.2], [r * 0.4, r * 2.1], [-r * 0.2, r * 1.0], [-r * 0.2, r * 0.2]]));
  },
  short: (ctx, r, c) => {
    inked(ctx, c, 1.8, () => {
      ctx.moveTo(r * 0.9, r * 0.3);
      ctx.quadraticCurveTo(r * 1.0, r * 1.1, r * 0.4, r * 1.1);
      ctx.quadraticCurveTo(-r * 0.2, r * 0.9, -r * 0.3, r * 0.2);
      ctx.quadraticCurveTo(r * 0.3, r * 0.5, r * 0.9, r * 0.3);
    });
  },
  long: (ctx, r, c) => {
    inked(ctx, c, 1.8, () => {
      ctx.moveTo(r * 0.85, r * 0.3);
      ctx.quadraticCurveTo(r * 1.3, r * 1.4, r * 0.5, r * 3.0);
      ctx.quadraticCurveTo(-r * 0.3, r * 3.1, -r * 0.5, r * 1.4);
      ctx.quadraticCurveTo(-r * 0.6, r * 0.6, -r * 0.3, r * 0.1);
      ctx.quadraticCurveTo(r * 0.3, r * 0.5, r * 0.85, r * 0.3);
    });
    line(ctx, GREY, 1.2, [[r * 0.3, r * 0.8], [r * 0.3, r * 2], [r * 0.1, r * 2.8]]);
  },
};

export type HairKind = 'long' | 'short' | 'braid';

/** Hair is drawn before the face for volume behind the head, and after it for the fringe. */
export const HAIR: Readonly<Record<HairKind, { back: (ctx: Ctx, r: number, c: string) => void; front: (ctx: Ctx, r: number, c: string) => void }>> = {
  long: {
    back: (ctx, r, c) =>
      inked(ctx, c, 1.8, () => {
        ctx.moveTo(-r * 0.2, -r * 1.05);
        ctx.quadraticCurveTo(-r * 1.9, -r * 0.2, -r * 1.5, r * 1.9);
        ctx.lineTo(-r * 0.3, r * 1.2);
        ctx.closePath();
      }),
    front: (ctx, r, c) =>
      inked(ctx, c, 1.6, () => {
        ctx.moveTo(-r * 1.05, -r * 0.1);
        ctx.quadraticCurveTo(-r * 0.5, -r * 1.35, r * 0.95, -r * 0.45);
        ctx.quadraticCurveTo(r * 0.3, -r * 0.7, -r * 0.4, -r * 0.2);
        ctx.closePath();
      }),
  },
  short: {
    back: () => undefined,
    front: (ctx, r, c) =>
      inked(ctx, c, 1.6, () => {
        ctx.moveTo(-r * 1.05, r * 0.1);
        ctx.quadraticCurveTo(-r * 0.9, -r * 1.3, r * 0.2, -r * 1.2);
        ctx.quadraticCurveTo(r * 1.0, -r * 1.0, r * 0.95, -r * 0.4);
        ctx.quadraticCurveTo(r * 0.3, -r * 0.7, -r * 0.5, -r * 0.2);
        ctx.closePath();
      }),
  },
  braid: {
    back: (ctx, r, c) => {
      line(ctx, INK, 6.4, [[-r * 0.8, -r * 0.2], [-r * 1.5, r * 0.8], [-r * 1.2, r * 2.0]]);
      line(ctx, c, 4, [[-r * 0.8, -r * 0.2], [-r * 1.5, r * 0.8], [-r * 1.2, r * 2.0]]);
    },
    front: (ctx, r, c) =>
      inked(ctx, c, 1.6, () => {
        ctx.moveTo(-r * 1.05, -r * 0.05);
        ctx.quadraticCurveTo(-r * 0.6, -r * 1.3, r * 0.95, -r * 0.45);
        ctx.quadraticCurveTo(r * 0.3, -r * 0.65, -r * 0.4, -r * 0.2);
        ctx.closePath();
      }),
  },
};

// ===========================================================================
// WEAPONS (hand frame: origin at the fist, the weapon rises along -y)
// ===========================================================================

export type WeaponKind =
  | 'spear'
  | 'sword'
  | 'longsword'
  | 'axe'
  | 'hammer'
  | 'club'
  | 'bow'
  | 'trident'
  | 'bident'
  | 'staff'
  | 'crook'
  | 'lyre'
  | 'sickle'
  | 'bolt'
  | 'khopesh'
  | 'was'
  | 'ankh'
  | 'torch'
  | 'serpentStaff'
  | 'thyrsus'
  | 'forgeHammer'
  | 'scroll'
  | 'harpe'
  | 'dagger';

const shaft = (ctx: Ctx, y0: number, y1: number, w: number, color: string): void =>
  capsule(ctx, { x: 0, y: y0 }, { x: 0, y: y1 }, w, color);

const leaf = (ctx: Ctx, y: number, len: number, w: number, fill: string): void => {
  inked(ctx, fill, 1.8, () => {
    ctx.moveTo(0, y - len);
    ctx.quadraticCurveTo(w, y - len * 0.45, 0, y);
    ctx.quadraticCurveTo(-w, y - len * 0.45, 0, y - len);
  });
};

const blade = (ctx: Ctx, y: number, len: number, w: number, fill: string): void => {
  inked(ctx, fill, 1.8, () => poly(ctx, [[-w, y], [-w, y - len * 0.85], [0, y - len], [w, y - len * 0.85], [w, y]]));
  line(ctx, INK, 1, [[0, y - 2], [0, y - len * 0.8]]);
};

export const WEAPONS: Readonly<Record<WeaponKind, (ctx: Ctx, t: Tones) => void>> = {
  spear: (ctx, t) => {
    shaft(ctx, 26, -74, 2.4, BONE_SHADE);
    leaf(ctx, -72, 18, 5, BONE);
    inked(ctx, INK, 1, () => ctx.rect(-1.6, 24, 3.2, 4));
    void t;
  },
  sword: (ctx, t) => {
    inked(ctx, INK, 1.4, () => ctx.rect(-1.8, 0, 3.6, 10));
    inked(ctx, t.metal, 1.6, () => ctx.rect(-8, -3, 16, 4));
    blade(ctx, -3, 40, 3.4, BONE);
  },
  longsword: (ctx, t) => {
    inked(ctx, INK, 1.4, () => ctx.rect(-2, 2, 4, 12));
    inked(ctx, t.metal, 1.6, () => ctx.rect(-9, -2, 18, 4));
    blade(ctx, -2, 62, 3.8, BONE);
  },
  axe: (ctx, t) => {
    shaft(ctx, 18, -48, 3.2, BONE_SHADE);
    inked(ctx, t.metal, 2, () => {
      ctx.moveTo(1, -48);
      ctx.quadraticCurveTo(22, -56, 22, -30);
      ctx.quadraticCurveTo(10, -34, 1, -30);
      ctx.closePath();
    });
    line(ctx, BONE, 1.4, [[6, -46], [17, -42]]);
  },
  hammer: (ctx, t) => {
    shaft(ctx, 14, -22, 3.6, BONE_SHADE);
    inked(ctx, t.metal, 2.2, () => ctx.rect(-12, -42, 24, 19));
    line(ctx, BONE, 1.6, [[-9, -39], [9, -39]]);
    line(ctx, INK, 1.4, [[-4, -36], [0, -28], [4, -36]]);
  },
  club: (ctx) => {
    inked(ctx, '#5a4d44', 2, () => {
      ctx.moveTo(-2.4, 20);
      ctx.lineTo(2.4, 20);
      ctx.lineTo(4, -20);
      ctx.quadraticCurveTo(14, -34, 6, -58);
      ctx.quadraticCurveTo(-4, -64, -10, -50);
      ctx.quadraticCurveTo(-8, -30, -4, -20);
      ctx.closePath();
    });
    for (const [x, y] of [[0, -40], [4, -50], [-4, -54]] as const) {
      inked(ctx, BONE_SHADE, 1, () => ctx.arc(x, y, 1.8, 0, Math.PI * 2));
    }
  },
  bow: (ctx, t) => {
    // Held upright with the string toward the archer.
    inked(ctx, '#5a4d44', 2.4, () => {
      ctx.moveTo(0, -46);
      ctx.quadraticCurveTo(24, 0, 0, 46);
      ctx.quadraticCurveTo(10, 0, 0, -46);
    });
    line(ctx, BONE, 1.2, [[0, -46], [-3, 0], [0, 46]]);
    void t;
  },
  trident: (ctx, t) => {
    shaft(ctx, 28, -66, 2.8, BONE_SHADE);
    for (const dx of [-8, 0, 8]) {
      inked(ctx, t.metal, 1.6, () => poly(ctx, [[dx - 1.5, -58], [dx, -82], [dx + 1.5, -58]]));
    }
    line(ctx, INK, 2.4, [[-8, -56], [8, -56]]);
    inked(ctx, t.metal, 1.2, () => poly(ctx, [[-8, -60], [8, -60], [8, -56], [-8, -56]]));
  },
  bident: (ctx, t) => {
    shaft(ctx, 28, -62, 2.8, '#3b3a44');
    for (const dx of [-5, 5]) {
      inked(ctx, t.metal, 1.6, () => poly(ctx, [[dx - 1.6, -54], [dx + (dx < 0 ? -2 : 2), -82], [dx + 1.6, -54]]));
    }
    inked(ctx, t.metal, 1.2, () => ctx.rect(-6, -58, 12, 5));
  },
  staff: (ctx, t) => {
    shaft(ctx, 30, -70, 3, BONE_SHADE);
    inked(ctx, t.accent, 1.8, () => ctx.arc(0, -76, 7, 0, Math.PI * 2));
    inked(ctx, t.metal, 1.4, () => poly(ctx, [[-5, -68], [5, -68], [3, -62], [-3, -62]]));
  },
  crook: (ctx, t) => {
    shaft(ctx, 28, -58, 3, BONE_SHADE);
    inked(ctx, BONE_SHADE, 1.8, () => {
      ctx.moveTo(-1.5, -56);
      ctx.bezierCurveTo(-4, -84, 22, -84, 20, -64);
      ctx.lineTo(15, -66);
      ctx.bezierCurveTo(16, -76, 4, -76, 3, -58);
      ctx.closePath();
    });
    for (let i = 0; i < 3; i++) line(ctx, t.accent, 1.6, [[-3, -50 + i * 8], [3, -48 + i * 8]]);
  },
  lyre: (ctx, t) => {
    // A U-shaped lyre held out in front, strings strung between the arms.
    inked(ctx, t.cloth, 2, () => {
      ctx.moveTo(-9, -18);
      ctx.bezierCurveTo(-10, -4, 10, -4, 9, -18);
      ctx.lineTo(7, -44);
      ctx.lineTo(3, -44);
      ctx.lineTo(4, -20);
      ctx.bezierCurveTo(2, -14, -2, -14, -4, -20);
      ctx.lineTo(-3, -44);
      ctx.lineTo(-7, -44);
      ctx.closePath();
    });
    inked(ctx, INK, 1, () => ctx.rect(-8, -45, 16, 3));
    for (let i = -1; i <= 1; i++) line(ctx, BONE, 1, [[i * 2.2, -42], [i * 2.2, -16]]);
  },
  sickle: (ctx) => {
    shaft(ctx, 26, -74, 3.6, BONE_SHADE);
    inked(ctx, BONE, 2.4, () => {
      ctx.moveTo(0, -78);
      ctx.bezierCurveTo(28, -92, 52, -72, 46, -36);
      ctx.bezierCurveTo(44, -58, 26, -72, 4, -66);
      ctx.closePath();
    });
    line(ctx, INK, 1.4, [[6, -72]]);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(6, -72);
    ctx.bezierCurveTo(26, -80, 41, -66, 40, -48);
    ctx.stroke();
  },
  bolt: (ctx) => {
    inked(ctx, INK, 1, () => ctx.rect(-2.2, 2, 4.4, 9));
    inked(ctx, BONE, 2, () =>
      poly(ctx, [[1, 4], [-9, -14], [-2, -14], [-11, -34], [0, -34], [-7, -62], [11, -28], [3, -28], [10, -10], [3, -10]]),
    );
  },
  khopesh: (ctx, t) => {
    inked(ctx, INK, 1.4, () => ctx.rect(-1.8, 0, 3.6, 10));
    inked(ctx, t.metal, 1.6, () => ctx.rect(-6, -3, 12, 4));
    inked(ctx, BONE, 1.8, () => {
      ctx.moveTo(-2.5, -3);
      ctx.lineTo(-2.5, -34);
      ctx.bezierCurveTo(-2.5, -52, 24, -54, 24, -34);
      ctx.lineTo(18, -34);
      ctx.bezierCurveTo(18, -42, 3, -42, 3, -34);
      ctx.lineTo(2.5, -3);
      ctx.closePath();
    });
  },
  was: (ctx) => {
    shaft(ctx, 28, -74, 2.6, BONE_SHADE);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-5, 38);
    ctx.lineTo(0, 27);
    ctx.lineTo(5, 38);
    ctx.stroke();
    inked(ctx, '#2b2a32', 1.6, () => poly(ctx, [[-4, -72], [-6, -86], [-1, -78], [2, -88], [5, -74], [11, -70], [10, -66], [-3, -66]]));
  },
  ankh: (ctx, t) => {
    shaft(ctx, 20, -30, 3.2, t.metal);
    inked(ctx, t.metal, 2.2, () => ctx.ellipse(0, -42, 7, 10, 0, 0, Math.PI * 2));
    inked(ctx, INK, 1.4, () => ctx.ellipse(0, -42, 3, 6, 0, 0, Math.PI * 2));
    inked(ctx, t.metal, 2, () => ctx.rect(-10, -30, 20, 4.4));
  },
  torch: (ctx, t) => {
    shaft(ctx, 20, -34, 3.4, '#5a4d44');
    inked(ctx, t.accent, 1.8, () => {
      ctx.moveTo(-6, -34);
      ctx.quadraticCurveTo(-9, -50, 0, -62);
      ctx.quadraticCurveTo(9, -50, 6, -34);
      ctx.closePath();
    });
    inked(ctx, BONE, 1, () => {
      ctx.moveTo(-2.5, -36);
      ctx.quadraticCurveTo(-3, -46, 0, -52);
      ctx.quadraticCurveTo(3, -46, 2.5, -36);
      ctx.closePath();
    });
  },
  serpentStaff: (ctx, t) => {
    shaft(ctx, 28, -70, 3.4, '#5a4d44');
    // A single serpent coiled up the staff, head raised at the top.
    ctx.strokeStyle = INK;
    ctx.lineWidth = 5.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, 14);
    for (let i = 0; i < 5; i++) ctx.quadraticCurveTo(i % 2 === 0 ? 8 : -8, 6 - i * 14, 0, -2 - i * 14);
    ctx.stroke();
    ctx.strokeStyle = t.accent === BLOOD ? BONE : t.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-6, 14);
    for (let i = 0; i < 5; i++) ctx.quadraticCurveTo(i % 2 === 0 ? 8 : -8, 6 - i * 14, 0, -2 - i * 14);
    ctx.stroke();
    inked(ctx, BONE, 1.4, () => ctx.ellipse(3, -74, 5, 3.2, -0.5, 0, Math.PI * 2));
  },
  thyrsus: (ctx, t) => {
    shaft(ctx, 28, -56, 2.8, BONE_SHADE);
    inked(ctx, t.accent, 1.8, () => {
      ctx.moveTo(0, -80);
      ctx.quadraticCurveTo(9, -66, 0, -54);
      ctx.quadraticCurveTo(-9, -66, 0, -80);
    });
    for (let i = 0; i < 3; i++) line(ctx, INK, 1.2, [[-6 + i * 6, -62], [-3 + i * 6, -72]]);
    for (const dx of [-6, 6]) inked(ctx, t.cloth2, 1.2, () => ctx.ellipse(dx, -52, 4, 6, dx > 0 ? 0.6 : -0.6, 0, Math.PI * 2));
  },
  forgeHammer: (ctx, t) => {
    shaft(ctx, 16, -26, 4, '#5a4d44');
    inked(ctx, t.metal, 2.4, () => ctx.rect(-14, -46, 28, 20));
    inked(ctx, BONE, 1.2, () => poly(ctx, [[-12, -44], [4, -44], [4, -40], [-12, -40]]));
  },
  scroll: (ctx, t) => {
    inked(ctx, BONE, 1.8, () => ctx.rect(-5, -30, 10, 36));
    for (const y of [-30, 6]) inked(ctx, t.cloth, 1.6, () => ctx.ellipse(0, y, 7, 3, 0, 0, Math.PI * 2));
    for (let i = 0; i < 5; i++) line(ctx, INK, 1, [[-3, -24 + i * 6], [3, -24 + i * 6]]);
  },
  harpe: (ctx, t) => {
    inked(ctx, INK, 1.4, () => ctx.rect(-1.8, 0, 3.6, 10));
    inked(ctx, t.metal, 1.6, () => ctx.rect(-6, -3, 12, 4));
    inked(ctx, BONE, 1.8, () => {
      ctx.moveTo(-2.5, -3);
      ctx.lineTo(-2.5, -26);
      ctx.bezierCurveTo(-2.5, -44, 22, -40, 24, -22);
      ctx.bezierCurveTo(14, -34, 3, -30, 2.5, -24);
      ctx.lineTo(2.5, -3);
      ctx.closePath();
    });
  },
  dagger: (ctx, t) => {
    inked(ctx, INK, 1.4, () => ctx.rect(-1.6, 0, 3.2, 8));
    inked(ctx, t.metal, 1.4, () => ctx.rect(-5, -2, 10, 3.4));
    blade(ctx, -2, 22, 2.8, BONE);
  },
};

// ===========================================================================
// OFFHAND (drawn over the torso, at the back hand)
// ===========================================================================

export type OffhandKind = 'shieldRound' | 'shieldViking' | 'shieldKite' | 'aegisShield' | 'mirror' | 'quiver';

export const OFFHAND: Readonly<Record<OffhandKind, (ctx: Ctx, s: Skel, t: Tones) => void>> = {
  shieldRound: (ctx, s, t) => {
    const cx = s.armB.hand.x + 7;
    const cy = s.armB.hand.y - 6;
    inked(ctx, BONE, 2.4, () => ctx.arc(cx, cy, 16, 0, Math.PI * 2));
    inked(ctx, t.cloth2, 1.6, () => ctx.arc(cx, cy, 11.5, 0, Math.PI * 2));
    inked(ctx, BONE, 1.6, () => ctx.arc(cx, cy, 6.5, 0, Math.PI * 2));
    inked(ctx, INK, 1.2, () => ctx.arc(cx, cy, 2.2, 0, Math.PI * 2));
  },
  shieldViking: (ctx, s, t) => {
    const cx = s.armB.hand.x + 6;
    const cy = s.armB.hand.y - 6;
    inked(ctx, t.cloth, 2.4, () => ctx.arc(cx, cy, 15, 0, Math.PI * 2));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      line(ctx, INK, 1.2, [[cx, cy], [cx + Math.cos(a) * 14, cy + Math.sin(a) * 14]]);
    }
    inked(ctx, t.metal, 1.6, () => ctx.arc(cx, cy, 4.4, 0, Math.PI * 2));
    ctx.strokeStyle = t.metal;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.stroke();
  },
  shieldKite: (ctx, s, t) => {
    const x = s.armB.hand.x + 5;
    const y = s.armB.hand.y;
    inked(ctx, t.cloth, 2.4, () => {
      ctx.moveTo(x - 10, y - 20);
      ctx.lineTo(x + 10, y - 20);
      ctx.lineTo(x + 8, y + 2);
      ctx.lineTo(x, y + 18);
      ctx.lineTo(x - 8, y + 2);
      ctx.closePath();
    });
    line(ctx, t.accent, 3, [[x, y - 18], [x, y + 14]]);
  },
  aegisShield: (ctx, s, t) => {
    const cx = s.armB.hand.x + 7;
    const cy = s.armB.hand.y - 6;
    inked(ctx, t.metal, 2.4, () => ctx.arc(cx, cy, 16, 0, Math.PI * 2));
    inked(ctx, BONE, 1.6, () => ctx.arc(cx, cy, 8.5, 0, Math.PI * 2));
    // The gorgoneion: a face ringed with snakes.
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      line(ctx, INK, 1.4, [[cx + Math.cos(a) * 8.5, cy + Math.sin(a) * 8.5], [cx + Math.cos(a + 0.3) * 13, cy + Math.sin(a + 0.3) * 13]]);
    }
    ctx.fillStyle = INK;
    ctx.fillRect(cx - 4, cy - 2.5, 2.4, 2.4);
    ctx.fillRect(cx + 1.6, cy - 2.5, 2.4, 2.4);
    line(ctx, INK, 1.4, [[cx - 3, cy + 3.4], [cx + 3, cy + 3.4]]);
    void t;
  },
  mirror: (ctx, s, t) => {
    const cx = s.armB.hand.x + 4;
    const cy = s.armB.hand.y - 12;
    capsule(ctx, s.armB.hand, { x: cx, y: cy + 4 }, 3, t.cloth);
    inked(ctx, t.metal, 2, () => ctx.ellipse(cx, cy - 4, 8, 10, 0, 0, Math.PI * 2));
    inked(ctx, BONE, 1, () => ctx.ellipse(cx, cy - 4, 5, 7, 0, 0, Math.PI * 2));
  },
  quiver: (ctx, s, t) => {
    // Slung over the shoulder, drawn behind the head height.
    const x = s.shoulder.x - 6;
    const y = s.shoulder.y - 4;
    inked(ctx, '#5a4d44', 1.8, () => poly(ctx, [[x - 3, y], [x + 3, y - 2], [x - 6, y + 22], [x - 12, y + 20]]));
    for (let i = 0; i < 3; i++) {
      inked(ctx, t.cloth2, 1, () => poly(ctx, [[x - 4 + i * 2.4, y - 1 - i * 0.6], [x - 6 + i * 2.4, y - 8 - i * 0.6], [x - 2 + i * 2.4, y - 2]]));
    }
  },
};

// ===========================================================================
// CLOTHING (world frame, from the skeleton's joints)
// ===========================================================================

export type BodyKind =
  | 'kilt'
  | 'shendyt'
  | 'chiton'
  | 'tunic'
  | 'robe'
  | 'cuirass'
  | 'collar'
  | 'aegis'
  | 'pauldron'
  | 'belt'
  | 'greaves'
  | 'pelt'
  | 'wraps'
  | 'rags'
  | 'apron'
  | 'bandolier';

export const BODY: Readonly<Record<BodyKind, (ctx: Ctx, s: Skel, t: Tones) => void>> = {
  kilt: (ctx, s, t) => {
    const { x, y } = s.hip;
    inked(ctx, BONE, 1.8, () => poly(ctx, [[x - 6.5, y - 4], [x + 7.5, y - 4], [x + 12, y + 17], [x - 10, y + 17]]));
    for (let i = -2; i <= 2; i++) line(ctx, BONE_SHADE, 1.2, [[x + i * 3, y - 2], [x + i * 3.8, y + 16]]);
    void t;
  },
  shendyt: (ctx, s, t) => {
    const { x, y } = s.hip;
    inked(ctx, t.cloth, 1.8, () => poly(ctx, [[x - 7, y - 4], [x + 8, y - 4], [x + 13, y + 12], [x - 6, y + 9]]));
    inked(ctx, t.cloth2, 1.4, () => poly(ctx, [[x + 3, y - 3], [x + 9, y - 3], [x + 11, y + 11], [x + 3, y + 8]]));
  },
  chiton: (ctx, s, t) => {
    const { x, y } = s.hip;
    inked(ctx, t.cloth, 1.8, () => poly(ctx, [[x - 8.5, y - 6], [x + 8.5, y - 6], [x + 12, y + 23], [x - 12, y + 23]]));
    for (let i = -2; i <= 2; i++) line(ctx, GREY, 1.2, [[x + i * 3.2, y + 2], [x + i * 4.2, y + 22]]);
    inked(ctx, t.cloth2, 1.4, () => ctx.rect(x - 8.6, y - 6, 17.2, 4.5));
  },
  tunic: (ctx, s, t) => {
    const { x, y } = s.hip;
    inked(ctx, t.cloth, 1.8, () => poly(ctx, [[x - 9, y - 6], [x + 9, y - 6], [x + 12, y + 13], [x - 12, y + 13]]));
    inked(ctx, t.cloth2, 1.4, () => ctx.rect(x - 9, y - 6, 18, 4));
  },
  robe: (ctx, s, t) => {
    const { x, y } = s.hip;
    inked(ctx, t.cloth, 1.8, () => poly(ctx, [[x - 9, y - 6], [x + 9, y - 6], [x + 14, y + 26], [x - 14, y + 26]]));
    line(ctx, t.cloth2, 3, [[x - 12, y + 24], [x + 12, y + 24]]);
    line(ctx, INK, 1.2, [[x, y - 2], [x, y + 24]]);
  },
  cuirass: (ctx, s, t) => {
    const { x, y } = s.shoulder;
    inked(ctx, t.metal, 1.8, () => poly(ctx, [[x - 8, y - 1], [x + 8, y - 1], [x + 7, y + 22], [x - 7, y + 22]]));
    for (let i = 1; i < 4; i++) line(ctx, INK, 1.2, [[x - 7, y + i * 5.5], [x + 7, y + i * 5.5]]);
  },
  collar: (ctx, s, t) => {
    const { x, y } = s.shoulder;
    inked(ctx, BONE, 1.8, () => {
      ctx.moveTo(x - 8, y - 1);
      ctx.quadraticCurveTo(x + 1, y + 14, x + 9, y - 1);
      ctx.quadraticCurveTo(x + 1, y + 5, x - 8, y - 1);
    });
    line(ctx, t.cloth2, 1.6, [[x - 6, y + 3], [x, y + 9], [x + 7, y + 3]]);
  },
  aegis: (ctx, s, t) => {
    const { x, y } = s.shoulder;
    inked(ctx, GREY, 1.8, () => {
      ctx.moveTo(x - 11, y - 2);
      ctx.quadraticCurveTo(x + 2, y - 8, x + 11, y - 1);
      ctx.lineTo(x + 8, y + 14);
      ctx.quadraticCurveTo(x, y + 20, x - 9, y + 13);
      ctx.closePath();
    });
    ctx.fillStyle = INK;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) ctx.fillRect(x - 7 + c * 5.2 + (r % 2) * 2, y + 1 + r * 4.6, 2, 2);
    ctx.strokeStyle = t.cloth2;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 9, y + 13);
    ctx.quadraticCurveTo(x, y + 19, x + 8, y + 14);
    ctx.stroke();
  },
  pauldron: (ctx, s, t) => {
    const { x, y } = s.shoulder;
    inked(ctx, t.metal, 1.6, () => poly(ctx, [[x - 11, y - 1], [x + 11, y - 1], [x + 9, y + 9], [x - 9, y + 9]]));
    ctx.fillStyle = INK;
    ctx.fillRect(x - 2, y + 1, 4, 4);
  },
  belt: (ctx, s, t) => {
    const { x, y } = s.hip;
    inked(ctx, t.cloth2, 1.4, () => ctx.rect(x - 7.6, y - 5, 15.2, 4.4));
    inked(ctx, t.metal, 1, () => ctx.rect(x - 2.5, y - 5.4, 5, 5.2));
  },
  greaves: (ctx, s, t) => {
    capsule(ctx, { x: s.legF.knee.x, y: s.legF.knee.y + 1 }, s.legF.foot, 4.2, t.metal);
    capsule(ctx, { x: s.legB.knee.x, y: s.legB.knee.y + 1 }, s.legB.foot, 4.2, t.metal);
  },
  pelt: (ctx, s, t) => {
    // A lion-skin cloak knotted at the chest, the mane hanging off the shoulders.
    const { x, y } = s.shoulder;
    inked(ctx, '#8a7a5c', 1.8, () => {
      ctx.moveTo(x - 12, y - 2);
      ctx.quadraticCurveTo(x, y - 9, x + 12, y - 1);
      ctx.lineTo(x + 8, y + 14);
      ctx.lineTo(x + 2, y + 10);
      ctx.lineTo(x - 2, y + 18);
      ctx.lineTo(x - 7, y + 10);
      ctx.lineTo(x - 13, y + 14);
      ctx.closePath();
    });
    for (let i = 0; i < 4; i++) line(ctx, INK, 1.2, [[x - 8 + i * 5, y + 1], [x - 8 + i * 5, y + 8]]);
    void t;
  },
  wraps: (ctx, s) => {
    // Linen bandages in bands across the chest and hips.
    const { x, y } = s.shoulder;
    for (let i = 0; i < 6; i++) {
      const wy = y + 2 + i * 5.2;
      line(ctx, BONE_SHADE, 3.4, [[x - 8, wy], [x + 8, wy + 2.4]]);
      line(ctx, INK, 0.9, [[x - 8, wy + 1.7], [x + 8, wy + 4.1]]);
    }
  },
  rags: (ctx, s, t) => {
    const { x, y } = s.hip;
    inked(ctx, t.cloth, 1.8, () =>
      poly(ctx, [[x - 10, y - 6], [x + 10, y - 6], [x + 13, y + 10], [x + 7, y + 7], [x + 3, y + 14], [x - 3, y + 8], [x - 8, y + 15], [x - 13, y + 9]]),
    );
    line(ctx, t.cloth2, 1.6, [[x - 9, y - 4], [x + 9, y - 4]]);
  },
  apron: (ctx, s, t) => {
    const { x, y } = s.shoulder;
    inked(ctx, '#5a4d44', 1.8, () => poly(ctx, [[x - 7, y + 2], [x + 7, y + 2], [x + 9, y + 34], [x - 9, y + 34]]));
    line(ctx, INK, 1.2, [[x - 7, y + 3], [x + 7, y + 3]]);
    void t;
  },
  bandolier: (ctx, s, t) => {
    const { x, y } = s.shoulder;
    line(ctx, INK, 5, [[x - 8, y], [x + 8, y + 20]]);
    line(ctx, t.cloth2, 3, [[x - 8, y], [x + 8, y + 20]]);
  },
};

// ===========================================================================
// BEHIND THE BODY (capes, cloaks, wings)
// ===========================================================================

export type BehindKind = 'cloak' | 'cape' | 'hoodCloak' | 'wings';

export const BEHIND: Readonly<Record<BehindKind, (ctx: Ctx, s: Skel, t: Tones) => void>> = {
  cloak: (ctx, s, t) => {
    const f = Math.sin(s.time * 3.1) * 3;
    const g = Math.sin(s.time * 2.3 + 1) * 2;
    inked(ctx, t.accent, 1.8, () => {
      ctx.moveTo(s.shoulder.x - 2, s.shoulder.y - 2);
      ctx.quadraticCurveTo(s.shoulder.x - 16, s.shoulder.y + 14 + g, s.hip.x - 25 + f, s.hip.y + 20 + g);
      ctx.lineTo(s.hip.x - 16 + f * 0.5, s.hip.y + 27);
      ctx.lineTo(s.hip.x - 9, s.hip.y + 20);
      ctx.lineTo(s.hip.x - 5, s.hip.y + 4);
      ctx.closePath();
    });
  },
  cape: (ctx, s, t) => {
    const f = Math.sin(s.time * 3.4) * 2;
    inked(ctx, t.cloth2, 1.8, () => {
      ctx.moveTo(s.shoulder.x - 3, s.shoulder.y - 1);
      ctx.quadraticCurveTo(s.shoulder.x - 11, s.shoulder.y + 10, s.hip.x - 14 + f, s.hip.y + 4);
      ctx.lineTo(s.hip.x - 4, s.hip.y - 2);
      ctx.closePath();
    });
  },
  hoodCloak: (ctx, s, t) => {
    const f = Math.sin(s.time * 2.4) * 2;
    inked(ctx, t.cloth, 1.8, () => {
      ctx.moveTo(s.head.x - 6, s.head.y - 4);
      ctx.quadraticCurveTo(s.shoulder.x - 22, s.shoulder.y + 10, s.hip.x - 22 + f, s.hip.y + 24);
      ctx.lineTo(s.hip.x - 15, s.hip.y + 19);
      ctx.lineTo(s.hip.x - 10 + f * 0.5, s.hip.y + 28);
      ctx.lineTo(s.hip.x - 3, s.hip.y + 20);
      ctx.lineTo(s.hip.x + 2, s.hip.y + 6);
      ctx.closePath();
    });
  },
  wings: (ctx, s, t) => {
    // Folded wings, lifting a little when the body moves: a fan of long feathers off the shoulder.
    const flap = Math.sin(s.time * 6) * 0.05 + (s.pose.bob > 1 ? 0.1 : 0);
    ctx.save();
    ctx.translate(s.shoulder.x - 3, s.shoulder.y + 3);
    for (let i = 0; i < 6; i++) {
      const a = Math.PI * 0.5 + 0.28 + i * 0.13 - flap;
      const len = 38 - i * 1.6;
      const tx = Math.cos(a) * len;
      const ty = Math.sin(a) * len;
      const nx = -Math.sin(a) * 4.6;
      const ny = Math.cos(a) * 4.6;
      inked(ctx, i % 2 === 0 ? t.fur : t.cloth, 1.5, () => {
        poly(ctx, [[nx * 0.5, ny * 0.5], [tx / 2 + nx, ty / 2 + ny], [tx, ty], [tx / 2 - nx, ty / 2 - ny], [-nx * 0.5, -ny * 0.5]]);
      });
    }
    ctx.restore();
  },
};
