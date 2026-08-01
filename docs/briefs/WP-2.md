# WP-2 — Sim core: targeting, combat, win/lose

**Model tier: mid.**

## Goal

Make the lane battler actually fight. Units currently walk in a straight line and ignore each other.
You add targeting, attack cooldowns, damage application, death, and win/lose detection — applying the
relational modifiers produced by WP-1.

## You own (write only these)

- `src/sim/world.ts` — replace the stub wholesale
- `src/sim/combat.ts` — replace the stub wholesale
- `tests/combat.test.ts` — new file

`src/sim/types.ts` and `src/sim/constants.ts` are **FROZEN**. `src/sim/relations.ts` belongs to WP-1
and is being written in parallel — **import from it, never edit it.** Its current stub returns `[]`,
which is the correct no-relations baseline for your tests.

## Tech stack contract (non-negotiable)

- **TypeScript 7.x**, `strict: true`, ESM, `verbatimModuleSyntax: true` — type-only imports MUST use
  `import type { ... }`.
- **Vite 8 / Vitest 4. Zero runtime dependencies.**
- **`src/sim/` is pure.** No DOM, no canvas, no `Date.now()`, no `Math.random()` — randomness comes
  from the injected `Rng`.
- **No classes in `src/sim/`.** Plain objects and free functions only.
- **All time values are SECONDS.** Positions are world-space floats.
- **No `any`, no non-null assertions (`!`), no `@ts-ignore`.** `noUnusedLocals` /
  `noUnusedParameters` are on.
- Every exported symbol gets a one-line JSDoc. Prettier defaults, 100 columns.
- Implementations MUST be typed with the frozen signature aliases, e.g.
  `export const tickWorld: TickWorld = (world, dt, graph, deities, rng) => { ... };`

## Frozen types you code against

```ts
export type Side = 'player' | 'enemy';

export interface Unit {
  id: number; readonly deityId: DeityId; readonly side: Side;
  x: number; hp: number; readonly maxHp: number;
  cooldown: number;              // seconds until next attack
  targetId: number | null; readonly isBase: boolean;
}

export type SimEvent =
  | { readonly kind: 'hit'; readonly attackerId: number; readonly defenderId: number;
      readonly damage: number; readonly modifiers: readonly ModifierName[] }
  | { readonly kind: 'death'; readonly unitId: number }
  | { readonly kind: 'spawn'; readonly unitId: number };

export type Outcome = 'ongoing' | 'victory' | 'defeat';

export interface World {
  time: number; units: Unit[];
  faith: number; faithMax: number; faithRegen: number;
  nextUnitId: number; outcome: Outcome; events: SimEvent[];
}

export interface Modifier {
  readonly name: ModifierName; readonly damageMult: number; readonly attackSpeedMult: number;
  readonly armorMult: number; readonly armorPen: boolean; readonly suppress: boolean;
  readonly color: string;
}

export type CreateWorld = (stage: Stage, deities: DeityIndex) => World;
export type SpawnUnit = (world: World, deity: Deity, side: Side) => Unit;
export type TickWorld = (
  world: World, dt: number, graph: RelationGraph, deities: DeityIndex, rng: Rng,
) => void;
```

Available from WP-1's `src/sim/relations.ts`:
```ts
resolveCombat(attacker: Deity, defender: Deity, graph: RelationGraph): Modifier[]
resolveAuras(subject: Deity, nearbyAllies: readonly Deity[], fieldAllies: readonly Deity[],
             graph: RelationGraph): Modifier[]
combineModifiers(mods: readonly Modifier[]):
  { damageMult: number; attackSpeedMult: number; armorMult: number;
    armorPen: boolean; suppress: boolean }
```

From `src/sim/constants.ts` (frozen): `LANE_LENGTH = 1200`, `TICK_DT = 1/60`, `AURA_RADIUS = 120`,
`PLAYER_BASE_X = 40`, `ENEMY_BASE_X = 1160`, `MAX_DAMAGE_MULT = 3`.

## Required behaviour

**Movement.** Player units move toward +x, enemy units toward −x, at `deity.speed` world units per
second. Bases never move. A unit that has a target in range stops moving.

**Targeting.** Each tick, a unit targets the **nearest living enemy unit whose distance along the
lane is ≤ its `range`**. Bases are valid targets. Prefer the nearest; break ties by lowest `id` so
behaviour is deterministic. Clear `targetId` when the target dies or leaves range.

**Attacking.** `cooldown` counts down by `dt`. When a unit has a target in range and
`cooldown <= 0`, it attacks and resets `cooldown` to `deity.attackInterval / attackSpeedMult`.

**Applying relations.** For each attack:
1. `combat = resolveCombat(attackerDeity, defenderDeity, graph)`
2. `auras = resolveAuras(attackerDeity, nearbyAllies, fieldAllies, graph)` — `nearbyAllies` are
   allied units within `AURA_RADIUS` world units, excluding the attacker itself
3. `combined = combineModifiers([...combat, ...auras])`
4. If `combined.suppress`, the attacker does **not** attack and does **not** move this tick (Entranced)
5. `raw = deity.damage * combined.damageMult`
6. `armor = combined.armorPen ? 0 : defenderDeity.armor * (defender's own armorMult)`
7. `damage = Math.max(1, raw - armor)` — an attack always does at least 1
8. Subtract from `defender.hp`, push a `'hit'` event including every modifier name that fired

**Death.** At `hp <= 0` a non-base unit is removed and a `'death'` event pushed. Remove after the
iteration, never mutate the array mid-loop.

**Win/lose.** Enemy base at 0 → `outcome = 'victory'`. Player base at 0 → `outcome = 'defeat'`. Once
not `'ongoing'`, `tickWorld` becomes a no-op except for advancing nothing — freeze the battle.

**Do not** clear `world.events`; `main.ts` drains it after rendering.

## Hard rules

1. **Determinism is mandatory.** Same seed and same inputs must produce byte-identical state. No
   `Math.random()`, no `Date.now()`, no dependence on object iteration order.
2. `tickWorld` advances `world.time` by `dt` and regenerates faith by `faithRegen * dt`, clamped to
   `faithMax`. This already works in the stub — preserve it.
3. Keep `createWorld` and `spawnUnit` behaviour compatible with the existing stub: two bases at
   `PLAYER_BASE_X` / `ENEMY_BASE_X` with `isBase: true`, and `spawnUnit` pushing a `'spawn'` event.
   `tests/scaffold.test.ts` asserts this and **must stay green.**

## Tests — `tests/combat.test.ts`

Build small hand-made fixtures; **do not import `src/data/greek.ts`** (written in parallel by WP-3).
Cover: a unit stops and attacks when in range; damage reduced by armor; minimum 1 damage vs high
armor; cooldown respects `attackInterval`; a unit dies and is removed exactly once; base destruction
sets `victory` / `defeat`; a suppressed attacker neither attacks nor moves; two identical runs from
the same seed produce identical state.

## Acceptance criteria

- `npx tsc --noEmit` clean.
- `npm test` green, **including `tests/scaffold.test.ts` and any WP-1 tests present.**
- No file outside your three touched.

## Report back

Return the **complete contents** of all three files in separate code blocks labelled with their
paths. Do not abbreviate. If something seems to require changing a frozen file, stop and say so.
