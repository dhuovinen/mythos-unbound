# WP-9 — Production roster art (Style C-B)

**Model tier: image generation. Status: DELIVERED — 22 sprites in `art/roster/`. Revision needed.**

## ⚠️ Revision notes — measured from the delivered files

The art is in and wired up. Three defects, measured by sampling the actual PNGs:

**1. Tier scale was not applied — the most important miss.** The brief asked for figure height to
encode tier (chaff ~55% of frame, demigod ~70%, god ~85%, titan 100%) so that drawing every frame
at one size reproduces the cost curve for free. Measured figure heights instead run **86–100% of
frame regardless of tier**: Satyr 88%, Harpy 87%, Hoplite 100%, Heracles 95%, Zeus 88%, Cronus 91%.
Drawn as delivered, a Satyr renders very nearly the size of Cronus and tier stops reading entirely.

The renderer now imposes the scale itself (`SPRITE_TIER_SCALE` in `src/render/draw.ts`) so the game
is playable regardless, but **regenerating to spec would look considerably better** — a chaff unit
scaled down to 55% is a 55%-size image, not a small figure drawn at native detail.

**2. Two sprites carry a background matte.** `heracles.png` is **60% semi-transparent pixels** — a
grey field behind the figure that renders as a visible box on the battlefield. `hoplite.png` has
opaque corners and a figure bounding box filling the entire 1024×1024 frame. Both need a clean
alpha cutout. The other twenty are clean.

**3. File sizes are impractical for the web.** The second-round renders are ~0.6–1.5 MB each,
roughly 32 MB for the roster. These want compressing hard — target under 100 KB per sprite. The
first-round files (~17–24 KB) show the target is reachable in this style.

Also: `art/roster/` contains generator scripts, `__pycache__/`, an `index.html` and `test_sprite.svg`
alongside the PNGs. Harmless, but the directory is meant to hold sprites.

---

## Original brief

Style C-B, "Bold Woodcut (Clean)", was chosen on 2026-07-31. This brief turns that decision into
22 production sprites. It is **art only** — wiring sprites into the renderer is a separate code task.

---

## ⚠️ Write path — read before anything else

**Write only inside this directory:**

```
/Users/dhuovinen/Projects/games-strategy-001/art/roster/
```

Sprites go in `art/roster/`. Nothing else, anywhere else.

**Do NOT write to the repository root.** Earlier art rounds wrote `index.html`, `styles.css` and
`assets/` to the project root four separate times, overwriting the game's own entry point and
requiring manual recovery each time. Specifically, never touch:

- `/Users/dhuovinen/Projects/games-strategy-001/index.html` ← the game itself
- `NOTES.md`, `src/`, `public/`, `tests/`, `docs/` at the root
- `art/concepts/` ← the completed concept boards; leave them alone

If you want to produce a contact-sheet page to review the output, put it at
`art/roster/index.html` with its stylesheet inline.

---

## Reference anchors

Three approved C-B renders already exist. **Feed them in as visual references** so the roster
matches the chosen direction rather than re-interpreting the prompt:

```
art/concepts/assets/style_cb_zeus.jpg
art/concepts/assets/style_cb_heracles.jpg
art/concepts/assets/style_cb_hoplite.jpg
```

Those three define the target. Everything else should look like it came from the same hand.

---

## Style C-B specification

- **Palette — four colours, no more:** bone `#EDE6D6`, ink `#1A1A1E`, oxidized gold `#C9A227`,
  blood `#8C2F20`
- **Line:** hard chisel-edged strokes. Minimal cross-hatching — shadows are simplified graphic
  shapes, not hatch fields. This restraint is exactly what buys legibility at 64 px, and it is the
  only thing separating C-B from the rejected Style C.
- **Silhouette:** must read as a high-contrast ink mass. If you squint and it turns to mush, it fails.
- **Tone:** severe, mythic, hand-carved print.

### The gold rule — hardest constraint in this brief

**Oxidized gold `#C9A227` is reserved exclusively for relational VFX in-game. It must never appear
on a character.** No gold jewellery, no gold crowns, no gold trim, no gold weapons, no gold halos.

This is systemic, not aesthetic: gold on screen always means "the genealogy graph is firing." A god
wearing a gold crown permanently breaks that signal. Image models reach for gold on Greek deities by
reflex, so **state it as a negative prompt every time** and reject any render that sneaks it in.

Characters use bone, ink, and blood red only.

---

## Output specification

- **Format: PNG with a real alpha channel.** The concept boards were JPG; production cannot be —
  sprites composite over a canvas background. No matte, no white box, no checkerboard baked in.
- **Canvas: 1024 × 1024**, one character centred horizontally.
- **View:** side view, facing **right**, neutral standing pose. The renderer mirrors for the enemy
  side, so every unit must face the same way.
- **Lighting:** consistent single source from upper-left across all 22.
- **No** ground shadow, no baseline, no text, no border, no frame.

### Filenames must match deity ids exactly

The loader keys off `deity.id`, so filenames are not cosmetic:

```
hoplite.png  satyr.png     harpy.png      heracles.png   perseus.png
achilles.png asclepius.png orpheus.png    dionysus.png   aeneas.png
zeus.png     hera.png      poseidon.png   hades.png      athena.png
ares.png     aphrodite.png hephaestus.png apollo.png     artemis.png
cronus.png   typhon.png
```

Lowercase, no spaces, no suffixes, no version numbers.

### Scale discipline — the thing that breaks lane battlers

Every sprite shares a 1024 × 1024 frame, but characters must **not** fill it equally. Tier has to be
readable from size alone at a glance, so occupy this fraction of frame height, feet at the same
baseline:

| Tier | Frame height | Units |
|---|---|---|
| chaff | ~55 % | hoplite, satyr, harpy |
| demigod | ~70 % | heracles, perseus, achilles, asclepius, orpheus, dionysus, aeneas |
| god | ~85 % | zeus, hera, poseidon, hades, athena, ares, aphrodite, hephaestus, apollo, artemis |
| titan | 100 % | cronus, typhon |

**Generate tier by tier, not in roster order.** Batching by tier is what keeps scale and weight
consistent within a tier, which is what makes the tiers read as tiers.

---

## The 22 units

Each entry is the identifying attribute — the thing that must break the silhouette so the unit is
recognisable at 64 px. Attribute should read as roughly 30–40 % of the visual mass.

**Chaff**

| id | Character and attribute |
|---|---|
| `hoplite` | Greek foot soldier: large round aspis shield, spear, crested helm. Mostly shield. |
| `satyr` | Goat-legged reveller, small and wiry, pan pipes, short horns |
| `harpy` | Winged bird-woman, spread wings, hooked talons, gaunt |

**Demigods**

| id | Character and attribute |
|---|---|
| `heracles` | Lion pelt worn as hood and cloak, huge knotted club. Heaviest demigod silhouette. |
| `perseus` | Winged sandals, curved harpe sword, mirrored shield |
| `achilles` | Tall crested helm, long spear, ornate greaves — lean and fast, not bulky |
| `asclepius` | Staff with a **single** serpent (not a caduceus — that is Hermes), physician's robe |
| `orpheus` | Lyre held forward, poet's robes, no weapon |
| `dionysus` | Thyrsus (pinecone-tipped staff), grape vines, drinking cup, loose posture |
| `aeneas` | Large protective shield, sheltering stance, heavy armour |

**Gods**

| id | Character and attribute |
|---|---|
| `zeus` | Thunderbolt raised, full beard, aegis over shoulder. Beard is a major mass. |
| `hera` | Tall diadem, peacock-feather motif, sceptre, imperious bearing |
| `poseidon` | Trident, wild beard, wave motifs in the drapery |
| `hades` | Bident, shadowed helm, still and heavy — the least dynamic pose in the roster |
| `athena` | Crested helm, aegis with gorgoneion, spear, owl at shoulder |
| `ares` | Full-face war helm, spear and shield, forward aggressive stance |
| `aphrodite` | Flowing drapery, dove, hand mirror, no weapon |
| `hephaestus` | Smith's hammer and tongs, forge apron, visibly lame leg, broad and low |
| `apollo` | Lyre and bow, laurel wreath, radiating linework behind the head |
| `artemis` | Drawn bow, quiver, crescent moon at the brow, hound or stag at heel |

**Titans and monsters**

| id | Character and attribute |
|---|---|
| `cronus` | Colossal, harpe scythe, devouring menace. Should feel like it barely fits the frame. |
| `typhon` | Monstrous: serpentine coils for legs, multiple heads, vast wings. Least human shape. |

---

## Acceptance criteria

1. **22 PNGs** in `art/roster/`, correctly named, real alpha, 1024 × 1024.
2. **The 64 px test.** Downscale all 22 to 64 px tall and view together. Tier must be readable from
   size alone, and no two units within a tier should be confusable. This is the same gate the
   concept boards passed — it is the only criterion that actually matters for a lane battler.
3. **No gold on any character.** Check every render specifically for this.
4. All 22 look like one hand made them: same palette, same line weight, same lighting, same facing.
5. Nothing written outside `art/roster/`.

## Report back

A contact sheet at 64 px alongside the full-size renders, plus a note on any unit you could not make
work at small size — those are the ones worth redesigning rather than shipping.

## Not in scope

Wiring sprites into `src/render/draw.ts`, animation frames, attack/death poses, or a sprite atlas.
Those are code tasks and will be briefed separately.
