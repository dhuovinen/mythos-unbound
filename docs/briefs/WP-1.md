# WP-1 — The relational engine

**Model tier: heavy.** This is the highest-value, highest-subtlety code in the project. The entire
game concept is this file.

## Goal

Implement the resolver that reads a genealogy graph and returns the modifiers active between two
units. Mythological units change their behaviour based on how they are *related* to the units they
face — a father hesitates against his son, a son fights his father harder, lovers refuse to fight
at all.

## You own (write only these)

- `src/sim/relations.ts` — replace the stub wholesale
- `tests/relations.test.ts` — new file

Everything else is off limits. `src/sim/types.ts` and `src/sim/constants.ts` are **FROZEN** — if you
believe one needs to change, stop and report instead of editing.

## Tech stack contract (non-negotiable)

- **TypeScript 7.x**, `strict: true`, ESM, `verbatimModuleSyntax: true` — type-only imports MUST use
  `import type { ... }`.
- **Vite 8 / Vitest 4. Zero runtime dependencies.** No lodash, no math libs, no ECS framework. If the
  task seems to need one, it doesn't — stop and report.
- **`src/sim/` is pure.** No DOM, no canvas, no `Date.now()`, no `Math.random()`.
- **No classes in `src/sim/`.** Plain objects and free functions only.
- **All time values are SECONDS**, never milliseconds.
- **No `any`, no non-null assertions (`!`), no `@ts-ignore`.** `noUnusedLocals` and
  `noUnusedParameters` are enabled.
- Naming: `camelCase` values, `PascalCase` types, `SCREAMING_SNAKE_CASE` module constants.
- Every exported symbol gets a one-line JSDoc.
- Prettier defaults, 100 columns, single quotes, semicolons.
- Implementations MUST be typed with the frozen signature aliases, e.g.
  `export const resolveCombat: ResolveCombat = (attacker, defender, graph) => { ... };`

## Frozen types you code against (already exist in `src/sim/types.ts`)

```ts
export type DeityId = string;
export type Pantheon = 'greek' | 'norse';
export type Tier = 'chaff' | 'demigod' | 'god' | 'titan';
export type Trait = 'devourer' | 'healer' | 'charmer' | 'shielder';

export type RelationKind =
  | 'parent' | 'sibling' | 'spouse' | 'lover' | 'slain_by' | 'persecutes' | 'rival';

export interface Edge { readonly from: DeityId; readonly to: DeityId; readonly kind: RelationKind; }

export interface Deity {
  readonly id: DeityId; readonly name: string; readonly pantheon: Pantheon; readonly tier: Tier;
  readonly cost: number; readonly hp: number; readonly damage: number;
  readonly attackInterval: number; readonly range: number; readonly speed: number;
  readonly armor: number; readonly traits: readonly Trait[];
}

export interface RelationGraph {
  readonly edges: readonly Edge[];
  /** Key is `${from}|${to}`. Includes derived inverse entries for asymmetric kinds. */
  readonly byPair: ReadonlyMap<string, readonly Edge[]>;
}

export type ModifierName =
  | 'Reluctance' | 'Filicide' | 'Usurpation' | 'Rivalry' | 'Entranced'
  | 'Vengeance' | 'Bound' | 'Wrath' | 'Defiance'
  | 'Blessed' | 'Kinship' | 'Devoted' | 'Jealousy' | 'Resented';

export interface Modifier {
  readonly name: ModifierName;
  readonly damageMult: number;       // neutral = 1
  readonly attackSpeedMult: number;  // neutral = 1, >1 attacks more often
  readonly armorMult: number;        // neutral = 1
  readonly armorPen: boolean;
  readonly suppress: boolean;        // attacker will not attack, both halt
  readonly color: string;            // take from MODIFIER_COLORS
}

export type BuildGraph = (edges: readonly Edge[]) => RelationGraph;
export type ResolveCombat = (attacker: Deity, defender: Deity, graph: RelationGraph) => Modifier[];
export type ResolveAuras = (
  subject: Deity,
  nearbyAllies: readonly Deity[],
  fieldAllies: readonly Deity[],
  graph: RelationGraph,
) => Modifier[];
```

From `src/sim/constants.ts` (frozen): `AURA_RADIUS = 120`, `MAX_DAMAGE_MULT = 3`, and
`MODIFIER_COLORS: Readonly<Record<ModifierName, string>>` — **use it for every `Modifier.color`;
never hardcode a hex.**

## Edge direction rules

Symmetric kinds are stored **once** and must be treated as bidirectional: `sibling`, `spouse`,
`lover`, `rival`.

Asymmetric kinds are stored in exactly this direction, and their inverses are **derived, never
stored**:

| Stored | Means | Derived inverse |
|---|---|---|
| `parent` from→to | *from* is the parent of *to* | *to* is the child of *from* |
| `slain_by` from→to | *from* was slain by *to* | *from* slew *to* |
| `persecutes` from→to | *from* persecutes *to* | *to* is persecuted by *from* |

`buildGraph` must populate `byPair` such that lookups work in **both** directions.

## Combat modifiers — `resolveCombat(attacker A, defender B, graph)`

Fires when A attacks an **enemy** B. Returns modifiers that apply **to A**.

| Condition | Modifier | Effect |
|---|---|---|
| A is parent of B, **and A has trait `devourer`** | `Filicide` | damageMult 1.5 |
| A is parent of B (no `devourer`) | `Reluctance` | damageMult 0.6 |
| A is child of B | `Usurpation` | damageMult 1.6 |
| A is sibling of B **or** A is rival of B | `Rivalry` | attackSpeedMult 1.2 |
| A is lover of B | `Entranced` | suppress true |
| A was slain by B | `Vengeance` | damageMult 2.0, armorPen true |
| A is spouse of B | `Bound` | damageMult 0.75, armorMult 1.25 |
| A persecutes B | `Wrath` | damageMult 1.5 |
| B persecutes A | `Defiance` | damageMult 1.3 |

## Aura modifiers — `resolveAuras(subject S, nearbyAllies, fieldAllies, graph)`

Fires between **allies**. Returns modifiers that apply **to S**. `nearbyAllies` are within
`AURA_RADIUS`; `fieldAllies` is every living ally. Neither list contains S.

| Condition | Modifier | Effect |
|---|---|---|
| A ∈ nearbyAllies is parent of S | `Blessed` | damageMult 1.25 |
| A ∈ nearbyAllies is sibling of S | `Kinship` | armorMult 1.15 |
| A ∈ nearbyAllies is spouse of S | `Devoted` | damageMult 1.1, armorMult 1.1 |
| **S's spouse AND S's lover are both in `fieldAllies`** | `Jealousy` | attackSpeedMult 0.7 |
| A ∈ nearbyAllies persecutes S | `Resented` | attackSpeedMult 0.8 |

**Jealousy detail — read carefully.** The *unfaithful* unit is the one penalised, and it is
**field-wide, not proximity-based**: S is jealous-locked when S has a `spouse` edge to some unit on
the field *and* a `lover` edge to some other unit on the field. Fielding Aphrodite alongside both
Hephaestus (spouse) and Ares (lover) debuffs **Aphrodite**. This is the deckbuilding hook — a
self-imposed constraint that comes straight from the source material.

## Hard rules

1. **Cross-pantheon returns `[]`.** If `attacker.pantheon !== defender.pantheon`, `resolveCombat`
   returns an empty array immediately. Same for auras. This is a core design rule — deliberately
   fighting cross-pantheon switches the entire engine off, which is a real strategic choice.
2. **`devourer` overrides `Reluctance`.** Cronus does not hesitate; he eats his children. A unit with
   the `devourer` trait emits `Filicide` *instead of* `Reluctance`, never both.
3. **At most one modifier per `ModifierName`.** Dedupe — sibling *and* rival both map to `Rivalry`,
   and multiple nearby siblings must not stack `Kinship` five times.
4. **Stacking is multiplicative**, and the caller applies `MAX_DAMAGE_MULT`. Export a helper
   `combineModifiers(mods: readonly Modifier[])` returning
   `{ damageMult, attackSpeedMult, armorMult, armorPen, suppress }` where `damageMult` is the product
   **clamped to `MAX_DAMAGE_MULT`**, `armorPen`/`suppress` are logical ORs.
5. **Determinism.** No `Math.random()`, no iteration-order dependence — given the same inputs, the
   returned array must be identical, including order. Sort deterministically.
6. **`buildGraph` must be efficient**: `resolveCombat` is called for every attacking unit every tick,
   so it must be an O(1) map lookup, not an O(n) scan of the edge list.

## Tests — `tests/relations.test.ts`

Cover, at minimum:
- One case per row of **both** tables above.
- Cross-pantheon returns `[]`.
- Inverse derivation: given only `{from:'cronus', to:'zeus', kind:'parent'}`, Zeus attacking Cronus
  yields `Usurpation` and Cronus attacking Zeus yields `Filicide` (Cronus has `devourer`).
- `devourer` suppresses `Reluctance` entirely.
- Symmetric edges resolve from both directions.
- Dedupe: two nearby siblings yield exactly one `Kinship`.
- `combineModifiers` clamps at `MAX_DAMAGE_MULT`.
- Jealousy requires **both** spouse and lover present; two units alone produce nothing.
- Every returned `Modifier.color` equals the matching `MODIFIER_COLORS` entry.

Build your own small fixture graph inside the test file — **do not import `src/data/greek.ts`**, which
another agent is writing in parallel and which you must not depend on.

## Acceptance criteria

- `npx tsc --noEmit` clean.
- `npm test` green, including the pre-existing `tests/scaffold.test.ts`, which you must not break.
- No file outside your two touched.

## Report back

Return the **complete contents** of both files, in full, in separate code blocks labelled with their
paths. Do not abbreviate or elide. If you hit anything that seems to require changing a frozen file,
stop and say so instead of working around it.
