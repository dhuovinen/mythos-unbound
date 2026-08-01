# WP-4 — Renderer

**Model tier: mid.**

## Goal

Draw the battlefield: lane, bases, units, health. The current stub draws flat circles and rectangles
— make it legible and readable at a glance, with clear visual separation between the four unit tiers.

## You own (write only this)

- `src/render/draw.ts` — replace the stub wholesale, keeping the `drawWorld` and `worldToScreen` exports

`src/render/effects.ts` belongs to WP-5 and draws **on top of you** — do not draw tethers, proc tags
or damage numbers. `src/sim/*` is off limits and `types.ts` / `constants.ts` are **FROZEN**.

## Tech stack contract (non-negotiable)

- **TypeScript 7.x**, `strict: true`, ESM, `verbatimModuleSyntax: true` — type-only imports MUST use
  `import type { ... }`.
- **Zero runtime dependencies.** Canvas 2D only — no rendering libraries.
- **No `any`, no non-null assertions (`!`), no `@ts-ignore`.** `noUnusedLocals` /
  `noUnusedParameters` are on.
- Every exported symbol gets a one-line JSDoc. Prettier defaults, 100 columns.
- Implementation MUST be typed with the frozen alias:
  `export const drawWorld: DrawWorld = (ctx, world, deities) => { ... };`

## Frozen contract

```ts
export type DrawWorld = (
  ctx: CanvasRenderingContext2D, world: World, deities: DeityIndex,
) => void;

export interface Unit {
  id: number; readonly deityId: DeityId; readonly side: Side;   // 'player' | 'enemy'
  x: number;                      // world space, 0..1200
  hp: number; readonly maxHp: number;
  cooldown: number; targetId: number | null; readonly isBase: boolean;
}

export interface Deity {
  readonly id: DeityId; readonly name: string; readonly pantheon: Pantheon;
  readonly tier: Tier;            // 'chaff' | 'demigod' | 'god' | 'titan'
  readonly cost: number; readonly hp: number; readonly damage: number;
  readonly attackInterval: number; readonly range: number; readonly speed: number;
  readonly armor: number; readonly traits: readonly Trait[];
}
```

From `src/sim/constants.ts` (frozen): `LANE_LENGTH = 1200`, `CANVAS_WIDTH = 960`,
`CANVAS_HEIGHT = 540`, `LANE_Y = 400`, `PLAYER_BASE_X = 40`, `ENEMY_BASE_X = 1160`.

Keep exporting the existing helper, since WP-5 imports it:
```ts
/** World-space x to screen-space x. */
export function worldToScreen(x: number): number;
```

## Required behaviour

- Clear the canvas, then draw: background/ground, bases, units, health bars — in that order.
- **Tier must be visually obvious at a glance.** Size is the primary signal: chaff smallest, titans
  largest. Bases are structures, clearly not units.
- **Side must be unmistakable.** Player units read cyan-ish, enemy units magenta-ish (current
  placeholders `#4FE3E0` / `#E34FA8`). Player base is on the left, enemy on the right.
- Health bars above each unit, and a larger one for each base. Colour shifts as health drops.
- Units overlap when stacked on the lane — handle it so a clump is still readable (a subtle vertical
  jitter derived deterministically from `unit.id` is a reasonable approach; do **not** use
  `Math.random()`, since a jitter that changes every frame will shimmer).
- Show unit identity somehow — a letter, a glyph, or a distinct silhouette per tier. Art assets do
  not exist yet, so this is placeholder geometry that should still be pleasant to look at.

## Hard rules

1. **Never mutate `world`.** The renderer is read-only. Mutating simulation state from the draw layer
   breaks determinism.
2. **Never call `Math.random()`** — anything varying per unit must derive deterministically from
   `unit.id`, or it will flicker.
3. **Do not read or drain `world.events`** — that is WP-5's job, and `main.ts` clears it after both
   draws.
4. Bases have `deityId` values (`'player-base'`, `'enemy-base'`) that are **not** in `deities` —
   `deities.get(...)` returns `undefined` for them. Handle it without a non-null assertion.
5. Stay inside `CANVAS_WIDTH` × `CANVAS_HEIGHT`.

## Acceptance criteria

- `npx tsc --noEmit` clean.
- `npm test` green (`tests/scaffold.test.ts` must not break).
- `npm run dev` renders a readable battlefield at http://localhost:3033.
- No file outside `src/render/draw.ts` touched.

## Report back

Return the **complete contents** of `src/render/draw.ts` in one code block. Do not abbreviate.
