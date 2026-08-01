# NOTES

## What this is

**Theomachy** (working title) — a browser lane-battler where mythological units change their
behaviour based on their *genealogical relationship* to the units they face. Cronus deals bonus
damage to his own children; Zeus deals bonus damage back to his father; Ares and Aphrodite refuse
to fight each other. Relations only resolve within a pantheon, so fighting cross-pantheon
deliberately switches the whole engine off.

Full design and work breakdown: `~/.claude/plans/pure-percolating-lovelace.md`.
Agent briefs for distributed work: `docs/briefs/`.

## How to run

```bash
npm run dev
```

Then open **http://localhost:3033** (port reserved for this project in `~/Projects/app-registry`).

Other commands:

```bash
npm test          # vitest, sim layer only
npm run typecheck # tsc --noEmit
npm run build     # typecheck + vite build
```

Art concept boards (WP-7 output, 9 renders across 3 styles) live in `art/concepts/` and are
served at http://localhost:3033/art/concepts/ while the dev server is running.

## Status

**Phase 0 (WP-0, scaffold + frozen contracts): complete.** Vite + TypeScript + Vitest, fixed
60 Hz timestep loop, `src/sim/types.ts` frozen as the contract all work packages code against.

Everything under `src/` except `main.ts`, `sim/types.ts`, `sim/constants.ts` and `sim/rng.ts` is a
deliberately crude **stub** awaiting its work package — the game currently walks units down a lane
and does not fight. See `docs/briefs/` for what each WP replaces.

**Phase 1 (WP-1…WP-8): WP-7 delivered, rest not started.**

Known open items:
- Port 3033 is **provisional** — the app-registry reservation is blocked by pre-existing validation
  errors in an unrelated `chrome-copilot1` entry.
- Art direction undecided; the three styles are awaiting the 64 px readability comparison.
