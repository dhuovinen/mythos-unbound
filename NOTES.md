# NOTES

## What this is

**Mythos Unbound** — a browser lane-battler where mythological units change their
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
npm test          # vitest, simulation, UI geometry and rig coverage
npm run typecheck # tsc --noEmit
npm run build     # typecheck + vite build
```

To inspect generated character art, open the gear menu and choose **View character images**.
Select a character to see its portrait and stats, play its PNG pose sequence, or preview individual
in-game animations. Missing images are marked explicitly; alignment guides help check pose placement.

To review the procedural rigs, choose **View Rig scenario** in the gear menu, or open
**http://localhost:3033/rig.html**. All 66 roster entities have rigs and all five animation states.
Filter Greek, Norse, Egyptian or all pantheons; select a character in the roster to inspect it next
to the animated lineup. Playback supports a full cycle, individual animations, pause, restart,
frame stepping, speed, scrubbing, mirroring and alignment guides. The viewer previews rigs without
changing the saved graphics setting; choose **Unit graphics → Rig** to use them in battle.
The standalone page includes a collapsible shared parts catalogue and is included in production builds.

Art concept boards (WP-7 output, 9 renders across 3 styles) live in `art/concepts/` and are
served at http://localhost:3033/art/concepts/ while the dev server is running.

## Branches

- `main` — the original line of development.
- `olympus` — a variant of Mythos Unbound that evolves independently of `main`. It was forked from
  `feat/status-readout` (commit `2280032`, the Mythos Unbound rename), which carries everything
  through the Egyptian pantheon, deck building, the battle report and the admin panel; `main` had
  none of that at the time. `olympus` is not expected to merge back, so changes made on one line do
  not flow to the other automatically — port them deliberately (cherry-pick) when wanted.

## Olympus: visual overhaul (in progress)

The `olympus` branch is about looks; gameplay is unchanged.

- **Backdrops — done.** `src/render/backdrops.ts`: Greek, Norse, Egyptian and an open-world city,
  plus a themed base for each. The admin panel's *Battlefield* setting is `Auto` by default: one
  pantheon fights in its own realm, a mixed deck in the city. No gold anywhere in the scenes.
- **Character rig — iteration 01, full coverage.** `src/render/rig/`: all 66 Greek, Norse and
  Egyptian entities use procedural idle, walk, attack, hit and death animations. Four body plans:
  biped, serpent, beast and flyer. Authored character specs give each deity its equipment, head,
  clothing and proportions; new parts include ceremonial crowns, instruments and a crocodile head.
  Greek figures use marble/wine tones and poised strides; Norse figures use iron/frost tones and
  heavier movement; Egyptian figures use linen/obsidian tones and measured movement. Casting and
  archery have separate attack poses. **View Rig scenario** in admin and `/rig.html` share the same
  evaluator with the full roster and themed lineups. These are a first visual pass for feedback;
  the next iteration should refine silhouettes, motion and individual character details.
- **Sprite comparison — waiting on art.** `docs/briefs/SPRITE-COMPARE.md` is the brief for
  generating the same five deities as sprites, to be judged side by side against the rig.
- **Team picker — done.** `src/ui/draftscreen.ts` is now a realm picker: Greek, Norse, Egyptian and
  Open World tabs, each over its own backdrop, with a family tree per pantheon (layout in
  `src/ui/familytree.ts`, portraits in `src/ui/portraits.ts`). The two-phase draft and reveal are
  unchanged. Beginning a battle sets the battlefield: one pantheon fights in its realm, the Open World
  tab or any mixed deck in the city.
- **Field limits — done.** `src/sim/limits.ts`: each side may have at most 8 units in play and at
  most 2 gods or titans among them (tested in `tests/limits.test.ts`). A refused summon costs no
  faith, the HUD shows the counts and marks blocked cards, and the opponent obeys the same limits.
  Scripted stage waves are exempt but count toward the totals. The battlefield also fills the window
  and fans units across four depth rows (visual only).
- **Next:** evaluate the full rig roster and pantheon feel, then refine the selected direction; hand-drawn portraits still take priority over rig portraits.

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
