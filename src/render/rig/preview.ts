/** Standalone rig evaluator plus the shared parts catalogue. */
import { createRigExplorer } from '../../ui/rigviewer';
import { RIG_ROSTER } from './figures';
import type { BeardKind, BehindKind, BodyKind, GearKind, HairKind, HeadKind, OffhandKind, Tones, WeaponKind } from './parts';
import { BEARDS, BEHIND, BODY, DEFAULT_TONES, GEAR, HAIR, HEADS, OFFHAND, WEAPONS } from './parts';
import { animate, drawRig } from './rig';
import type { Recipe } from './rig';
import { RECIPES } from './recipes';

const host = document.getElementById('explorer') as HTMLElement;
const partsHost = document.getElementById('parts') as HTMLElement;
const query = new URLSearchParams(location.search);
const pantheon = query.get('pantheon');
const explorer = createRigExplorer(RIG_ROSTER, {
  study: query.get('study') === 'anubis' ? 'anubis' : undefined,
  pantheon: pantheon === 'greek' || pantheon === 'norse' ? pantheon : 'egyptian',
  version: query.get('version') === 'v1' ? 'v1' : 'v2',
});
host.append(explorer.root);
explorer.start();
document.addEventListener('visibilitychange', () => document.hidden ? explorer.stop() : explorer.start());

function hiDpi(canvas: HTMLCanvasElement, w: number, h: number): CanvasRenderingContext2D {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.scale(dpr, dpr);
  return ctx;
}

// ---- parts catalogue ------------------------------------------------------------------------------

/** A plain mannequin that wears whichever single part is under review. */
function mannequin(wear: Partial<Pick<Recipe, 'drawBody' | 'drawOffhand' | 'drawBehind' | 'drawWeapon'>>): (ctx: CanvasRenderingContext2D) => void {
  const base = RECIPES[2] as Recipe;
  const recipe: Recipe = {
    ...base,
    skin: '#6a6455',
    drawBehind: wear.drawBehind,
    drawBody: wear.drawBody ?? ((): void => undefined),
    drawOffhand: wear.drawOffhand,
    drawHead: (ctx, s) => {
      ctx.save();
      ctx.translate(s.head.x, s.head.y);
      HEADS.human(ctx, s.headR, DEFAULT_TONES);
      ctx.restore();
    },
    drawWeapon: wear.drawWeapon ?? ((): void => undefined),
  };
  return (ctx) => {
    ctx.translate(58, 148);
    ctx.scale(1.35, 1.35);
    drawRig(ctx, recipe, animate(recipe, 'idle', 0), 0);
  };
}

const tones: Tones = { ...DEFAULT_TONES };
const catalogue: { title: string; items: { label: string; draw: (ctx: CanvasRenderingContext2D) => void; w?: number; h?: number }[] }[] = [
  {
    title: 'Heads',
    items: (Object.keys(HEADS) as HeadKind[]).map((k) => ({
      label: k,
      w: 110,
      h: 96,
      draw: (ctx) => {
        ctx.translate(34, 56);
        ctx.scale(2.2, 2.2);
        HEADS[k](ctx, 10, tones);
      },
    })),
  },
  {
    title: 'Headgear (on a human head)',
    items: (Object.keys(GEAR) as GearKind[]).map((k) => ({
      label: k,
      w: 110,
      h: 110,
      draw: (ctx) => {
        ctx.translate(55, 70);
        ctx.scale(2.2, 2.2);
        HEADS.human(ctx, 10, tones);
        GEAR[k](ctx, 10, tones);
      },
    })),
  },
  {
    title: 'Beards and hair',
    items: [
      ...(Object.keys(BEARDS) as BeardKind[]).map((k) => ({
        label: `beard: ${k}`,
        w: 110,
        h: 100,
        draw: (ctx: CanvasRenderingContext2D) => {
          ctx.translate(50, 40);
          ctx.scale(2.2, 2.2);
          HEADS.human(ctx, 10, tones);
          BEARDS[k](ctx, 10, tones.hair);
        },
      })),
      ...(Object.keys(HAIR) as HairKind[]).map((k) => ({
        label: `hair: ${k}`,
        w: 110,
        h: 100,
        draw: (ctx: CanvasRenderingContext2D) => {
          ctx.translate(55, 44);
          ctx.scale(2.2, 2.2);
          HAIR[k].back(ctx, 10, '#2b2a32');
          HEADS.human(ctx, 10, tones);
          HAIR[k].front(ctx, 10, '#2b2a32');
        },
      })),
    ],
  },
  {
    title: 'Weapons',
    items: (Object.keys(WEAPONS) as WeaponKind[]).map((k) => ({
      label: k,
      w: 96,
      h: 150,
      draw: (ctx) => {
        ctx.translate(48, 112);
        ctx.scale(1.3, 1.3);
        WEAPONS[k](ctx, tones);
      },
    })),
  },
  {
    title: 'Shields and offhand',
    items: (Object.keys(OFFHAND) as OffhandKind[]).map((k) => ({
      label: k,
      w: 116,
      h: 160,
      draw: mannequin({ drawOffhand: (ctx, sk) => OFFHAND[k](ctx, sk, tones) }),
    })),
  },
  {
    title: 'Clothing',
    items: (Object.keys(BODY) as BodyKind[]).map((k) => ({
      label: k,
      w: 116,
      h: 160,
      draw: mannequin({ drawBody: (ctx, sk) => BODY[k](ctx, sk, tones) }),
    })),
  },
  {
    title: 'Behind the body',
    items: (Object.keys(BEHIND) as BehindKind[]).map((k) => ({
      label: k,
      w: 116,
      h: 160,
      draw: mannequin({ drawBehind: (ctx, sk) => BEHIND[k](ctx, sk, tones) }),
    })),
  },
];

for (const group of catalogue) {
  const section = document.createElement('div');
  section.className = 'group';
  section.innerHTML = `<h3>${group.title}</h3>`;
  const row = document.createElement('div');
  row.className = 'row';
  for (const item of group.items) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    const canvas = document.createElement('canvas');
    const ctx = hiDpi(canvas, item.w ?? 110, item.h ?? 110);
    ctx.save();
    item.draw(ctx);
    ctx.restore();
    const label = document.createElement('div');
    label.textContent = item.label;
    cell.append(canvas, label);
    row.append(cell);
  }
  section.append(row);
  partsHost.append(section);
}
