# WP-3 — The Greek roster and genealogy graph

**Model tier: mid.** Research-heavy, logic-light. Mythological accuracy matters as much as balance.

## Goal

Author the 22-unit Greek roster and the genealogy edges connecting them. This is the content that
makes the whole game work — the relational engine is only as interesting as the graph you feed it.

## You own (write only this)

- `src/data/greek.ts` — replace the stub wholesale, keeping both export names

Everything else is off limits. `src/sim/types.ts` is **FROZEN**.

## Tech stack contract (non-negotiable)

- **TypeScript 7.x**, `strict: true`, ESM, `verbatimModuleSyntax: true` — type-only imports MUST use
  `import type { ... }`.
- **Zero runtime dependencies.** Pure data only — no functions, no computed values, no classes.
- **No `any`, no non-null assertions (`!`), no `@ts-ignore`.**
- Every exported symbol gets a one-line JSDoc. Prettier defaults, 100 columns, single quotes.

## Required exports

```ts
import type { Deity, Edge } from '../sim/types';

/** Full Greek roster. */
export const GREEK_DEITIES: readonly Deity[] = [ /* 22 entries */ ];

/** Genealogy edges between Greek roster entries. */
export const GREEK_EDGES: readonly Edge[] = [ /* 40+ entries */ ];
```

```ts
export interface Deity {
  readonly id: DeityId;            // lowercase, no spaces, e.g. 'zeus'
  readonly name: string;
  readonly pantheon: Pantheon;     // 'greek' for every entry here
  readonly tier: Tier;             // 'chaff' | 'demigod' | 'god' | 'titan'
  readonly cost: number;           // faith to summon
  readonly hp: number;
  readonly damage: number;         // per attack, before modifiers
  readonly attackInterval: number; // SECONDS between attacks; lower is faster
  readonly range: number;          // world units (lane is 1200 long)
  readonly speed: number;          // world units per second
  readonly armor: number;          // flat reduction after multipliers
  readonly traits: readonly Trait[];  // 'devourer' | 'healer' | 'charmer' | 'shielder'
}

export interface Edge { readonly from: DeityId; readonly to: DeityId; readonly kind: RelationKind; }
export type RelationKind =
  | 'parent' | 'sibling' | 'spouse' | 'lover' | 'slain_by' | 'persecutes' | 'rival';
```

## The roster (all 22 required)

**Tier 0 — chaff.** Zero relations, deliberately. They teach the baseline so relational procs read as
special.

| id | name | notes |
|---|---|---|
| `hoplite` | Hoplite | Basic melee, the reference unit |
| `satyr` | Satyr | Cheap, fast, weak — swarm |
| `harpy` | Harpy | Fast, fragile, high DPS |

**Tier 1 — demigods.** Cheap-to-mid, each with one or two *loud* relations. Their whole identity is
their parentage.

| id | name | mechanical role |
|---|---|---|
| `heracles` | Heracles | High-HP bruiser. The poster unit for Wrath/Defiance vs Hera |
| `perseus` | Perseus | Balanced mid melee |
| `achilles` | Achilles | Glass cannon — top-of-tier damage, low HP, fast |
| `asclepius` | Asclepius | Support, `healer` trait, low damage; devastating vs Zeus (Vengeance) |
| `orpheus` | Orpheus | `charmer` trait, very low damage, long range |
| `dionysus` | Dionysus | Mid bruiser, `charmer` |
| `aeneas` | Aeneas | Defensive tank, `shielder`, high armor, low damage |

**Tier 2 — gods.** Expensive, dense relation web.

| id | name | notes |
|---|---|---|
| `zeus` | Zeus | Premier damage dealer, the hub of the graph |
| `hera` | Hera | Strong all-round; her presence warps the whole deck |
| `poseidon` | Poseidon | High HP, heavy hitter |
| `hades` | Hades | Slow, tanky, high armor |
| `athena` | Athena | Balanced, high armor, tactical |
| `ares` | Ares | Aggressive, fast attacks, low armor |
| `aphrodite` | Aphrodite | `charmer`, low damage, high cost, support |
| `hephaestus` | Hephaestus | `shielder`, very high armor, slow |
| `apollo` | Apollo | Longest range in the roster |
| `artemis` | Artemis | Long range, fast, fragile |

**Tier 3 — titans and monsters.** Boss-tier.

| id | name | notes |
|---|---|---|
| `cronus` | Cronus | **Must have the `devourer` trait** — it turns Reluctance into Filicide |
| `typhon` | Typhon | Raw stat monster, no family, only a rivalry with Zeus |

## Stat ranges — stay inside these

| tier | cost | hp | damage | attackInterval | range | speed | armor |
|---|---|---|---|---|---|---|---|
| chaff | 25–50 | 90–160 | 8–18 | 0.8–1.4 | 24–34 | 38–60 | 0–3 |
| demigod | 60–140 | 250–600 | 25–60 | 0.9–1.8 | 26–70 | 28–52 | 3–10 |
| god | 180–400 | 700–1400 | 70–150 | 1.4–2.4 | 34–90 | 22–34 | 8–18 |
| titan | 450–650 | 1800–3000 | 180–260 | 2.2–3.0 | 40–60 | 16–22 | 18–26 |

Rules of thumb: **cost should track DPS × effective HP**, not raw stats. Ranged units (Apollo,
Artemis, Orpheus) pay for reach with lower HP. Support units (Asclepius, Aphrodite, Orpheus) have low
`damage` — they earn their slot through traits and auras, not hitting.

## Required edges

Direction matters. `parent` is stored **parent → child**. `slain_by` is stored **victim → killer**.
`persecutes` is stored **persecutor → victim**. Symmetric kinds (`sibling`, `spouse`, `lover`,
`rival`) are stored **once** — the engine handles both directions, so do not duplicate them.

**parent (parent → child)**
- `cronus` → `zeus`, `hera`, `poseidon`, `hades`
- `zeus` → `athena`, `ares`, `apollo`, `artemis`, `heracles`, `perseus`, `dionysus`
- `hera` → `ares`, `hephaestus`
- `apollo` → `asclepius`, `orpheus`
- `aphrodite` → `aeneas`

**sibling** — `zeus`–`poseidon`, `zeus`–`hades`, `poseidon`–`hades`, `zeus`–`hera`,
`apollo`–`artemis`, `ares`–`hephaestus`

**spouse** — `zeus`–`hera`, `aphrodite`–`hephaestus`

**lover** — `ares`–`aphrodite`

**slain_by (victim → killer)** — `asclepius` → `zeus` (Zeus struck him down for raising the dead);
`achilles` → `apollo` (Apollo guided the arrow)

**persecutes (persecutor → victim)** — `hera` → `heracles`, `hera` → `dionysus`

**rival** — `zeus`–`typhon`, `athena`–`ares`, `apollo`–`dionysus`

Add further **historically defensible** edges beyond this list if they enrich the graph — that is
encouraged. Do not invent relationships that aren't in the source material.

## Why these specific edges matter

They guarantee the showcase matchups the game is built to demonstrate:
- **Cronus ↔ Zeus** — Filicide one way, Usurpation the other, in a single pairing
- **Hera ↔ Heracles** — Wrath and Defiance
- **Aphrodite + Hephaestus + Ares** — spouse, lover and Jealousy all at once
- **Asclepius → Zeus** — Vengeance, armour-piercing
- **Apollo ↔ Artemis** — Rivalry between twins

## Hard rules

1. **Every `id` in `GREEK_EDGES` must exist in `GREEK_DEITIES`.** A typo here silently disables a
   relation, which is the worst kind of bug in this project.
2. **Chaff units appear in no edges at all.** This is deliberate design, not an oversight.
3. **Cronus must have `traits: ['devourer']`.**
4. Every `pantheon` is `'greek'`.
5. No duplicate ids; no symmetric edge stored twice in both directions.

## Acceptance criteria

- `npx tsc --noEmit` clean.
- `npm test` green — `tests/scaffold.test.ts` uses `hoplite`, so **that id must keep existing**.
- Exactly 22 entries in `GREEK_DEITIES`; at least 40 in `GREEK_EDGES`.
- No file outside `src/data/greek.ts` touched.

## Report back

Return the **complete contents** of `src/data/greek.ts` in one code block. Do not abbreviate or use
placeholder comments — every one of the 22 entries written out in full.
