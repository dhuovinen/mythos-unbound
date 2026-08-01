# WP-6 — HUD

**Model tier: light.** Mechanical, well-specified.

## Goal

Build the player's control surface: a faith meter and a row of summon buttons, one per deity in the
deck. The current stub is unstyled and minimal — make it a real game HUD.

## You own (write only this)

- `src/ui/hud.ts` — replace the stub wholesale, keeping the `mountHud` export

Everything else is off limits. `src/sim/types.ts` is **FROZEN**. You may inject your own `<style>`
element from within this file, but do **not** edit `index.html`.

## Tech stack contract (non-negotiable)

- **TypeScript 7.x**, `strict: true`, ESM, `verbatimModuleSyntax: true` — type-only imports MUST use
  `import type { ... }`.
- **Zero runtime dependencies.** Plain DOM — no React, no template libraries.
- **No `any`, no non-null assertions (`!`), no `@ts-ignore`.** `noUnusedLocals` /
  `noUnusedParameters` are on.
- Every exported symbol gets a one-line JSDoc. Prettier defaults, 100 columns.
- Implementation MUST be typed with the frozen alias:
  `export const mountHud: MountHud = (root, deck, onSummon) => { ... };`

## Frozen contract

```ts
export interface HudHandle {
  /** Called once per rendered frame with current state. */
  update(world: World): void;
}

export type MountHud = (
  root: HTMLElement,
  deck: readonly Deity[],
  onSummon: (deityId: DeityId) => void,
) => HudHandle;

export interface World {
  time: number; units: Unit[];
  faith: number; faithMax: number; faithRegen: number;
  nextUnitId: number;
  outcome: 'ongoing' | 'victory' | 'defeat';
  events: SimEvent[];
}

export interface Deity {
  readonly id: DeityId; readonly name: string; readonly pantheon: Pantheon;
  readonly tier: Tier;             // 'chaff' | 'demigod' | 'god' | 'titan'
  readonly cost: number; readonly hp: number; readonly damage: number;
  readonly attackInterval: number; readonly range: number; readonly speed: number;
  readonly armor: number; readonly traits: readonly Trait[];
}
```

## Required behaviour

- **Faith meter** — a real bar, not just text. Show current/max and fill proportionally. It refills
  continuously, so the animation should feel smooth.
- **One summon card per deck entry**, in deck order, showing name, cost, and tier. Clicking calls
  `onSummon(deity.id)`.
- **Affordability is the core feedback.** A card the player cannot afford must be visibly and
  unambiguously disabled. Better still, show *how close* they are — a fill or progress hint on the
  card itself reads well in this genre.
- **Tier should be visible** on the card (colour, badge, or border), so the deck reads as a cost curve.
- **Keyboard shortcuts**: keys `1`–`9` summon the corresponding deck slot. Bind on `window`, and make
  sure the shortcut respects affordability exactly like a click does.
- **Game over**: when `world.outcome !== 'ongoing'`, disable every card and show the result
  (`VICTORY` / `DEFEAT`) prominently.

## Hard rules

1. **`update(world)` is called every frame (~60×/second).** Do not rebuild DOM nodes inside it —
   create elements once in `mountHud`, keep references, and only mutate text/classes/styles that
   actually changed. Rebuilding per frame will visibly stutter.
2. **Never mutate `world`.** The HUD is read-only; summoning goes exclusively through `onSummon`.
3. `mountHud` may be called more than once on the same root — clear it first (`root.replaceChildren()`).
4. Do not add listeners you cannot clean up; if you bind on `window`, that is acceptable here, but
   keep it to one handler.
5. The page background is dark (`#141010`) with bone text (`#e8dcc4`). Match it.

## Acceptance criteria

- `npx tsc --noEmit` clean.
- `npm test` green (`tests/scaffold.test.ts` must not break).
- `npm run dev` at http://localhost:3033 shows a working faith bar, cards enable as faith accrues,
  clicking and pressing `1` both summon.
- No file outside `src/ui/hud.ts` touched.

## Report back

Return the **complete contents** of `src/ui/hud.ts` in one code block. Do not abbreviate.
