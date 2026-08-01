# WP-8 — Scripted showcase stage

**Model tier: light.** Small file, but it is the project's demo — it decides what a first-time viewer
actually sees.

## Goal

Author the deterministic scripted battle that demonstrates **every relational modifier in turn**.
There is no AI in Phase 1 — enemy spawns come from a fixed timeline, so the showcase is reproducible
and can be verified frame by frame.

## You own (write only this)

- `src/data/stages.ts` — replace the stub wholesale, keeping the `SHOWCASE_STAGE` export

Everything else is off limits. `src/sim/types.ts` is **FROZEN**. `src/data/greek.ts` is being written
in parallel by WP-3 — **do not edit or import it**; just reference deity ids as strings.

## Tech stack contract (non-negotiable)

- **TypeScript 7.x**, `strict: true`, ESM, `verbatimModuleSyntax: true` — type-only imports MUST use
  `import type { ... }`.
- **Zero runtime dependencies.** Pure data — no functions, no computed values, no loops generating waves.
- **All time values are SECONDS.**
- **No `any`, no non-null assertions (`!`), no `@ts-ignore`.**
- Every exported symbol gets a one-line JSDoc. Prettier defaults, 100 columns.

## Frozen contract

```ts
/** One scripted spawn on the battle timeline. */
export interface StageWave {
  readonly at: number;              // battle time in seconds
  readonly deityId: DeityId;
  readonly side: Side;              // 'player' | 'enemy'
}

export interface Stage {
  readonly id: string;
  readonly name: string;
  readonly playerDeck: readonly DeityId[];   // what the player may summon, in HUD order
  readonly waves: readonly StageWave[];
  readonly startingFaith: number;
  readonly faithMax: number;
  readonly faithRegen: number;               // per second
  readonly playerBaseHp: number;
  readonly enemyBaseHp: number;
}

export const SHOWCASE_STAGE: Stage = { /* ... */ };
```

## Available deity ids (from WP-3's roster)

`hoplite`, `satyr`, `harpy`, `heracles`, `perseus`, `achilles`, `asclepius`, `orpheus`, `dionysus`,
`aeneas`, `zeus`, `hera`, `poseidon`, `hades`, `athena`, `ares`, `aphrodite`, `hephaestus`, `apollo`,
`artemis`, `cronus`, `typhon`.

## The showcase must demonstrate, in this order

Pace it so each beat is legible before the next arrives — roughly 12–20 s apart, escalating.

| Beat | Setup | What the viewer should see |
|---|---|---|
| 1 | Plain chaff on both sides (`hoplite`, `satyr`) | Baseline combat, no relations — establishes the contrast |
| 2 | Enemy `hera`, player has `heracles` | `WRATH` and `DEFIANCE` |
| 3 | Enemy `apollo`, player has `artemis` | `RIVALRY` between twins |
| 4 | Enemy `zeus`, player has `asclepius` | `VENGEANCE`, armour-piercing |
| 5 | Enemy `ares`, player has `aphrodite` | `ENTRANCED` — both halt, nobody attacks |
| 6 | Player fields `aphrodite` + `hephaestus` + `ares` together | `JEALOUSY` debuffing Aphrodite |
| 7 | Enemy `cronus` boss wave, player has `zeus` | `FILICIDE` and `USURPATION` in one pairing |

**The player deck must contain the units each beat requires**, since the player summons them — the
`waves` list only controls the *enemy* side (plus any scripted player reinforcements you want).

## Tuning guidance

- `faithRegen` and `startingFaith` must let the player actually afford the beat-appropriate unit
  around the time that beat arrives. Work out the cumulative faith curve — if Zeus costs 320 and
  regen is 22/s, he is affordable around 15 s in from a standing start.
- Base HP should let the battle run long enough to see all seven beats — do not let the enemy base
  fall at beat 3.
- Keep it winnable but not trivial. The point is demonstrating the engine, not a hard fight.

## Hard rules

1. **Every `deityId` must exist in the roster list above.** A typo silently spawns nothing.
2. `waves` must be authored in ascending `at` order for readability (the loop sorts anyway).
3. **No randomness whatsoever.** This stage is the reproducible verification fixture.
4. `playerDeck` order is HUD order and maps to keyboard shortcuts `1`–`9`, so keep it to nine or fewer
   and put the early-beat units first.

## Acceptance criteria

- `npx tsc --noEmit` clean.
- `npm test` green — `tests/scaffold.test.ts` reads `SHOWCASE_STAGE` and uses `hoplite`, so
  **`hoplite` must remain in `playerDeck`.**
- No file outside `src/data/stages.ts` touched.

## Report back

Return the **complete contents** of `src/data/stages.ts` in one code block, plus a short note on the
faith curve maths — which beat is affordable at which time — so the integrator can sanity-check the
pacing. Do not abbreviate.
