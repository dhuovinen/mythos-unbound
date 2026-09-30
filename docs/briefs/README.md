# Agent briefs — Mythos Unbound Phase 1

Eight work packages. **WP-0 (scaffold + frozen contracts) is done.** WP-1 through WP-8 are fully
parallel: seven agents can run at once with zero file overlap. WP-7 (art) is already delivered.

Each brief is **self-contained** — paste it into any model with no repo access and it has everything
it needs. Deliverables come back as full file contents; the integrator merges them.

| WP | Deliverable | Owns (exclusive) | Model tier | Status |
|---|---|---|---|---|
| WP-1 | Relational engine + tests | `src/sim/relations.ts`, `tests/relations.test.ts` | **heavy** | not started |
| WP-2 | Sim core: loop, targeting, damage | `src/sim/world.ts`, `src/sim/combat.ts`, `tests/combat.test.ts` | mid | not started |
| WP-3 | Pantheon data: 22 units, ~60 edges | `src/data/greek.ts` | mid | not started |
| WP-4 | Renderer | `src/render/draw.ts` | mid | not started |
| WP-5 | Relational VFX | `src/render/effects.ts` | mid | not started |
| WP-6 | HUD | `src/ui/hud.ts` | light | not started |
| WP-7 | Art concept boards | `art/concepts/` | image | **delivered** |
| WP-8 | Scripted showcase wave | `src/data/stages.ts` | light | not started |

Concrete Claude mapping: heavy = Opus 5, mid = Sonnet 5, light = Haiku 4.5.

## Files nobody but the integrator may touch

`src/sim/types.ts`, `src/sim/constants.ts`, `src/sim/rng.ts`, `src/main.ts`, `index.html`,
`tests/scaffold.test.ts`, `package.json`, `tsconfig.json`, `vite.config.ts`.

`tests/scaffold.test.ts` is the canary: it must stay green as every stub is replaced. If a work
package breaks it, that package violated the contract.

## Dependency notes

- **WP-2 does not wait for WP-1.** It calls `resolveCombat`/`resolveAuras` against the frozen
  signatures. The current stub returns `[]`, which is the correct no-relations baseline to test against.
- **WP-4 and WP-5 both draw**, but `drawWorld` runs first and `drawEffects` second, on the same
  context. Neither may mutate the world.
- **WP-3 and WP-8 are pure data** and depend only on the schema.
