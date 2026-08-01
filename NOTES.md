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

Then open **http://localhost:3033** — port reserved for this project in `~/Projects/app-registry`
(frontend-only, `vite-typescript`, registered 2026-08-01).

Other commands:

```bash
npm test          # vitest, sim layer only
npm run typecheck # tsc --noEmit
npm run build     # typecheck + vite build
```

Art concept boards (WP-7 output, 9 renders across 3 styles) live in `art/concepts/` and are
served at http://localhost:3033/art/concepts/ while the dev server is running.

## Status

**Phase 0 (scaffold + frozen contracts): complete.**
**Phase 1: 7 of 8 work packages complete.** 51 tests passing, `tsc --noEmit` clean.

| WP | Deliverable | Status |
|---|---|---|
| WP-1 | Relational engine | done |
| WP-2 | Sim core (targeting, damage, win/lose) | done |
| WP-3 | Greek roster — 22 units, ~45 edges | done |
| WP-4 | Renderer | **stub** — crude placeholder geometry |
| WP-5 | Relational VFX (tethers, proc tags, damage numbers) | done |
| WP-6 | HUD | done |
| WP-7 | Art concept boards | done — **Style C-B chosen** |
| WP-8 | Scripted showcase stage | done, **needs tuning** |

The game is playable: units fight, relations fire, and tethers/proc tags/damage numbers render.

Known open items:
- **The showcase stage looks unwinnable as tuned** — the player base falls around ~40 s, well
  before beats 5–7 (Ares 70 s, Hades 88 s, Cronus 108 s). The flagship Filicide/Usurpation
  pairing has never been seen on screen. This blocks the Phase 1 "is it fun?" verdict.
- **WP-4 is the last stub** — units are barely distinguishable by tier.
- **Art direction: Style C-B "Bold Woodcut (Clean)"** (chosen 2026-07-31). No production-asset
  pipeline exists yet; `src/render/draw.ts` still draws placeholder geometry. Spec in
  `docs/briefs/WP-7.md`.
- ~~Port 3033 provisional~~ — **resolved 2026-08-01.** Port 3033 is now formally reserved in
  `~/Projects/app-registry` with branding metadata and lifecycle commands.
