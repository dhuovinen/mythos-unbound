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

**Phase 0 and Phase 1: complete.** All 8 work packages done. 54 tests passing, `tsc --noEmit` clean.

| WP | Deliverable | Status |
|---|---|---|
| WP-1 | Relational engine | done |
| WP-2 | Sim core (targeting, damage, win/lose) | done |
| WP-3 | Greek roster — 22 units, ~45 edges | done |
| WP-4 | Renderer, Style C-B palette | done |
| WP-5 | Relational VFX (tethers, proc tags, damage numbers) | done |
| WP-6 | HUD | done |
| WP-7 | Art concept boards | done — **Style C-B chosen** |
| WP-8 | Scripted showcase stage | done and tuned |

The game is playable end to end, and a headless playthrough fires **all 14 relational modifiers**
(asserted in `tests/integration.test.ts`). Press **?** in-game for the codex: how to play, both
modifier tables, and all 22 units with their relationships — all generated from live game data.

**Phase 2 has started.** A rule-based engine (`src/sim/advisor.ts`) reads the board and ranks what
to summon, and it drives two things at once: the **opponent's** choices, and the **strategy
consultant** panel that explains the board to you. The advice you read is literally the reasoning
you are playing against.

The consultant speaks qualitatively — its prose never contains a number (asserted by test). The
figures behind every claim ride along separately and are appended only when *Quantify the
consultant's advice* is switched on in the admin panel (gear icon), so turning it on annotates the
same sentences rather than rewriting them.

Known open items:
- **Art:** Style C-B chosen, but no production sprites exist — `src/render/draw.ts` draws
  placeholder geometry in the C-B palette. Brief for the 22 production sprites is
  `docs/briefs/WP-9.md`, not yet dispatched.
- **Kinship is currently a net liability — the biggest open balance problem.** The first
  instant-resolve run produced a Defeat in which **both sides ended with a negative relational
  swing** (player −425, opponent −30) across 368 attacks, 68% of which were shaped by kinship.
  The penalties simply outweigh the bonuses:

  | Cost | | Gain | |
  |---|---|---|---|
  | Entranced (opponent) | −1056 over 16 refused attacks | Kinship | +569 |
  | Reluctance (opponent) | −342 | Blessed | +268 |
  | Reluctance (player) | −332 | Rivalry | +224 |
  | | | Usurpation | +132 |

  Entranced is by far the most violent number in the game: refusing an attack forfeits its entire
  value, so a single lover pairing swung more than every bonus the opponent earned combined.
  Reluctance at ×0.6 is likewise a bigger effect than Usurpation at ×1.6.

  As it stands, "bring family" is a trap — which inverts the intended design. Worth rebalancing
  before adding more content: either soften Reluctance and Entranced, or strengthen the bonuses.

- **Phase 2 balance notes** (found while tuning, not yet addressed):
  - *Titans are immune to chaff.* Damage floors at `max(1, raw - armor)`, so a 12-damage Hoplite
    does exactly 1 damage to Cronus's 24 armour and 2800 HP. This is what turns a front line into
    a permanent wall.
  - *Entranced is congestion-fragile.* It needs the two lovers to be each other's **nearest**
    enemy, so it fires with a lean lane and stops firing when the player spams filler.
- ~~Port 3033 provisional~~ — **resolved 2026-08-01**, formally reserved with branding metadata.
