# Sprite comparison set — five deities

**Purpose.** We are testing two ways of getting 66 deities on screen: hand-generated sprites (this
brief) versus characters drawn and animated in code (a parametric rig, prototyped separately). To
compare them fairly both must render the **same five deities** in the same game. This brief is for
the sprite side. It is art only.

**This is a comparison, not the roster.** Five deities, with enough animation to judge motion.
Nothing here replaces `art/roster/`.

## The five deities

They were chosen to cover every tier and all three pantheons, plus the hardest silhouette problems.

| id | Pantheon | Tier | Why it is in the set |
|---|---|---|---|
| `hoplite` | Greek | chaff | Smallest, most numerous unit. Tests whether a simple figure still reads at small size. |
| `anubis` | Egyptian | demigod | Animal head on a human body. Tests non-human silhouettes. |
| `zeus` | Greek | god | The established reference — we already have an old Zeus to compare against. |
| `thor` | Norse | god | A second god from a different pantheon. Checks the style holds across realms. |
| `cronus` | Greek | titan | Colossal scale. Tests whether a titan feels huge without a different frame size. |

### Identifying attribute for each

The attribute must break the silhouette, so the unit is recognisable as a small dark shape. It
should be roughly 30–40 % of the visual mass.

| id | Character and attribute |
|---|---|
| `hoplite` | Greek foot soldier. Large round shield (aspis), spear, crested helm. Mostly shield. |
| `anubis` | Jackal-headed man. Tall upright ears, long muzzle. Linen kilt, bare chest, broad collar. Carries a was-sceptre (straight staff with a forked base and an animal-head top). Lean, watchful. |
| `zeus` | Full beard (a major mass), thunderbolt raised in the right hand, aegis cloak over one shoulder. Broad-shouldered, imperious. |
| `thor` | Heavy beard, winged or horned helm, a short-handled war hammer (Mjölnir) held forward, a cloak in **blood red**. Stocky and powerful, lower and wider than Zeus. |
| `cronus` | Colossal, hunched, hooded. A huge curved sickle (harpe). Menacing and heavy, as if he barely fits the frame. Shows his age — gaunt face, deep-set eyes. |

## Style

This follows the project's chosen direction, **Style C-B, "Bold Woodcut (Clean)"**.

- **Line:** heavy, chisel-edged ink outline, consistent weight on every sprite. Hard edges, no soft
  brushwork, no airbrush gradients.
- **Fills:** flat shapes. Shadows are simplified graphic shapes, with minimal hatching.
- **Silhouette first:** squint, and the figure should still read as a single high-contrast ink mass.
  If it turns to mush, it fails.
- **Tone:** severe, mythic, hand-carved print.
- **Lighting:** one source from the upper left, on every sprite.

### Palette

Bone `#EDE6D6`, ink `#1A1A1E` and blood `#8C2F20` (use `#C4442E` for a lit red). You may use
intermediate greys and warm greys mixed from bone and ink for shading.

### The gold rule (hardest constraint)

**No gold on any character.** No gold crowns, jewellery, trim, weapons, halos or highlights, and no
yellow or amber tones that read as gold. In the game, gold on screen means "a family relationship
is firing", so a god wearing gold would permanently break that signal.

Image models add gold to gods by reflex, especially Zeus, Anubis (collars) and Cronus. **State it
as a negative prompt every time** and reject any render that has it. Use bone, ink and blood for
ornament instead.

### Team colour

Sprites are **team-neutral**: the same art is used for both sides, and the game mirrors it for the
enemy. Do not make a blue team and a red team. Thor's blood-red cloak is part of his design, not a
team marker.

## Output specification

Every image is **PNG with a real alpha channel**. No background, no matte, no white box, no
checkerboard baked in. No ground shadow, no baseline, no text, no border.

### Frame rules

- **Frame size: 512 × 512 px.** Every animation frame for every deity uses exactly this size.
- **View:** side view, facing **right**.
- **Feet anchor:** the feet rest on a baseline at **y = 480**, with the body's centre of mass on
  **x = 256**. Keep the same anchor in every frame of a deity, because the game places the frame by
  this point. A character that jitters between frames will look like it is vibrating.
- **Scale: the same for all five deities.** Each standing figure is about **90 % of the frame
  height** (roughly 430 px from foot to the top of the head or helm).

  > **Do not shrink small units or grow big ones inside the frame.** An earlier roster was asked to
  > encode tier as size in the image and ignored it, which broke the cost-by-size read. This time the
  > game scales each sprite by tier itself. A hoplite and Cronus should both fill the frame equally;
  > the game will draw the hoplite at about half Cronus's size.
  >
  > Cronus may show his size through proportions (hunch, heavy limbs, weapon) but must still fit
  > the frame.
- **Weapons and extended limbs** may reach the frame edge during attacks. Keep the whole figure inside
  the frame with no clipping.

### Two levels of delivery

**Level 1 — key poses (required).** Seven images per deity, 35 in total. This is enough to judge
the style and to compare against the code-drawn version.

| Frame | What it shows |
|---|---|
| `idle_01` | Neutral standing pose, weight settled, weapon held at rest. |
| `walk_01` | Walk, contact pose: front leg forward, heel down. |
| `walk_02` | Walk, passing pose: legs crossing, body slightly raised. |
| `attack_01` | Attack wind-up: weapon drawn back, body coiled. |
| `attack_02` | Attack strike: weapon at full extension, body committed forward. |
| `hit_01` | Hit reaction: head snapped back, body recoiling. |
| `death_01` | Falling: losing balance, weapon dropping. |

**Level 2 — full animation (optional, only if Level 1 is approved).** Full frame sequences so the
game can play real animations.

| Action | Frames | Notes |
|---|---|---|
| `idle` | 4 | Gentle breathing loop. Frame 4 must lead smoothly back into frame 1. |
| `walk` | 6 | Looping walk cycle. Frame 6 must lead smoothly back into frame 1. |
| `attack` | 5 | Wind-up (1–2), strike (3), follow-through (4), recovery (5). |
| `hit` | 2 | Impact, then recoil. |
| `death` | 5 | Stagger, fall, collapse. Last frame is the final resting pose and is held. |

For full animation, the character's design must not drift between frames: same costume, same
proportions, same line weight, same lighting.

### Portrait (required)

One per deity. This is for the team-picker screen, where the deity is shown large.

- **Size: 768 × 1024 px**, portrait orientation, transparent background.
- **Framing:** head to hips, three-quarter view turned slightly to the right, a confident pose that
  shows the identifying attribute. Same style, palette, line weight and lighting as the sprites.
- The same gold rule applies.

## File names and folders

Put everything under a new folder. **Do not write anywhere else.**

```
art/compare/sprites/<id>/<id>_portrait.png
art/compare/sprites/<id>/<id>_idle_01.png
art/compare/sprites/<id>/<id>_walk_01.png
art/compare/sprites/<id>/<id>_walk_02.png
art/compare/sprites/<id>/<id>_attack_01.png
art/compare/sprites/<id>/<id>_attack_02.png
art/compare/sprites/<id>/<id>_hit_01.png
art/compare/sprites/<id>/<id>_death_01.png
```

For example, `art/compare/sprites/zeus/zeus_attack_02.png`. Full-animation frames continue the same
pattern with two-digit numbers (`thor_walk_03.png`, `cronus_death_05.png`).

- Lowercase, no spaces, no version suffixes, no extra files in these folders.
- The five folder names are exactly: `hoplite`, `anubis`, `zeus`, `thor`, `cronus`.
- **Do not touch** `art/roster/`, `art/concepts/`, `index.html`, `src/`, `public/`, `docs/` or any
  other existing file. Earlier art rounds overwrote the game's own `index.html` four times.

### File size

Keep each PNG under **150 KB** if you can (portraits under 250 KB). The game loads these over the web,
and an earlier delivery of 1 MB files was impractical. Flat fills with hard edges compress well,
so compress hard, and use an 8-bit palette PNG if quality holds.

## Reference images

Give the generator these existing approved renders as visual anchors, so the set matches the chosen
direction rather than reinterpreting the prompt:

```
art/concepts/assets/style_cb_zeus.jpg
art/concepts/assets/style_cb_heracles.jpg
art/concepts/assets/style_cb_hoplite.jpg
```

Generate **one deity at a time, all poses together**, and feed the approved idle frame back in as a
reference for every other pose of that deity. That is what keeps the costume and proportions
stable across frames.

## Prompt template

Adapt per deity and pose:

> Side view, facing right, full body. **[Deity: attribute from the table.]** **[Pose from the frame
> table.]** Bold woodcut print style, heavy chisel-edged black ink outline of consistent weight, flat
> bone-white and black fills with simple graphic shadow shapes, minimal hatching, strong silhouette
> readable at small size. Palette: bone white `#EDE6D6`, ink black `#1A1A1E`, blood red `#8C2F20`
> only. Light from the upper left. Transparent background, no ground shadow, no text, no border.
> Figure is 90% of the frame height, feet on the baseline near the bottom, centred horizontally.
>
> **Negative:** gold, yellow, amber, metallic shine, gradients, soft shading, airbrush, photorealism,
> 3D render, background, floor, cast shadow, text, watermark, frame, multiple figures.

## Acceptance checklist

1. **Files:** every Level 1 file exists with the exact name, in the right folder, 512 × 512 (or
   768 × 1024 for portraits), with a real alpha channel, and nothing written outside `art/compare/`.
2. **Small-size test.** Shrink each figure to about 64 px tall and view all five side by side. Each
   one must be instantly recognisable from its silhouette, and no two may be confusable.
3. **No gold or amber on any character.** Check every frame for it.
4. **Same hand.** All five look like one artist made them: same line weight, palette and lighting,
   same facing.
5. **Stable anchor.** Flip through one deity's frames: the feet stay on the baseline, the body does
   not jump sideways, and the scale does not change.
6. **Same scale.** The hoplite and Cronus fill the frame equally, at about 90 % of its height.
7. **Clean alpha.** Open a few on a mid-grey background and check for halos, boxes or grey fringes.

## What we will do with it

We will load both versions into the same battlefield, run them side by side and judge: how each reads at
game size, how the motion feels, how consistent the set looks, and what it would cost to produce
all 66 deities each way. The result decides the art direction for the rest of the roster.
