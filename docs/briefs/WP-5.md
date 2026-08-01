# WP-5 — Relational VFX (the visibility layer)

**Model tier: mid, but this one needs taste.**

## Goal

Make the relational engine *visible*. This is the most important non-engine file in the project:
**a modifier the player cannot see does not exist.** Right now Cronus can deal 1.5× damage to Zeus
and nothing on screen says why. You fix that.

Three things to build: **tethers** between related units, **floating proc tags** when a modifier
fires, and **damage numbers** tinted by the dominant modifier.

## You own (write only this)

- `src/render/effects.ts` — replace the stub wholesale, keeping the `drawEffects` export

`src/render/draw.ts` belongs to WP-4 and runs **before** you on the same context — do not draw units,
bases or health bars. `src/sim/*` is off limits; `types.ts` / `constants.ts` are **FROZEN**.

## Tech stack contract (non-negotiable)

- **TypeScript 7.x**, `strict: true`, ESM, `verbatimModuleSyntax: true` — type-only imports MUST use
  `import type { ... }`.
- **Zero runtime dependencies.** Canvas 2D only — no tweening or animation libraries.
- **No `any`, no non-null assertions (`!`), no `@ts-ignore`.** `noUnusedLocals` /
  `noUnusedParameters` are on.
- Every exported symbol gets a one-line JSDoc. Prettier defaults, 100 columns.
- Implementation MUST be typed with the frozen alias:
  `export const drawEffects: DrawEffects = (ctx, world, deities, graph, dt) => { ... };`

## Frozen contract

```ts
export type DrawEffects = (
  ctx: CanvasRenderingContext2D,
  world: World,
  deities: DeityIndex,
  graph: RelationGraph,
  dt: number,            // REAL elapsed seconds this frame (not the fixed sim step)
) => void;

export type SimEvent =
  | { readonly kind: 'hit'; readonly attackerId: number; readonly defenderId: number;
      readonly damage: number; readonly modifiers: readonly ModifierName[] }
  | { readonly kind: 'death'; readonly unitId: number }
  | { readonly kind: 'spawn'; readonly unitId: number };

export type ModifierName =
  | 'Reluctance' | 'Filicide' | 'Usurpation' | 'Rivalry' | 'Entranced'
  | 'Vengeance' | 'Bound' | 'Wrath' | 'Defiance'
  | 'Blessed' | 'Kinship' | 'Devoted' | 'Jealousy' | 'Resented';
```

Import from WP-4: `import { worldToScreen } from './draw';`
Import from WP-1: `resolveCombat(attacker, defender, graph): Modifier[]`
From `src/sim/constants.ts` (frozen): `MODIFIER_COLORS: Readonly<Record<ModifierName, string>>`,
`LANE_Y = 400`, `CANVAS_WIDTH = 960`, `CANVAS_HEIGHT = 540`, `AURA_RADIUS = 120`.

## What to build

**1. Tethers.** Each frame, for pairs of on-screen units with an active relation, draw a line between
them coloured by `MODIFIER_COLORS[name]`. You compute these yourself by calling `resolveCombat` on
opposing pairs that are near each other — it is pure and cheap. Tethers should read as *connections*,
not clutter: curve them, keep them thin, fade with distance, and cap how many draw at once.

**2. Floating proc tags.** On each `'hit'` event carrying modifiers, spawn a short-lived text label
above the attacker — `FILICIDE`, `USURPATION`, `ENTRANCED` — in that modifier's colour. Rise and fade
over roughly 0.8–1.2 s. Uppercase, compact, legible against a dark background.

**3. Damage numbers.** On each `'hit'` event, float the damage value above the *defender*, tinted by
the dominant modifier's colour (white/neutral when no modifier fired). Bigger number = bigger text,
so a Filicide crit reads instantly.

## Animation state

`drawEffects` is called once per frame and owns its animation state in module scope — a list of live
particles that you advance by `dt` and cull when expired. That is the one acceptable piece of mutable
module state in the codebase, because it is presentation-only and never feeds back into the sim.

## Hard rules

1. **Never mutate `world`.** Read `world.events` but do **not** clear it — `main.ts` drains it after
   you run.
2. **`dt` is real frame time, not the sim step.** Animations must be framerate-independent: multiply
   by `dt`, never assume 60 fps.
3. **Never call `Math.random()` for anything that must stay stable frame to frame.** Random jitter
   chosen *once* when a particle spawns is fine; per-frame randomness will shimmer.
4. **Legibility beats spectacle.** If a battle has thirty units, the screen must not become soup. Cap
   concurrent tethers and particles, and prefer showing the strongest few relations over all of them.
5. Bases have `deityId` values not present in `deities` — `deities.get(...)` returns `undefined`.
   Handle it without a non-null assertion.
6. Stay inside `CANVAS_WIDTH` × `CANVAS_HEIGHT`; clamp tags near the edges so text isn't cut off.

## Acceptance criteria

- `npx tsc --noEmit` clean.
- `npm test` green (`tests/scaffold.test.ts` must not break).
- With WP-1/WP-2/WP-3 integrated, a battle visibly shows: a tether between Cronus and Zeus, a
  `FILICIDE` tag on Cronus's hit, `USURPATION` on Zeus's reply, and a pink `ENTRANCED` tether between
  Ares and Aphrodite while both stand still.
- No file outside `src/render/effects.ts` touched.

## Report back

Return the **complete contents** of `src/render/effects.ts` in one code block. Do not abbreviate.
