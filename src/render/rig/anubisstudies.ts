/** Three evaluation-only Anubis designs. They share the battle skeleton and five animation states. */
import type { AnimName, Figure } from './figure';
import { ANIM_SECONDS } from './figure';
import { atHead } from './parts';
import type { Animated, P, Recipe, Skel } from './rig';
import { animate, buildSkel, drawRig, inked, poly } from './rig';

type Ctx = CanvasRenderingContext2D;
type Direction = 'guardian' | 'hunter' | 'spirit';
interface Palette { dark: string; plane: string; light: string; cloth: string; trim: string; accent: string }
const PALETTES: Record<Direction, Palette> = {
  guardian: { dark: '#182732', plane: '#344c5a', light: '#71909a', cloth: '#e1d5be', trim: '#aaaab0', accent: '#67b9c3' },
  hunter: { dark: '#2a252c', plane: '#58404a', light: '#a7807b', cloth: '#bb6856', trim: '#c0aaa0', accent: '#efb8a4' },
  spirit: { dark: '#263b43', plane: '#4a6971', light: '#91b8b5', cloth: '#8b85ad', trim: '#b5c8ca', accent: '#b9f1dc' },
};
function stroke(ctx: Ctx, color: string, width: number, points: readonly (readonly [number, number])[]): void {
  ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
}
function shape(ctx: Ctx, fill: string, points: readonly (readonly [number, number])[], outline = 1.2): void {
  inked(ctx, fill, outline, () => poly(ctx, points));
}
function jewel(ctx: Ctx, x: number, y: number, radius: number, color: string): void {
  shape(ctx, color, [[x, y - radius], [x + radius * .7, y], [x, y + radius], [x - radius * .7, y]], .65);
  stroke(ctx, '#e4eee4', .45, [[x, y - radius * .7], [x + radius * .4, y]]);
}
function ankh(ctx: Ctx, color: string, scale = 1): void {
  ctx.save(); ctx.scale(scale, scale);
  ctx.strokeStyle = color; ctx.lineWidth = 1.7; ctx.beginPath(); ctx.ellipse(0, -9, 3.3, 4.5, 0, 0, Math.PI * 2); ctx.stroke();
  stroke(ctx, color, 1.7, [[0, -4.5], [0, 6]]); stroke(ctx, color, 1.7, [[-5, -2], [5, -2]]); ctx.restore();
}

/** Angular skull, separate muzzle/jaw planes and tall expressive ears read even at lane scale. */
function head(ctx: Ctx, s: Skel, direction: Direction): void {
  const p = PALETTES[direction];
  atHead(ctx, s, (r) => {
    ctx.scale(r / 10.5, r / 10.5);
    if (direction === 'guardian') {
      shape(ctx, p.cloth, [[-10, -7], [-15, 5], [-14, 27], [-6, 32], [-3, 7]]);
      for (let i = 0; i < 7; i++) stroke(ctx, p.plane, 1.3, [[-12, 7 + i * 3], [-6, 9 + i * 3]]);
    }
    // Far ear is narrower and darker, near ear catches the rim light.
    shape(ctx, p.dark, [[-7, -4], [-8, -29], [-4, -34], [0, -8]]);
    shape(ctx, p.plane, [[0, -7], [4, -36], [8, -31], [9, -5]]);
    shape(ctx, direction === 'hunter' ? '#794c52' : '#304b57', [[3, -11], [5, -28], [7, -12]], .6);
    stroke(ctx, p.light, .75, [[4, -33], [7, -28], [8, -13]]);
    shape(ctx, p.dark, [[-10, -7], [-5, -14], [5, -12], [12, -5], [23, -1], [25, 3], [23, 8], [8, 11], [-3, 9], [-10, 3]]);
    shape(ctx, p.plane, [[-7, -7], [-2, -11], [6, -9], [12, -4], [4, 2], [-5, 3]], .45);
    shape(ctx, p.plane, [[10, 1], [23, 3], [22, 6], [8, 8]], .45);
    stroke(ctx, p.light, .7, [[-4, -11], [5, -9], [12, -4], [22, -1]]);
    stroke(ctx, '#111a24', 1.2, [[8, 6], [22, 5]]);
    shape(ctx, '#111a24', [[22, 0], [25, 2], [24, 5], [21, 4]], .5);
    shape(ctx, p.trim, [[1, -4], [8, -3], [5, 0], [1, 0]], .4);
    stroke(ctx, p.accent, 1.1, [[2, -2], [6, -2]]);
    stroke(ctx, p.light, .6, [[0, 1], [2, 5], [5, 7]]);
    // Engraving below the eye and the band that holds the headdress.
    stroke(ctx, p.trim, .65, [[-5, -2], [-5, 4], [-1, 7]]);
    if (direction === 'hunter') {
      shape(ctx, p.cloth, [[-11, -8], [-3, -12], [7, -10], [10, -6], [-4, -5]]);
      stroke(ctx, '#ebc9ad', .8, [[-8, -8], [3, -8]]);
      shape(ctx, '#7c4646', [[-8, 7], [-1, 9], [5, 8], [4, 15], [-7, 13]]);
    } else {
      stroke(ctx, p.trim, 2, [[-8, -6], [-4, -11], [4, -10], [8, -6]]);
      jewel(ctx, -2, -11, 2.6, p.accent);
      if (direction === 'spirit') {
        stroke(ctx, p.accent, .7, [[-8, 0], [-8, 5], [-3, 9]]);
        stroke(ctx, p.accent, .7, [[10, 8], [15, 8]]);
      }
    }
  });
}

/** Draw a torso-local surface: attached ornament follows the spine instead of floating on screen. */
function torsoFrame(ctx: Ctx, s: Skel, draw: () => void): void {
  ctx.save(); ctx.translate(s.shoulder.x, s.shoulder.y); ctx.rotate(s.torsoAngle); draw(); ctx.restore();
}
function body(ctx: Ctx, s: Skel, direction: Direction): void {
  const p = PALETTES[direction], bulk = s.build.bulk;
  torsoFrame(ctx, s, () => {
    ctx.scale(bulk, 1);
    if (direction === 'guardian') {
      shape(ctx, p.plane, [[-11, 1], [11, 1], [8, 23], [0, 29], [-8, 23]]);
      for (let i = 0; i < 3; i++) {
        shape(ctx, i % 2 ? p.dark : '#3d5b69', [[-7, 12 + i * 4], [7, 12 + i * 4], [6, 16 + i * 4], [-6, 16 + i * 4]], .55);
      }
      stroke(ctx, p.trim, .7, [[0, 11], [0, 24]]);
    } else if (direction === 'hunter') {
      shape(ctx, '#63454a', [[-9, 0], [-3, 1], [8, 23], [4, 28], [-6, 10]]);
      for (let i = 0; i < 3; i++) jewel(ctx, -4 + i * 3.5, 7 + i * 6, 1.4, p.trim);
      shape(ctx, p.plane, [[-13, -2], [-5, -3], [-4, 6], [-10, 10], [-15, 5]]);
      stroke(ctx, p.trim, .7, [[-13, 1], [-7, 1], [-7, 6]]);
      stroke(ctx, p.light, .65, [[4, 10], [7, 17], [4, 22]]);
    } else {
      shape(ctx, p.plane, [[-7, 8], [0, 5], [8, 8], [7, 23], [0, 28], [-7, 23]], .8);
      stroke(ctx, p.accent, .65, [[-5, 13], [0, 17], [5, 13]]);
      stroke(ctx, p.accent, .65, [[-4, 20], [0, 23], [4, 20]]);
      ctx.save(); ctx.translate(0, 18); ankh(ctx, p.accent, .65); ctx.restore();
    }
    // A broad three-row beaded collar, with individual alternating stone inlays.
    shape(ctx, p.trim, [[-12, -1], [-6, -3], [0, 0], [6, -3], [12, -1], [10, 7], [5, 12], [0, 14], [-6, 11], [-11, 6]]);
    for (let row = 0; row < 3; row++) {
      for (let col = -3; col <= 3; col++) {
        const x = col * 2.9, y = 2 + row * 2.7 + (3 - Math.abs(col)) * 1.2;
        shape(ctx, (col + row) % 2 ? p.accent : p.plane, [[x - 1, y], [x + 1, y], [x + .8, y + 2], [x - .8, y + 2]], .25);
      }
    }
    jewel(ctx, 0, 13.5, 2.4, p.accent);
  });
  // A layered kilt anchored at the hip; the long centre panel has delayed secondary motion.
  ctx.save(); ctx.translate(s.hip.x, s.hip.y); ctx.rotate(s.torsoAngle * .45);
  const flutter = Math.sin(s.time * 2.8) * (direction === 'hunter' ? 3 : 1.3);
  const length = direction === 'spirit' ? 34 : direction === 'guardian' ? 23 : 15;
  shape(ctx, direction === 'hunter' ? '#d0bca3' : p.cloth, [[-9, -3], [10, -3], [14 + flutter * .4, length], [-13 + flutter * .4, length]]);
  for (let i = -3; i <= 3; i++) stroke(ctx, direction === 'hunter' ? '#927d71' : '#8f8c94', .6,
    [[i * 2.2, 1], [i * 3.2 + flutter * .4, length - 1]]);
  shape(ctx, direction === 'hunter' ? p.cloth : p.dark, [[-3, -3], [7, -3], [8 + flutter, length + 6], [-1 + flutter, length + 9]]);
  stroke(ctx, p.trim, .85, [[-1, 2], [5, 2], [6 + flutter, length + 3], [1 + flutter, length + 5]]);
  for (let i = 0; i < 3; i++) {
    const y = 8 + i * 5;
    stroke(ctx, p.accent, .6, [[1, y], [4, y], [3, y + 2], [1, y + 2]]);
  }
  shape(ctx, p.trim, [[-10, -4], [10, -4], [10, 0], [-10, 0]]);
  jewel(ctx, 0, -2, 3.2, p.accent);
  ctx.restore();
}
function behind(ctx: Ctx, s: Skel, direction: Direction): void {
  const p = PALETTES[direction];
  const wind = Math.sin(s.time * 2.4) * 3;
  if (direction === 'guardian') {
    shape(ctx, '#243846', [[s.shoulder.x - 9, s.shoulder.y + 2], [s.shoulder.x - 15, s.shoulder.y + 4],
      [s.hip.x - 25 + wind, s.hip.y + 31], [s.hip.x - 9, s.hip.y + 25]]);
    stroke(ctx, p.trim, .9, [[s.shoulder.x - 14, s.shoulder.y + 8], [s.hip.x - 23 + wind, s.hip.y + 29]]);
  } else if (direction === 'hunter') {
    const x = s.neck.x - 7, y = s.neck.y + 4;
    shape(ctx, '#a45c50', [[x, y], [x - 9, y + 6], [x - 43, y + 8 + wind], [x - 55, y + 17 + wind], [x - 34, y + 15], [x, y + 8]]);
    stroke(ctx, '#ddaa90', .8, [[x - 13, y + 9], [x - 36, y + 10 + wind]]);
  } else {
    ctx.save(); ctx.globalAlpha = .62;
    for (let i = 0; i < 3; i++) {
      const x = s.shoulder.x - 5 - i * 4, y = s.shoulder.y;
      inked(ctx, i === 1 ? '#729496' : p.cloth, .7, () => {
        ctx.moveTo(x, y); ctx.bezierCurveTo(x - 30, y + 28, x - 7 + wind, y + 65, x - 35 + wind, y + 91 - i * 10);
        ctx.bezierCurveTo(x + 2, y + 75, x - 10, y + 33, x + 4, y + 3); ctx.closePath();
      });
    }
    ctx.restore();
  }
}
function staff(ctx: Ctx, direction: Direction): void {
  const p = PALETTES[direction];
  if (direction === 'hunter') {
    shape(ctx, '#493d43', [[-2, 13], [2, 13], [2, -12], [-2, -12]]);
    for (let i = 0; i < 4; i++) stroke(ctx, p.cloth, .7, [[-2, 3 + i * 2], [2, 1 + i * 2]]);
    // A thick hooked blade: curved edge and contrasting bevel, rather than a straight sword.
    inked(ctx, p.trim, 1.2, () => {
      ctx.moveTo(-2, -10); ctx.lineTo(-3, -29); ctx.bezierCurveTo(-22, -34, -22, -55, -3, -61);
      ctx.bezierCurveTo(-9, -46, -5, -39, 7, -36); ctx.lineTo(4, -10); ctx.closePath();
    });
    stroke(ctx, '#f0dfca', .9, [[-1, -57], [-11, -49], [-10, -39], [4, -34], [2, -15]]);
    stroke(ctx, p.dark, .75, [[-2, -28], [2, -26], [0, -23]]);
    shape(ctx, p.accent, [[-6, -11], [7, -11], [6, -8], [-5, -8]], .6);
  } else {
    shape(ctx, p.plane, [[-1.7, 27], [1.7, 27], [1.7, -69], [-1.7, -69]]);
    stroke(ctx, p.trim, .7, [[.7, 23], [.7, -66]]);
    for (const y of [-63, -57, -13, -8, 7, 12]) stroke(ctx, p.trim, 2, [[-2, y], [2, y]]);
    stroke(ctx, p.trim, 1.6, [[-5, 34], [-1, 25], [1, 25], [5, 34]]);
    if (direction === 'guardian') {
      shape(ctx, p.dark, [[-4, -67], [-7, -84], [-3, -79], [1, -87], [5, -73], [13, -69], [12, -64], [1, -64]]);
      stroke(ctx, p.trim, .8, [[-3, -76], [3, -71], [10, -68]]); jewel(ctx, 4, -69, 1.8, p.accent);
      shape(ctx, p.trim, [[-7, -59], [7, -59], [4, -54], [-4, -54]], .65);
    } else {
      ctx.save(); ctx.translate(0, -65); ankh(ctx, p.accent, 1.6); ctx.restore();
      jewel(ctx, 0, -53, 3, p.cloth);
    }
  }
}
/** Joint-bound bracers, shin plates and wrapping are drawn over the base limbs. */
function limbDetail(ctx: Ctx, a: P, b: P, direction: Direction, shin: boolean): void {
  const p = PALETTES[direction], dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy);
  ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(-Math.atan2(dx, dy));
  const start = length * .35, end = length * .85;
  shape(ctx, direction === 'hunter' ? '#806b63' : p.plane, [[-3.5, start], [3.5, start], [3, end], [-3, end]], .75);
  if (direction === 'hunter') {
    for (let y = start; y < end; y += 2.4) stroke(ctx, p.trim, .8, [[-3, y + 1.4], [3, y]]);
  } else {
    stroke(ctx, p.trim, .7, [[-2.5, start + 1], [2.5, start + 1], [2, end - 1], [-2, end - 1]]);
    jewel(ctx, 0, start + (end - start) * .45, shin ? 2.1 : 1.3, p.accent);
  }
  ctx.restore();
}

export function sampleAnubisStudy(recipe: Recipe, direction: Direction, anim: AnimName, t: number): Animated {
  const sampled = animate(recipe, anim, t);
  if (direction === 'spirit' && (anim === 'idle' || anim === 'walk')) {
    const float = Math.sin(t * 2) * 1.5;
    return { ...sampled, pose: { ...sampled.pose, bob: -4 + float, lean: 0, legF: [.06, .08], legB: [-.12, .12] } };
  }
  return sampled;
}
function makeStudy(direction: Direction, name: string): { figure: Figure; recipe: Recipe } {
  const p = PALETTES[direction];
  const recipe: Recipe = {
    id: `anubis-study-${direction}`, name, tier: 'demigod',
    build: direction === 'guardian' ? { bulk: 1.16, legs: 1.1, head: 1, hunch: 0 }
      : direction === 'hunter' ? { bulk: .88, legs: 1.04, head: .95, hunch: .1 }
        : { bulk: .86, legs: 1.14, head: .94, hunch: 0 },
    skin: p.dark, limbColor: p.dark,
    attack: direction === 'guardian' ? 'thrust' : direction === 'hunter' ? 'sweep' : 'cast',
    weaponRest: direction === 'hunter' ? .25 : -.08,
    motion: direction === 'guardian' ? { cadence: .72, stride: .68, sway: .35, weight: .75 }
      : direction === 'hunter' ? { cadence: 1.18, stride: 1.1, sway: .85, weight: .85 }
        : { cadence: .6, stride: .4, sway: .2, weight: .3 },
    drawHead: (ctx, s) => head(ctx, s, direction),
    drawBody: (ctx, s) => body(ctx, s, direction),
    drawBehind: (ctx, s) => behind(ctx, s, direction),
    drawWeapon: (ctx) => staff(ctx, direction),
    drawOffhand(ctx, s) {
      if (direction !== 'guardian') return;
      ctx.save(); ctx.translate(s.armB.hand.x - 2, s.armB.hand.y + 6); ankh(ctx, p.trim, 1.15); ctx.restore();
    },
  };
  const figure: Figure = {
    id: recipe.id, name, tier: 'demigod', body: 'biped', view: { x: -36, y: -145, w: 82, h: 100 },
    draw(ctx, anim, t, time) {
      const sampled = sampleAnubisStudy(recipe, direction, anim, t);
      // Ornament and cloth stop their ambient clock once the body has fallen.
      const clock = anim === 'death' ? Math.min(t, ANIM_SECONDS.death) : time;
      const s = buildSkel(recipe, sampled.pose, clock);
      if (direction === 'spirit') {
        ctx.save();
        const alpha = anim === 'death' ? Math.max(0, 1 - t / ANIM_SECONDS.death) : 1;
        ctx.globalAlpha *= alpha * .42;
        ctx.strokeStyle = p.accent; ctx.lineWidth = .65;
        ctx.beginPath(); ctx.ellipse(0, -87, 35, 38, -.15, 0, Math.PI * 2); ctx.stroke();
        for (let i = 0; i < 7; i++) {
          const phase = time * .55 + i * Math.PI * 2 / 7;
          jewel(ctx, Math.cos(phase) * 35, -87 + Math.sin(phase) * 38, 1.3, p.accent);
        }
        ctx.restore();
      }
      ctx.save();
      if (direction === 'spirit') ctx.globalAlpha *= .88;
      drawRig(ctx, recipe, sampled, clock);
      ctx.translate(0, -sampled.drop); ctx.rotate(-sampled.fall);
      limbDetail(ctx, s.armB.elbow, s.armB.hand, direction, false);
      limbDetail(ctx, s.armF.elbow, s.armF.hand, direction, false);
      limbDetail(ctx, s.legB.knee, s.legB.foot, direction, true);
      limbDetail(ctx, s.legF.knee, s.legF.foot, direction, true);
      ctx.restore();
    },
  };
  return { figure, recipe };
}

/** Preview composition leaves room for raised weapons and a sideways fallen silhouette. */
export function anubisStudyFrame(anim: AnimName, mirrored: boolean): { x: number; y: number; scale: number } {
  return anim === 'death' ? { x: mirrored ? 185 : 255, y: 215, scale: 1.2 }
    : anim === 'attack' ? { x: mirrored ? 250 : 190, y: 302, scale: 1.45 }
    : { x: mirrored ? 230 : 210, y: 302, scale: 1.8 };
}

export const ANUBIS_STUDIES = [
  { direction: 'guardian' as const, number: '01', name: 'Necropolis guardian', label: 'Ceremonial · sculptural · composed',
    description: 'Faceted obsidian, a striped linen headdress and a stone-inlaid collar. A long was sceptre and weighted drapery give him a commanding outline.',
    motion: 'Measured steps · deliberate spear thrust', accent: PALETTES.guardian.accent,
    ...makeStudy('guardian', 'Necropolis guardian') },
  { direction: 'hunter' as const, number: '02', name: 'Dune stalker', label: 'Agile · weathered · dangerous',
    description: 'A lean jackal profile, wrapped limbs and asymmetric armour. Wind-caught red linen and a hooked blade make the silhouette feel quick and predatory.',
    motion: 'Long strides · sweeping blade strike', accent: PALETTES.hunter.accent,
    ...makeStudy('hunter', 'Dune stalker') },
  { direction: 'spirit' as const, number: '03', name: 'Guide of the Duat', label: 'Ethereal · mysterious · flowing',
    description: 'Pale jade markings, translucent violet veils and orbiting spirit stones. Suspended cloth and an ankh staff create a quieter, supernatural presence.',
    motion: 'Floating glide · open-handed invocation', accent: PALETTES.spirit.accent,
    ...makeStudy('spirit', 'Guide of the Duat') },
] as const;
