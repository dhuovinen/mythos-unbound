# NOTES

## What this is

**Mythos Unbound** — a browser lane-battler where mythological units change their
behaviour based on their *genealogical relationship* to the units they face. Cronus deals bonus
damage to his own children; Zeus deals bonus damage back to his father; Ares and Aphrodite refuse
to fight each other. Enemy combat relationships resolve within a pantheon; allied auras can
still affect a unit fighting a foreign pantheon.

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

Landing page: `site/index.html` (static, no build step). While the dev server runs, preview it at
**http://localhost:3033/site/index.html**. `npm run build:site` produces the deployable bundle in
`_site/` (git-ignored): the landing page at the root and the game, built with relative paths, at
`_site/play/`. Its art lives in `site/assets/` (WebP exports of the roster portraits and the three
pantheon backdrops).

Trailer: the source is in `promo/trailer-src/`, and the rendered `.mp4` files in `promo/` are git-ignored.
With the dev server running, work from a scratch folder that contains `node_modules/playwright`, the
copied scripts and a `clips/` folder. Record footage with `capture.mjs` (one battle per run; deck and
opponent deck are passed as JSON) and `tree.mjs`. Generate the score with
`uv run --no-project --with numpy --with scipy python score.py score.wav`, render frames with
`node render.mjs h` (16:9) or `node render.mjs v` (9:16), then encode with ffmpeg: `loudnorm` to
-14 LUFS, libx264 at CRF 17, AAC at 320k. `render.mjs` reads the landing-page art from `site/`.

The main game keeps options, faith and summon cards in a vertical side rail. The battlefield uses
the remaining space; on phones the controls move below it. Bases and figures have extra edge
clearance, and the framing fits long rigs and the full unit-size range. This changes rendering only;
simulation positions, movement, ranges and battle timing stay the same.

Beginning a drafted battle uses the selected rosters for both sides, with no free scripted
reinforcements. The original showcase timeline runs only when neither side has a saved draft.
The completed report lists both battle rosters; **What was fielded** counts repeat summons and
includes only units that were actually deployed. Reload and begin a new battle to use this fix;
an existing battle log remains a record of what occurred in that battle.

To inspect generated character art, open **Display settings** and choose **View character images**.
Select a character to see its portrait and stats, play its PNG pose sequence, or preview individual
in-game animations. Missing images are marked explicitly; alignment guides help check pose placement.

To review the procedural rigs, choose **View Rig scenario** in **Display settings**, or open
**http://localhost:3033/rig.html**. All 66 roster entities have rigs and all five animation states.
Filter Greek, Norse, Egyptian or all pantheons; select a character in the roster to inspect it next
to the animated lineup. Playback supports a full cycle, individual animations, pause, restart,
frame stepping, speed, scrubbing, mirroring and alignment guides. The viewer starts playing automatically. Its version selector previews either Egyptian set;
**Use Egyptian V2 in battle** applies v2 and switches battle graphics to Rig. You can also choose
**Unit graphics → Rig** and **Egyptian rigs → V2 · dynamic** in Display settings. Art continues
to prefer PNG images where available, so choose Rig to see the complete new set.
The standalone page includes a collapsible shared parts catalogue and is included in production builds.

For the first Egyptian detail evaluation, choose **Compare Anubis designs** in the Rig viewer,
or open **http://localhost:3033/rig.html?study=anubis**. Three animated directions — Necropolis
guardian, Dune stalker and Guide of the Duat — share playback, scrubbing, frame stepping, speed,
mirroring and alignment controls. Enlarge a direction to inspect ornament and materials. Each
card compares its study with the original v1 Anubis rig at the same small scale. The three concepts remain archived for comparison. Guide of the Duat is now Anubis’s v2 battle
rig, with visible floating breath, drifting limbs and veils, travelling glide, ankh invocation,
hit recoil and collapse. Opening the archived study does not change the chosen battle version.

The **Egyptian v2 set is complete: all 22 units**, each with idle, walk, attack, hit and death.
Open **http://localhost:3033/rig.html?pantheon=egyptian&version=v2** to evaluate the full set.
The Rig scenario now opens on Egypt by default. Select a unit to read its design description;
use the animation selector and Step frame to inspect its movement. Designs vary between linen
sentries, glazed faience, floating spirits, lunar/solar crowns, articulated wings, storm banners,
engraved weapons, dancing beads, a painted soul-bird, an eclipse serpent and the scaled devourer.
All visual changes use the existing battle animation events and leave unit rules unchanged.

The original **v1** set remains selectable in both viewers and battle settings. A source backup
including all three Anubis directions is stored in `art/rig-backups/egyptian-v1.tar.gz`, with
unit IDs, source commit and SHA-256 checksums in `egyptian-v1.json`. See that folder’s README for
safe extraction into a temporary directory. The archive and all 20 extracted files were verified.

Art concept boards (WP-7 output, 9 renders across 3 styles) live in `art/concepts/` and are
served at http://localhost:3033/art/concepts/ while the dev server is running.

Open **Battle log** in the main game, or **Display settings → Battle diagnostics → View full battle log**.
If the team picker is open, choose **Back to the battle** first. The completed battle report also
links to the full diagnostic viewer. Recording starts automatically on page load; reloading or
starting a new deck begins a new log. The viewer freezes a snapshot while the battle keeps running;
**Refresh snapshot** captures subsequent events.

Filter or search the chronological events and select one to inspect exact attack arithmetic,
relationships, unit instance IDs, positions, cooldowns, HP, full field state and summon availability.
The log includes both economies, the cycling hand, decisions, successful/refused summons, free
scripted waves, deaths, settings, fast-forward periods and outcomes. Field checkpoints are roughly
once per second; every attack has its own full pre-attack field. It does not record every movement tick.

**Export review packet (.md)** or **Export JSON** saves the complete snapshot, independent of viewer
filters and pages, with game instructions, roster, relationship graph, simulation source and an
example external analysis prompt. Live exports are labelled in progress. **Copy complete export**
provides an alternative when a browser cannot download files; if clipboard permission is denied,
the complete text is selected for manual copying. The on-screen preview shows only the first 20,000
characters, while downloads and the copy button always include every event.
To request a review, attach the packet in a separate model conversation and paste the included prompt.
The game performs no diagnostic analysis and makes no model requests.

## Branches

- `main` is the current game and the GitHub default branch. Every push runs the tests and deploys
  the landing page and game to https://dhuovinen.github.io/mythos-unbound/
  (`.github/workflows/pages.yml`). It was named `olympus` until 2026-10-06. It was forked from
  `feat/status-readout` (commit `2280032`, the Mythos Unbound rename), which carries everything
  through the Egyptian pantheon, deck building, the battle report and the admin panel.
- `legacy-main` is the original line of development, previously named `main`. It is archived, and
  changes don't flow between it and `main`.

## Olympus: visual overhaul (in progress)

The Olympus work (formerly the `olympus` branch, now `main`) is about looks; gameplay is unchanged.

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
- **Egyptian rigs — v2 delivered.** All 22 Egyptian units now have individual detailed designs,
  secondary movement and the full five-state animation set. Anubis uses Guide of the Duat. The
  live registry defaults to v2 for Egyptian procedural figures; original v1 recipes and figures
  remain selectable, and the source is backed up with checksums in `art/rig-backups/`. Greek/Norse
  rigs retain their existing appearance. The viewer eases its camera back during falls to keep
  long spear tips visible. Motion and framing are checked against actual drawn geometry.
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

## Backlog

- **Trailer intro: show god names with their portraits.** Every portrait shown in the opening and the
  pairing shots (Cronus, Zeus, Ares, Aphrodite, Thor, Jörmungandr) needs its name on screen. Source:
  `promo/trailer-src/trailer.html` (`s1` and `duel`). Re-render with `render.mjs`, then re-encode
  (see How to run).

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
