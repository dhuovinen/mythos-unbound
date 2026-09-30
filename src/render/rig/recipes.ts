/**
 * Rig recipes for the five comparison deities: Hoplite, Anubis, Zeus, Thor, Cronus.
 *
 * Each one is proportions plus three drawing hooks. The identifying attribute — the thing that
 * breaks the silhouette — is deliberately large: a hoplite is mostly shield, Zeus is mostly beard
 * and bolt, Anubis is ears and muzzle, Cronus is hood and scythe.
 *
 * No gold: bone, ink, blood and greys only.
 */

import type { Recipe, Skel } from './rig';
import { BLOOD, BLOOD_DARK, BONE, BONE_SHADE, GREY, INK, SLATE, capsule, inked, poly } from './rig';

type Ctx = CanvasRenderingContext2D;

const HAIR = '#d3cab4';

/** Runs `draw` in a frame at the head, rotated with it, with local -y up and +x the facing side. */
function atHead(ctx: Ctx, s: Skel, draw: (r: number) => void): void {
  ctx.save();
  ctx.translate(s.head.x, s.head.y);
  ctx.rotate(s.headAngle);
  draw(s.headR);
  ctx.restore();
}

/** A plain human face in profile: skull, nose, brow, eye, ear. */
function face(ctx: Ctx, r: number, skin: string): void {
  inked(ctx, skin, 1.8, () => ctx.arc(0, 0, r, 0, Math.PI * 2));
  inked(ctx, skin, 1.4, () => poly(ctx, [[r * 0.85, -r * 0.05], [r * 1.3, r * 0.25], [r * 0.85, r * 0.42]]));
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(r * 0.25, -r * 0.28);
  ctx.lineTo(r * 0.78, -r * 0.2);
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.fillRect(r * 0.46, -r * 0.1, 2.2, 2.2);
  inked(ctx, skin, 1.2, () => ctx.arc(-r * 0.15, r * 0.12, r * 0.22, 0, Math.PI * 2));
}

/** A leaf-shaped tip used by spears. */
function leaf(ctx: Ctx, y: number, len: number, w: number): void {
  inked(ctx, BONE, 1.8, () => {
    ctx.moveTo(0, y - len);
    ctx.quadraticCurveTo(w, y - len * 0.45, 0, y);
    ctx.quadraticCurveTo(-w, y - len * 0.45, 0, y - len);
  });
}

// ---------------------------------------------------------------------------
// Hoplite — chaff. Mostly shield.
// ---------------------------------------------------------------------------

const hoplite: Recipe = {
  id: 'hoplite',
  name: 'Hoplite',
  tier: 'chaff',
  build: { bulk: 1, legs: 1, hunch: 0.05, head: 1 },
  skin: '#3b3b45',
  limbColor: BONE,
  attack: 'thrust',
  weaponRest: 0.08,
  drawBody(ctx, s) {
    // Short tunic and a banded cuirass.
    const x = s.hip.x;
    const y = s.hip.y;
    inked(ctx, '#3b3b45', 1.8, () => poly(ctx, [[x - 7, y - 3], [x + 7, y - 3], [x + 9, y + 14], [x - 9, y + 14]]));
    ctx.strokeStyle = BONE_SHADE;
    ctx.lineWidth = 1.4;
    for (let i = 1; i < 4; i++) {
      const ty = s.shoulder.y + i * 7;
      ctx.beginPath();
      ctx.moveTo(s.shoulder.x - 6, ty + (s.hip.y - s.shoulder.y) * 0.0);
      ctx.lineTo(s.shoulder.x + 6, ty);
      ctx.stroke();
    }
    // Greaves.
    capsule(ctx, { x: s.legF.knee.x, y: s.legF.knee.y + 1 }, s.legF.foot, 3.8, GREY);
  },
  drawHead(ctx, s) {
    atHead(ctx, s, (r) => {
      face(ctx, r, BONE);
      // Corinthian helm: dome, cheek guard, blood-red crest.
      inked(ctx, INK, 1.6, () => {
        ctx.moveTo(-r * 1.15, r * 0.3);
        ctx.arc(0, 0, r * 1.18, Math.PI * 0.92, Math.PI * 2.1);
        ctx.lineTo(r * 0.7, -r * 0.05);
        ctx.lineTo(r * 0.3, -r * 0.3);
        ctx.lineTo(-r * 0.6, -r * 0.1);
        ctx.closePath();
      });
      inked(ctx, INK, 1.6, () => poly(ctx, [[r * 0.3, r * 0.1], [r * 0.85, r * 0.15], [r * 0.6, r * 0.95], [r * 0.15, r * 0.8]]));
      inked(ctx, BLOOD, 1.6, () => {
        ctx.moveTo(-r * 1.1, -r * 0.7);
        ctx.quadraticCurveTo(-r * 0.4, -r * 2.1, r * 0.9, -r * 1.3);
        ctx.quadraticCurveTo(r * 0.2, -r * 1.25, -r * 0.7, -r * 0.5);
        ctx.closePath();
      });
    });
  },
  drawWeapon(ctx) {
    capsule(ctx, { x: 0, y: 26 }, { x: 0, y: -74 }, 2.4, BONE_SHADE);
    leaf(ctx, -72, 18, 5);
    inked(ctx, INK, 1, () => ctx.rect(-1.6, 24, 3.2, 4));
  },
  drawOffhand(ctx, s) {
    // The shield is the unit: huge, round, and in front of the body.
    const cx = s.armB.hand.x + 7;
    const cy = s.armB.hand.y - 6;
    inked(ctx, BONE, 2.4, () => ctx.arc(cx, cy, 16, 0, Math.PI * 2));
    inked(ctx, BLOOD_DARK, 1.6, () => ctx.arc(cx, cy, 11.5, 0, Math.PI * 2));
    inked(ctx, BONE, 1.6, () => ctx.arc(cx, cy, 6.5, 0, Math.PI * 2));
    inked(ctx, INK, 1.2, () => ctx.arc(cx, cy, 2.2, 0, Math.PI * 2));
  },
};

// ---------------------------------------------------------------------------
// Anubis — demigod. Ears and muzzle.
// ---------------------------------------------------------------------------

const anubis: Recipe = {
  id: 'anubis',
  name: 'Anubis',
  tier: 'demigod',
  build: { bulk: 0.88, legs: 1.06, hunch: 0.04, head: 1.05 },
  skin: SLATE,
  limbColor: '#56535e',
  attack: 'thrust',
  weaponRest: 0.1,
  drawBody(ctx, s) {
    // Pleated linen kilt.
    const x = s.hip.x;
    const y = s.hip.y;
    inked(ctx, BONE, 1.8, () => poly(ctx, [[x - 6.5, y - 4], [x + 7.5, y - 4], [x + 12, y + 17], [x - 10, y + 17]]));
    ctx.strokeStyle = BONE_SHADE;
    ctx.lineWidth = 1.2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * 3, y - 2);
      ctx.lineTo(x + i * 3.8, y + 16);
      ctx.stroke();
    }
    // Broad collar across the chest.
    inked(ctx, BONE, 1.8, () => {
      ctx.moveTo(s.shoulder.x - 8, s.shoulder.y - 1);
      ctx.quadraticCurveTo(s.shoulder.x + 1, s.shoulder.y + 14, s.shoulder.x + 9, s.shoulder.y - 1);
      ctx.quadraticCurveTo(s.shoulder.x + 1, s.shoulder.y + 5, s.shoulder.x - 8, s.shoulder.y - 1);
    });
    ctx.strokeStyle = BLOOD_DARK;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(s.shoulder.x - 6, s.shoulder.y + 3);
    ctx.quadraticCurveTo(s.shoulder.x + 1, s.shoulder.y + 10, s.shoulder.x + 7, s.shoulder.y + 3);
    ctx.stroke();
  },
  drawHead(ctx, s) {
    atHead(ctx, s, (r) => {
      // Two tall ears first, so the skull overlaps their roots.
      inked(ctx, INK, 1.6, () => poly(ctx, [[-r * 0.5, -r * 0.6], [-r * 0.15, -r * 2.5], [r * 0.35, -r * 0.7]]));
      inked(ctx, INK, 1.6, () => poly(ctx, [[r * 0.05, -r * 0.7], [r * 0.6, -r * 2.3], [r * 0.85, -r * 0.45]]));
      inked(ctx, BLOOD_DARK, 1, () => poly(ctx, [[r * 0.15, -r * 0.8], [r * 0.55, -r * 1.85], [r * 0.7, -r * 0.6]]));
      // Skull and a long tapering muzzle.
      inked(ctx, '#2b2a32', 1.8, () => ctx.arc(0, 0, r, 0, Math.PI * 2));
      inked(ctx, '#2b2a32', 1.8, () => poly(ctx, [[r * 0.35, -r * 0.55], [r * 2.35, r * 0.12], [r * 2.3, r * 0.5], [r * 0.45, r * 0.75]]));
      // Nose, jaw line and a bone-coloured eye.
      inked(ctx, INK, 1, () => ctx.ellipse(r * 2.3, r * 0.2, r * 0.22, r * 0.2, 0, 0, Math.PI * 2));
      ctx.strokeStyle = SLATE;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(r * 0.5, r * 0.4);
      ctx.lineTo(r * 2.1, r * 0.34);
      ctx.stroke();
      inked(ctx, BONE, 1, () => ctx.ellipse(r * 0.6, -r * 0.12, r * 0.3, r * 0.17, 0.15, 0, Math.PI * 2));
      ctx.fillStyle = INK;
      ctx.fillRect(r * 0.66, -r * 0.16, 2.2, 2.2);
    });
  },
  drawWeapon(ctx) {
    // The was-sceptre: a straight staff, forked at the foot, animal-headed at the top.
    capsule(ctx, { x: 0, y: 28 }, { x: 0, y: -74 }, 2.6, BONE_SHADE);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-5, 38);
    ctx.lineTo(0, 27);
    ctx.lineTo(5, 38);
    ctx.stroke();
    inked(ctx, '#2b2a32', 1.6, () => poly(ctx, [[-4, -72], [-6, -86], [-1, -78], [2, -88], [5, -74], [11, -70], [10, -66], [-3, -66]]));
  },
};

// ---------------------------------------------------------------------------
// Zeus — god. Beard and bolt.
// ---------------------------------------------------------------------------

const zeus: Recipe = {
  id: 'zeus',
  name: 'Zeus',
  tier: 'god',
  build: { bulk: 1.3, legs: 0.96, hunch: 0.03, head: 1.12 },
  skin: BONE_SHADE,
  limbColor: BONE,
  attack: 'overhead',
  weaponRest: 0.5,
  drawBody(ctx, s) {
    // Long chiton to the knee, belted in blood red.
    const x = s.hip.x;
    const y = s.hip.y;
    inked(ctx, BONE_SHADE, 1.8, () => poly(ctx, [[x - 8.5, y - 6], [x + 8.5, y - 6], [x + 12, y + 23], [x - 12, y + 23]]));
    ctx.strokeStyle = GREY;
    ctx.lineWidth = 1.2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * 3.2, y + 2);
      ctx.lineTo(x + i * 4.2, y + 22);
      ctx.stroke();
    }
    inked(ctx, BLOOD_DARK, 1.4, () => ctx.rect(x - 8.6, y - 6, 17.2, 4.5));
    // The aegis: a scaled mantle over the front shoulder.
    inked(ctx, GREY, 1.8, () => {
      ctx.moveTo(s.shoulder.x - 11, s.shoulder.y - 2);
      ctx.quadraticCurveTo(s.shoulder.x + 2, s.shoulder.y - 8, s.shoulder.x + 11, s.shoulder.y - 1);
      ctx.lineTo(s.shoulder.x + 8, s.shoulder.y + 14);
      ctx.quadraticCurveTo(s.shoulder.x, s.shoulder.y + 20, s.shoulder.x - 9, s.shoulder.y + 13);
      ctx.closePath();
    });
    ctx.fillStyle = INK;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) ctx.fillRect(s.shoulder.x - 7 + c * 5.2 + (r % 2) * 2, s.shoulder.y + 1 + r * 4.6, 2, 2);
    }
    ctx.strokeStyle = BLOOD_DARK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s.shoulder.x - 9, s.shoulder.y + 13);
    ctx.quadraticCurveTo(s.shoulder.x, s.shoulder.y + 19, s.shoulder.x + 8, s.shoulder.y + 14);
    ctx.stroke();
  },
  drawHead(ctx, s) {
    atHead(ctx, s, (r) => {
      // A great swept beard — the largest single mass on the figure — and hair behind the head.
      inked(ctx, HAIR, 1.8, () => {
        ctx.moveTo(-r * 1.1, -r * 0.6);
        ctx.quadraticCurveTo(-r * 1.9, r * 0.6, -r * 0.9, r * 1.2);
        ctx.lineTo(-r * 0.2, r * 0.2);
        ctx.closePath();
      });
      face(ctx, r, BONE);
      inked(ctx, HAIR, 1.8, () => {
        ctx.moveTo(r * 0.75, r * 0.25);
        ctx.quadraticCurveTo(r * 1.6, r * 0.9, r * 0.85, r * 2.3);
        ctx.quadraticCurveTo(r * 0.1, r * 2.6, -r * 0.45, r * 1.5);
        ctx.quadraticCurveTo(-r * 0.75, r * 0.6, -r * 0.4, r * 0.1);
        ctx.quadraticCurveTo(r * 0.25, r * 0.45, r * 0.75, r * 0.25);
      });
      ctx.strokeStyle = GREY;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(r * 0.35, r * 0.7);
      ctx.quadraticCurveTo(r * 0.45, r * 1.4, r * 0.3, r * 2);
      ctx.moveTo(-r * 0.05, r * 0.8);
      ctx.quadraticCurveTo(-r * 0.05, r * 1.4, -r * 0.1, r * 1.9);
      ctx.stroke();
      inked(ctx, HAIR, 1.8, () => {
        ctx.moveTo(-r * 1.05, -r * 0.2);
        ctx.quadraticCurveTo(-r * 0.4, -r * 1.5, r * 0.95, -r * 0.55);
        ctx.quadraticCurveTo(r * 0.3, -r * 0.75, -r * 0.3, -r * 0.3);
        ctx.closePath();
      });
    });
  },
  drawWeapon(ctx) {
    // The thunderbolt: a jagged bolt, big enough to be read at a glance.
    inked(ctx, INK, 1, () => ctx.rect(-2.2, 2, 4.4, 9));
    inked(ctx, BONE, 2, () =>
      poly(ctx, [[1, 4], [-9, -14], [-2, -14], [-11, -34], [0, -34], [-7, -62], [11, -28], [3, -28], [10, -10], [3, -10]]),
    );
  },
};

// ---------------------------------------------------------------------------
// Thor — god. Helm, hammer, red cloak.
// ---------------------------------------------------------------------------

const thor: Recipe = {
  id: 'thor',
  name: 'Thor',
  tier: 'god',
  build: { bulk: 1.5, legs: 0.88, hunch: 0.07, head: 1.08 },
  skin: '#3d3a42',
  limbColor: BONE,
  attack: 'overhead',
  weaponRest: 0.75,
  drawBehind(ctx, s) {
    // The cloak streams behind, fluttering on time.
    const f = Math.sin(s.time * 3.1) * 3;
    const g = Math.sin(s.time * 2.3 + 1) * 2;
    inked(ctx, BLOOD, 1.8, () => {
      ctx.moveTo(s.shoulder.x - 2, s.shoulder.y - 2);
      ctx.quadraticCurveTo(s.shoulder.x - 16, s.shoulder.y + 14 + g, s.hip.x - 25 + f, s.hip.y + 20 + g);
      ctx.lineTo(s.hip.x - 16 + f * 0.5, s.hip.y + 27);
      ctx.lineTo(s.hip.x - 9, s.hip.y + 20);
      ctx.lineTo(s.hip.x - 5, s.hip.y + 4);
      ctx.closePath();
    });
  },
  drawBody(ctx, s) {
    const x = s.hip.x;
    const y = s.hip.y;
    inked(ctx, '#3d3a42', 1.8, () => poly(ctx, [[x - 9, y - 6], [x + 9, y - 6], [x + 12, y + 13], [x - 12, y + 13]]));
    inked(ctx, BLOOD_DARK, 1.4, () => ctx.rect(x - 9, y - 6, 18, 4));
    // Chest band and shoulder pauldron.
    inked(ctx, GREY, 1.6, () => poly(ctx, [[s.shoulder.x - 11, s.shoulder.y - 1], [s.shoulder.x + 11, s.shoulder.y - 1], [s.shoulder.x + 9, s.shoulder.y + 9], [s.shoulder.x - 9, s.shoulder.y + 9]]));
    ctx.fillStyle = INK;
    ctx.fillRect(s.shoulder.x - 2, s.shoulder.y + 1, 4, 4);
  },
  drawHead(ctx, s) {
    atHead(ctx, s, (r) => {
      // Red beard, braided down the chest.
      inked(ctx, BLOOD_DARK, 1.8, () => {
        ctx.moveTo(r * 0.8, r * 0.2);
        ctx.quadraticCurveTo(r * 1.4, r * 0.9, r * 0.7, r * 2);
        ctx.quadraticCurveTo(r * 0.1, r * 2.2, -r * 0.4, r * 1.2);
        ctx.quadraticCurveTo(-r * 0.6, r * 0.5, -r * 0.3, r * 0.1);
        ctx.closePath();
      });
      face(ctx, r, BONE);
      inked(ctx, BLOOD_DARK, 1.8, () => {
        ctx.moveTo(r * 0.85, r * 0.3);
        ctx.quadraticCurveTo(r * 1.4, r * 0.9, r * 0.7, r * 1.9);
        ctx.quadraticCurveTo(r * 0.1, r * 2.1, -r * 0.35, r * 1.1);
        ctx.quadraticCurveTo(r * 0.2, r * 0.5, r * 0.85, r * 0.3);
      });
      // Winged helm: an ink cap with two bone wings swept back.
      inked(ctx, INK, 1.6, () => {
        ctx.moveTo(-r * 1.1, r * 0.1);
        ctx.arc(0, 0, r * 1.15, Math.PI * 0.95, Math.PI * 2.05);
        ctx.lineTo(r * 0.85, -r * 0.35);
        ctx.lineTo(-r * 0.6, -r * 0.15);
        ctx.closePath();
      });
      inked(ctx, BONE, 1.6, () => {
        ctx.moveTo(-r * 0.3, -r * 0.95);
        ctx.quadraticCurveTo(-r * 1.4, -r * 2.5, -r * 2.3, -r * 1.3);
        ctx.quadraticCurveTo(-r * 1.3, -r * 1.5, -r * 0.3, -r * 0.6);
        ctx.closePath();
      });
      inked(ctx, BONE, 1.6, () => {
        ctx.moveTo(r * 0.3, -r * 1.05);
        ctx.quadraticCurveTo(r * 0.1, -r * 2.6, r * 1.3, -r * 2.3);
        ctx.quadraticCurveTo(r * 0.9, -r * 1.6, r * 0.75, -r * 0.8);
        ctx.closePath();
      });
    });
  },
  drawWeapon(ctx) {
    // Mjolnir: a short haft and a heavy block head.
    capsule(ctx, { x: 0, y: 14 }, { x: 0, y: -22 }, 3.6, BONE_SHADE);
    inked(ctx, GREY, 2.2, () => ctx.rect(-12, -42, 24, 19));
    ctx.strokeStyle = BONE;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-9, -39);
    ctx.lineTo(9, -39);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-4, -36);
    ctx.lineTo(0, -28);
    ctx.lineTo(4, -36);
    ctx.stroke();
  },
};

// ---------------------------------------------------------------------------
// Cronus — titan. Hood and scythe.
// ---------------------------------------------------------------------------

const cronus: Recipe = {
  id: 'cronus',
  name: 'Cronus',
  tier: 'titan',
  build: { bulk: 1.75, legs: 0.92, hunch: 0.32, head: 1.0 },
  skin: '#2e2c34',
  limbColor: '#8a8474',
  attack: 'sweep',
  weaponRest: 0.3,
  drawBehind(ctx, s) {
    // The hood and cloak hang off the back in tattered points.
    const f = Math.sin(s.time * 2.4) * 2;
    inked(ctx, '#26242c', 1.8, () => {
      ctx.moveTo(s.head.x - 6, s.head.y - 4);
      ctx.quadraticCurveTo(s.shoulder.x - 22, s.shoulder.y + 10, s.hip.x - 22 + f, s.hip.y + 24);
      ctx.lineTo(s.hip.x - 15, s.hip.y + 19);
      ctx.lineTo(s.hip.x - 10 + f * 0.5, s.hip.y + 28);
      ctx.lineTo(s.hip.x - 3, s.hip.y + 20);
      ctx.lineTo(s.hip.x + 2, s.hip.y + 6);
      ctx.closePath();
    });
  },
  drawBody(ctx, s) {
    const x = s.hip.x;
    const y = s.hip.y;
    // Ragged robe over the hips, and a heavy mantle across the shoulders.
    inked(ctx, '#2e2c34', 1.8, () => poly(ctx, [[x - 10, y - 6], [x + 10, y - 6], [x + 13, y + 10], [x + 7, y + 7], [x + 3, y + 14], [x - 3, y + 8], [x - 8, y + 15], [x - 13, y + 9]]));
    inked(ctx, '#26242c', 1.8, () => {
      ctx.moveTo(s.shoulder.x - 14, s.shoulder.y + 2);
      ctx.quadraticCurveTo(s.shoulder.x, s.shoulder.y - 12, s.shoulder.x + 13, s.shoulder.y + 1);
      ctx.lineTo(s.shoulder.x + 10, s.shoulder.y + 10);
      ctx.lineTo(s.shoulder.x - 11, s.shoulder.y + 10);
      ctx.closePath();
    });
    ctx.strokeStyle = BLOOD_DARK;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x - 9, y - 4);
    ctx.lineTo(x + 9, y - 4);
    ctx.stroke();
  },
  drawHead(ctx, s) {
    atHead(ctx, s, (r) => {
      // A gaunt face inside a deep hood. Only the eyes are lit.
      inked(ctx, '#26242c', 1.8, () => {
        ctx.moveTo(-r * 1.3, r * 0.9);
        ctx.quadraticCurveTo(-r * 1.6, -r * 1.7, r * 0.3, -r * 1.65);
        ctx.quadraticCurveTo(r * 1.6, -r * 1.3, r * 1.45, r * 0.25);
        ctx.lineTo(r * 0.55, r * 0.15);
        ctx.lineTo(r * 0.1, r * 0.95);
        ctx.closePath();
      });
      inked(ctx, '#b9b09c', 1.6, () => poly(ctx, [[r * 0.15, -r * 0.6], [r * 1.1, -r * 0.3], [r * 1.25, r * 0.15], [r * 0.85, r * 1.05], [r * 0.25, r * 0.85]]));
      inked(ctx, INK, 1, () => poly(ctx, [[r * 0.45, -r * 0.4], [r * 1.05, -r * 0.25], [r * 0.9, r * 0.05], [r * 0.45, r * 0.05]]));
      ctx.fillStyle = BLOOD;
      ctx.fillRect(r * 0.72, -r * 0.22, 3, 2.4);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(r * 0.4, r * 0.6);
      ctx.lineTo(r * 1.0, r * 0.55);
      ctx.stroke();
    });
  },
  drawWeapon(ctx) {
    // A huge reaping sickle, taller than the titan himself.
    capsule(ctx, { x: 0, y: 26 }, { x: 0, y: -74 }, 3.6, BONE_SHADE);
    inked(ctx, BONE, 2.4, () => {
      ctx.moveTo(0, -78);
      ctx.bezierCurveTo(28, -92, 52, -72, 46, -36);
      ctx.bezierCurveTo(44, -58, 26, -72, 4, -66);
      ctx.closePath();
    });
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(6, -72);
    ctx.bezierCurveTo(26, -80, 41, -66, 40, -48);
    ctx.stroke();
  },
};

export const RECIPES: readonly Recipe[] = [hoplite, anubis, zeus, thor, cronus];

export const RECIPE_BY_ID: ReadonlyMap<string, Recipe> = new Map(RECIPES.map((r) => [r.id, r]));
