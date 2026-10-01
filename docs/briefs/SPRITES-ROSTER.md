# Roster art brief — portraits and battle sprites for the remaining 61 deities

**Status.** The five-deity comparison round is approved: Hoplite, Anubis, Zeus, Thor and Cronus are
delivered and are already in the game (`art/compare/sprites/`). This brief covers everything else:
**61 deities**, each needing **one portrait and seven battle poses**. We always want both — the
portrait is what you see in the team picker, the poses are what you see on the battlefield — so
there is no "portrait only" or "sprites only" tier.

Art only. Wiring it into the game is already done; see "How the game picks the files up" below.

---

## 1. What to deliver per deity

Eight PNGs, all with a real alpha channel:

| File | Size | What it is |
|---|---|---|
| `<id>_portrait.png` | 768 × 1024 | Head to hips, three-quarter view. Team picker and the deity's dossier. |
| `<id>_idle_01.png` | 512 × 512 | Neutral standing pose. |
| `<id>_walk_01.png` | 512 × 512 | Walk, contact pose: front leg forward, heel down. |
| `<id>_walk_02.png` | 512 × 512 | Walk, passing pose: legs crossing, body slightly raised. |
| `<id>_attack_01.png` | 512 × 512 | Attack wind-up: weapon drawn back, body coiled. |
| `<id>_attack_02.png` | 512 × 512 | Attack strike: weapon at full extension, body committed forward. |
| `<id>_hit_01.png` | 512 × 512 | Hit reaction: head snapped back, body recoiling. |
| `<id>_death_01.png` | 512 × 512 | Falling: losing balance, weapon dropping. |

The game animates between the key poses itself (the walk alternates its two frames with a bob, an
attack cross-fades from wind-up to strike, a hit shudders, a death settles), so only these seven
are needed.

### File names and folders

```
art/sprites/<id>/<id>_portrait.png
art/sprites/<id>/<id>_idle_01.png
art/sprites/<id>/<id>_walk_01.png
art/sprites/<id>/<id>_walk_02.png
art/sprites/<id>/<id>_attack_01.png
art/sprites/<id>/<id>_attack_02.png
art/sprites/<id>/<id>_hit_01.png
art/sprites/<id>/<id>_death_01.png
```

- The folder and every file name start with the deity's **id exactly as written in this document**
  (lowercase, no accents: `vidar`, not `Víðarr`).
- Everything goes under **`art/sprites/`**. The five comparison deities stay where they are in
  `art/compare/sprites/` and need no changes.
- Nothing else in the repository may be touched. Earlier art rounds overwrote the game's own
  `index.html` four times.
- No extra files in a deity's folder, no version suffixes, no spaces.

---

## 2. What worked in the comparison round — keep doing exactly this

The first five came out at a consistent, high standard. These are the habits that produced it:

1. **Generate one deity at a time, idle first.** The approved `idle_01` is then fed back in as the
   *exact identity reference* for every other pose and the portrait of that deity. That is what keeps
   the costume, proportions and line weight stable. Never generate a deity's poses from scratch
   independently.
2. **Style references go in too**, as style only, never to be copied:
   `art/concepts/assets/style_cb_zeus.jpg`, `style_cb_heracles.jpg`, `style_cb_hoplite.jpg`.
3. **Say it every time:** no gold, no aura, no glow, no sparks, no floating fragments.
4. **The portrait is a new pose, not the sprite blown up.** Three-quarter view turned slightly right,
   both shoulders visible, the far eye partly visible. Do not reuse the strict profile of the sprite.
5. **Identity wins over pose.** If a pose drifts from the idle's costume or proportions, regenerate it.

The delivered files are the reference for quality: look at `art/compare/sprites/zeus/` and
`art/compare/sprites/cronus/` before starting.

---

## 3. Style

**Style C-B, "Bold Woodcut (Clean)".**

- Heavy, chisel-edged ink outline of a uniform weight. Flat graphic fills. Simple hard-edged shadow
  shapes, minimal hatching. Severe, mythic, hand-carved print.
- Light from the upper left, on every image.
- **Palette: bone `#EDE6D6`, ink `#1A1A1E`, blood `#8C2F20` (lit red `#C4442E`),** plus optional greys
  mixed from bone and ink. Nothing else.
- **No gold, yellow, amber, bronze, tan, brown, orange or leather-brown** — anywhere, ever. Gold is
  reserved in the game for the VFX that fire when a family relationship triggers; gold on a character
  would permanently break that signal. Where tradition says "golden" (crowns, jewellery, weapons,
  the sun), use bone, ink or blood red instead. Image models add gold to gods by reflex, so state it
  as a negative prompt every time and reject any render that has it.
- No gradients, airbrush, soft brushwork, photorealism, 3D, metallic shine, glow, aura, sparks,
  particles or floating fragments.
- **Team-neutral.** The same art is used for both sides and the game mirrors it for the enemy. A
  red cloak is part of a design (Thor, Ares) and not a team marker.
- Exactly one character per image. A costume companion (Athena's owl, Odin's raven) is allowed
  only where the entry says so, kept small, as part of the costume.

---

## 4. Frame rules

### Battle poses (512 × 512)

- **Side view, strictly facing right.** The game mirrors for the enemy side.
- **Feet on y = 480; body centre of mass on x = 256.** Keep the same anchor in every pose of a deity,
  so the figure does not jitter between frames.
- **Standing figure about 430 px tall** (head or helm top near y = 50), the same for every
  humanoid regardless of tier. **Do not shrink small units or enlarge big ones inside the frame.**
  The game scales each sprite by tier itself, so a chaff unit and a titan should fill their frames
  equally. (A previous roster ignored this, which broke the cost-by-size read.)
- Weapons and limbs may reach the frame edge in attacks but must stay fully inside it: no clipping.
- No ground shadow, floor, baseline drawing, text, border or watermark.

### Non-humanoids

Entries marked **flyer**, **beast**, **serpent** or **monster** break the "430 px tall" rule, because
they are not standing biped figures:

- **Beast, serpent, monster:** the creature fills the frame **width** (about 460 px) and rests on the
  y = 480 baseline. Height follows the animal.
- **Flyer:** hovers, with its talons around y = 400 instead of 480. The game draws a ground shadow
  below, so the gap is what shows that it is airborne.
- **Mummiform** gods (Osiris, Ptah, Shabti) have wrapped legs: a short, stiff shuffle, not a stride.

### Portrait (768 × 1024)

- Vertical 3:4, **head to hips**, three-quarter view turned slightly right.
- Show both shoulders and both eyes (the far eye partly). A confident pose with the identifying
  attribute beside or in front of the head. Fully include hair, beard, headgear and weapon.
- **No full-body framing.**
- The picker crops from the top, so the face must sit in the upper half of the image.

### Files

- PNG, transparent background (no matte, no checkerboard baked in, no white box).
- **Sprites under about 60 KB, portraits under about 130 KB.** The comparison files came in at
  20–38 KB and 74–110 KB, which is the target. Flat fills compress well; use an 8-bit palette PNG if
  quality holds.

---

## 5. Prompt templates

These are the prompts that produced the approved comparison set. Reuse them.

### Style block (start every prompt with this)

> Use case: stylized-concept. Asset: single production game sprite, Bold Woodcut (Clean), exactly one
> character. Match the approved references' chisel-edged thick ink outlines, flat graphic fills and
> severe mythic hand-carved style; do NOT copy their gold, backgrounds or floor marks. Uniform heavy
> line weight, minimal hatching, simple hard-edged shadow shapes, light upper left. Strict palette
> bone #EDE6D6, ink #1A1A1E, blood #8C2F20 (lit red #C4442E), optional bone/ink mixed greys. NO gold,
> yellow, amber, bronze, metallic shine, golden trim, gold ornaments or gold weapon highlights. No
> brown, tan, orange or leather-brown accents: materials use bone, ink and blood only. Team neutral.
> Genuine transparent RGBA alpha background, no matte, no checkerboard baked into pixels, no ground
> shadow, floor, baseline drawing, text, border, watermark. No gradients, airbrush, soft brushwork,
> photorealism, 3D. Keep the entire character and weapon visible with no clipping.

### Battle pose

> *(style block)*
> **Subject:** *(the deity's Subject paragraph below)*
> 512x512 square image. Full body, strict side view facing RIGHT. Body centre at x=256, feet rest at
> y=480. Head or helm top approximately y=50: standing figure about 430px high, same size as every
> other deity. This is an animation frame: preserve character anatomy, scale and hip anchor across
> poses; all limbs and weapon inside the image. No extra figures.
> **Pose:** *(one of idle_01, walk_01, …, from section 1)*

For every pose except the idle, add a reference line:

> Image 1: approved *(deity)* idle, EXACT identity/design reference. Preserve costume, proportions,
> lighting, palette and line weight. Other images style only. NO gold, NO aura, sparks, glowing magic
> or floating fragments.

### Portrait

> *(style block)*
> Image 1: approved *(deity)* idle, EXACT identity/design reference. Preserve hair, costume, weapon,
> proportions, lighting, palette and line weight. Other images style only. NO gold, NO aura, sparks,
> glowing magic or floating fragments.
> **Subject:** *(the deity's Subject paragraph below)*
> Portrait 768x1024 vertical 3:4, head to hips, THREE QUARTER viewpoint turned slightly RIGHT,
> showing BOTH shoulders and both eyes with the far eye partially visible. *(the deity's Portrait
> line below)* Do NOT reuse the strict profile of the sprite. Fully include hair, headgear and
> weapon. No full-body framing.

---

## 6. How the game picks the files up

There is no list to update. At build time the game scans `art/sprites/*/*.png` and
`art/compare/sprites/*/*.png`, and a deity with all seven poses is drawn from them in **Art** mode
(Gear icon → Unit graphics → Art). The team picker uses `<id>_portrait.png` wherever it exists, and
until it does, falls back to a code-drawn figure and then to a lettered crest.

So the order of delivery does not matter and a half-finished roster is fine: each deity switches
over the moment its files appear. A deity needs **all seven poses** to switch the battlefield figure,
but its portrait works on its own.

---

## 7. Acceptance checklist (per deity, and per batch)

1. **Files:** all eight, exact names, in `art/sprites/<id>/`, correct sizes, real alpha channel.
2. **Small-size test.** Shrink each idle to about 64 px tall and view the batch together. Every unit
   should be recognisable from its silhouette, and no two should be confusable. This is the gate
   that matters for a lane battler.
3. **No gold, yellow, amber, brown or tan** on any character. Check every file.
4. **Same hand.** Same line weight, palette and lighting as the comparison set.
5. **Stable anchor.** Flip through one deity's seven poses: feet stay on the baseline, the body does
   not jump sideways, the scale does not change.
6. **Same scale** (humanoids): about 430 px tall in every 512 frame, whatever the tier.
7. **Clean alpha.** Check a few on a mid-grey background for halos, boxes or grey fringes.
8. **Portrait is its own pose**, not the sprite enlarged, with the face in the upper half.

## 8. Suggested batches

Do them in this order: it spreads the hard cases and lets the game improve quickly.

1. **Greek gods and heroes** (Heracles, Perseus, Achilles, Athena, Ares, Poseidon, Hades, Hera) —
   these share the Zeus and Hoplite look, so they should come easily.
2. **Norse gods** (Odin, Loki, Baldr, Freyja, Tyr, Heimdall, Frigg, Njörðr, Freyr) and
   **Norse warriors and chaff**.
3. **Egyptian gods** (Ra, Osiris, Isis, Set, Horus, Nephthys, Thoth, Hathor, Sekhmet, Ptah).
4. **Remaining demigods and chaff** across all three.
5. **Non-humanoids last**, since they need the most iteration: Typhon, Fenrir, Jörmungandr, Apep,
   Ammit, and the flyers (Harpy, Ba).

Tracker: tick the box on each deity as its eight files land.


---

## Greek (19 deities)

### Satyr — `satyr` · chaff

- [ ] **Files:** `art/sprites/satyr/satyr_portrait.png` plus the seven poses `satyr_idle_01`, `satyr_walk_01`, `satyr_walk_02`, `satyr_attack_01`, `satyr_attack_02`, `satyr_hit_01`, `satyr_death_01` (all `.png`)

- **Subject** (paste after the style block): Small wiry goat-legged reveller: short curled horns, pointed ears, shaggy goat legs with cloven hooves drawn as ink-and-bone hatched fur, bare chest, a grinning face. Carries pan pipes in one hand and a short knotted club in the other. Horns, pipes and the digitigrade goat legs define the silhouette. Bone and ink with blood-red only on a wine-stained sash. No gold.

- **Portrait:** Three-quarter view, head to hips, mischievous grin, pan pipes raised toward the lips, club resting on the shoulder.

- **Pose notes:** attack_01: club drawn back over the shoulder, attack_02: club swung down and forward, pipes tucked under the other arm.


### Harpy — `harpy` · chaff · flyer

- [ ] **Files:** `art/sprites/harpy/harpy_portrait.png` plus the seven poses `harpy_idle_01`, `harpy_walk_01`, `harpy_walk_02`, `harpy_attack_01`, `harpy_attack_02`, `harpy_hit_01`, `harpy_death_01` (all `.png`)

- **Subject** (paste after the style block): Winged bird-woman: gaunt human face with wild ink-black hair, bare shoulders, tattered cloth about the waist, huge feathered wings in bone and ink with blood-red feather tips, bird legs ending in hooked talons. Wings and talons define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, wings flared up behind both shoulders, one clawed hand raised, hungry stare.

- **Pose notes:** FLYER. Hovers above the baseline (talons around y=400, not 480). idle: wings half-raised. walk_01/walk_02: wings full up, then full down (flight cycle). attack_01: wings raised high, talons drawn up. attack_02: dive, talons thrust forward and spread. hit: thrown backward, wings flung up. death: crumpled on the ground, wings folded over the body.


### Heracles — `heracles` · demigod

- [ ] **Files:** `art/sprites/heracles/heracles_portrait.png` plus the seven poses `heracles_idle_01`, `heracles_walk_01`, `heracles_walk_02`, `heracles_attack_01`, `heracles_attack_02`, `heracles_hit_01`, `heracles_death_01` (all `.png`)

- **Subject** (paste after the style block): Massive demigod, the heaviest silhouette of any demigod: lion pelt worn as a hood and cloak (bone fur with ink hatching, the lion's head over his own, paws knotted at the chest), huge knotted club, bare muscled arms, short ink beard, bone loincloth. The pelt and the club are over a third of the visual mass. No brown or tan: the club is ink with bone highlights. No gold.

- **Portrait:** Three-quarter view, head to hips, face framed by the lion's open jaws, club resting on one shoulder, heavy brow.


### Perseus — `perseus` · demigod

- [ ] **Files:** `art/sprites/perseus/perseus_portrait.png` plus the seven poses `perseus_idle_01`, `perseus_walk_01`, `perseus_walk_02`, `perseus_attack_01`, `perseus_attack_02`, `perseus_hit_01`, `perseus_death_01` (all `.png`)

- **Subject** (paste after the style block): Lean heroic youth: short winged sandals (small bone wings at each ankle), a curved harpe sword, a round polished shield of concentric bone-and-ink rings (the mirror), a short blood-red cloak, bare head with short hair, bone chiton. Wings at the ankles, the curved blade and the round shield define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, harpe raised beside the head, mirrored shield held low at the side, alert eyes.


### Achilles — `achilles` · demigod

- [ ] **Files:** `art/sprites/achilles/achilles_portrait.png` plus the seven poses `achilles_idle_01`, `achilles_walk_01`, `achilles_walk_02`, `achilles_attack_01`, `achilles_attack_02`, `achilles_hit_01`, `achilles_death_01` (all `.png`)

- **Subject** (paste after the style block): Tall lean warrior built for speed, not bulk: tall crested helm with a long blood-red horsehair crest, long spear, ornate greaves with an ink pattern, a sleek bone muscled cuirass, a strap-bound left heel (the single weak point, subtly marked), small round shield slung on the back. The crest and the spear define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, helm crest sweeping behind, spear upright beside the head, proud jaw.


### Asclepius — `asclepius` · demigod

- [ ] **Files:** `art/sprites/asclepius/asclepius_portrait.png` plus the seven poses `asclepius_idle_01`, `asclepius_walk_01`, `asclepius_walk_02`, `asclepius_attack_01`, `asclepius_attack_02`, `asclepius_hit_01`, `asclepius_death_01` (all `.png`)

- **Subject** (paste after the style block): Bearded physician-god in a plain draped robe, carrying a staff wound with exactly one serpent (never two: this is not the caduceus) — bone serpent with ink pattern and a blood-red tongue. Satchel of instruments at the hip. The staff and its serpent define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, staff held upright in front with the serpent's head near his shoulder, calm hooded eyes.

- **Pose notes:** attack_01: staff drawn back, serpent coiled tight. attack_02: staff thrust forward, the serpent striking out of its coil. No glow or healing effects.


### Orpheus — `orpheus` · demigod

- [ ] **Files:** `art/sprites/orpheus/orpheus_portrait.png` plus the seven poses `orpheus_idle_01`, `orpheus_walk_01`, `orpheus_walk_02`, `orpheus_attack_01`, `orpheus_attack_02`, `orpheus_hit_01`, `orpheus_death_01` (all `.png`)

- **Subject** (paste after the style block): Poet-musician with a bone-and-ink lyre held out in front, flowing poet's robes, a soft Thracian cap with a blood-red band, no weapon. Delicate, singing, eyes half closed. The lyre and the cap define the silhouette. No gold strings: strings are fine ink lines on bone.

- **Portrait:** Three-quarter view, head to hips, lyre held at the chest, head tipped back, mouth open mid-song.

- **Pose notes:** Unarmed. attack_01: lyre drawn to the chest, strumming hand cocked. attack_02: lyre thrust forward, strumming hand extended. No sound waves, notes or glow.


### Dionysus — `dionysus` · demigod

- [ ] **Files:** `art/sprites/dionysus/dionysus_portrait.png` plus the seven poses `dionysus_idle_01`, `dionysus_walk_01`, `dionysus_walk_02`, `dionysus_attack_01`, `dionysus_attack_02`, `dionysus_hit_01`, `dionysus_death_01` (all `.png`)

- **Subject** (paste after the style block): Loose, swaying posture: ivy-leaf crown (ink leaves), a thyrsus (staff topped with a pinecone and trailing ribbons), a wide two-handled drinking cup, vines wrapped around the arm, a half-open bone chiton with a blood-red sash. Laughing, unguarded. The thyrsus and the cup define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, ivy crown, cup raised, thyrsus held beside the head, drunken grin.


### Aeneas — `aeneas` · demigod

- [ ] **Files:** `art/sprites/aeneas/aeneas_portrait.png` plus the seven poses `aeneas_idle_01`, `aeneas_walk_01`, `aeneas_walk_02`, `aeneas_attack_01`, `aeneas_attack_02`, `aeneas_hit_01`, `aeneas_death_01` (all `.png`)

- **Subject** (paste after the style block): Heavy protective stance: large round shield with a blood-red rim and a bone boss, heavy bone armour with ink shading, a crested helm, a short sword held low. Sheltering, braced, like a man shielding someone behind him. The shield is over a third of the visual mass. No second figure. No gold.

- **Portrait:** Three-quarter view, head to hips, shield raised to cover the near shoulder, steady eyes over the rim.


### Hera — `hera` · god

- [ ] **Files:** `art/sprites/hera/hera_portrait.png` plus the seven poses `hera_idle_01`, `hera_walk_01`, `hera_walk_02`, `hera_attack_01`, `hera_attack_02`, `hera_hit_01`, `hera_death_01` (all `.png`)

- **Subject** (paste after the style block): Tall imperious queen: tall diadem (a bone crown with ink points — not gold), a long veil, peacock-feather motif (a fan of eyed feathers behind one shoulder in bone, ink and blood), a tall sceptre topped with a lotus bud, long robe with layered folds. Stands very straight. The diadem, the feather fan and the sceptre define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, veiled, diadem, sceptre held upright at the shoulder, cold stare down the nose.


### Poseidon — `poseidon` · god

- [ ] **Files:** `art/sprites/poseidon/poseidon_portrait.png` plus the seven poses `poseidon_idle_01`, `poseidon_walk_01`, `poseidon_walk_02`, `poseidon_attack_01`, `poseidon_attack_02`, `poseidon_hit_01`, `poseidon_death_01` (all `.png`)

- **Subject** (paste after the style block): Heavy sea god: trident (three prongs, long haft), wild windswept beard and hair, bare chest, a sea-cloak with ink wave-swirl motifs, broad and low. The trident and the beard define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, hair and beard blowing sideways, trident upright beside the head, stormy glare.


### Hades — `hades` · god

- [ ] **Files:** `art/sprites/hades/hades_portrait.png` plus the seven poses `hades_idle_01`, `hades_walk_01`, `hades_walk_02`, `hades_attack_01`, `hades_attack_02`, `hades_hit_01`, `hades_death_01` (all `.png`)

- **Subject** (paste after the style block): Still and heavy, the least dynamic pose in the roster: a bident (two prongs), a shadowed helm of darkness (ink dome that hides the brow and eyes in shadow), long ink robes with blood-red lining, a heavy cloak. He barely moves. The bident and the helm define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, face half-lost in the helm's shadow, bident held upright and perfectly still.

- **Pose notes:** Keep every pose restrained: attack_01/attack_02 are a slow lift and a single downward thrust, not a lunge.


### Athena — `athena` · god

- [ ] **Files:** `art/sprites/athena/athena_portrait.png` plus the seven poses `athena_idle_01`, `athena_walk_01`, `athena_walk_02`, `athena_attack_01`, `athena_attack_02`, `athena_hit_01`, `athena_death_01` (all `.png`)

- **Subject** (paste after the style block): Disciplined war goddess: crested helm with a blood-red crest, an aegis across the chest bearing a gorgoneion (a face ringed with snakes, ink on bone), a long spear, and a small bone-and-ink owl perched on one shoulder (part of her costume, not a second character). Measured, upright stance. The crest, the spear and the aegis define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, helm, owl on the near shoulder, spear upright beside the head, level gaze.


### Ares — `ares` · god

- [ ] **Files:** `art/sprites/ares/ares_portrait.png` plus the seven poses `ares_idle_01`, `ares_walk_01`, `ares_walk_02`, `ares_attack_01`, `ares_attack_02`, `ares_hit_01`, `ares_death_01` (all `.png`)

- **Subject** (paste after the style block): War as an appetite: full-face war helm with a narrow eye slit and a blood-red crest, spear and shield, forward aggressive stance, bare scarred torso under bone cuirass straps, a blood-red cloak. Hunched to charge. The helm and the lunging stance define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, helm face turned to the viewer, spear lowered, shield edge across the chest, red pinpoints in the eye slit.


### Aphrodite — `aphrodite` · god

- [ ] **Files:** `art/sprites/aphrodite/aphrodite_portrait.png` plus the seven poses `aphrodite_idle_01`, `aphrodite_walk_01`, `aphrodite_walk_02`, `aphrodite_attack_01`, `aphrodite_attack_02`, `aphrodite_hit_01`, `aphrodite_death_01` (all `.png`)

- **Subject** (paste after the style block): Flowing drapery that trails behind her, a white dove perched on one raised hand, a hand mirror in the other, long loose hair, a scallop-shell clasp at the shoulder, a blood-red sash. No weapon. Graceful, expensive, dangerous. The dove, the mirror and the trailing drapery define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, dove at her shoulder, mirror held near her cheek, sidelong glance.

- **Pose notes:** Unarmed. attack_01: arms drawn in, dove clasped. attack_02: dove released forward from an extended hand, mirror held low. No sparkles, hearts or glow.


### Hephaestus — `hephaestus` · god

- [ ] **Files:** `art/sprites/hephaestus/hephaestus_portrait.png` plus the seven poses `hephaestus_idle_01`, `hephaestus_walk_01`, `hephaestus_walk_02`, `hephaestus_attack_01`, `hephaestus_attack_02`, `hephaestus_hit_01`, `hephaestus_death_01` (all `.png`)

- **Subject** (paste after the style block): Broad, low, heavily built smith: a forge hammer in one hand and tongs in the other, a heavy ink apron, soot-dark beard, a visibly twisted lame leg held in an iron brace. The hammer, the brace and the very broad shoulders define the silhouette. No gold; metal is bone and ink.

- **Portrait:** Three-quarter view, head to hips, hammer resting on the shoulder, soot-dark heavy brow, forge-lit side of the face in blood red.


### Apollo — `apollo` · god

- [ ] **Files:** `art/sprites/apollo/apollo_portrait.png` plus the seven poses `apollo_idle_01`, `apollo_walk_01`, `apollo_walk_02`, `apollo_attack_01`, `apollo_attack_02`, `apollo_hit_01`, `apollo_death_01` (all `.png`)

- **Subject** (paste after the style block): Youthful, beautiful archer-god: laurel wreath (ink leaves), a drawn bow, a small lyre slung at the hip, short curled hair, bone chiton, and a ring of radiating ink lines behind the head like a sunburst (linework only — no glow, no gold). The bow and the radiating lines define the silhouette.

- **Portrait:** Three-quarter view, head to hips, laurel crown, rays of ink lines behind the head, bow held across the body.

- **Pose notes:** attack_01: arrow nocked and bow drawn. attack_02: arrow just released, bow arm extended.


### Artemis — `artemis` · god

- [ ] **Files:** `art/sprites/artemis/artemis_portrait.png` plus the seven poses `artemis_idle_01`, `artemis_walk_01`, `artemis_walk_02`, `artemis_attack_01`, `artemis_attack_02`, `artemis_hit_01`, `artemis_death_01` (all `.png`)

- **Subject** (paste after the style block): Lean huntress: a drawn bow, a quiver of bone-fletched arrows on the back, a short hunting chiton, a crescent-moon diadem at the brow (bone, not gold), braided hair. No hound or stag: exactly one character. The bow and the crescent diadem define the silhouette.

- **Portrait:** Three-quarter view, head to hips, bow drawn to the cheek, crescent at the brow, cold focus.

- **Pose notes:** attack_01: arrow nocked and bow fully drawn. attack_02: arrow just released.


### Typhon — `typhon` · titan · monster

- [ ] **Files:** `art/sprites/typhon/typhon_portrait.png` plus the seven poses `typhon_idle_01`, `typhon_walk_01`, `typhon_walk_02`, `typhon_attack_01`, `typhon_attack_02`, `typhon_hit_01`, `typhon_death_01` (all `.png`)

- **Subject** (paste after the style block): The monster: a vast torso with several snarling heads (three to five) on writhing serpent necks, huge bat-like wings, clawed arms, and instead of legs thick serpentine coils that pile up on the ground. Ink-black scales with bone belly plates and blood-red eyes. Least human shape in the roster. Nothing about it is dignified. No fire, smoke or lightning effects. No gold.

- **Portrait:** Three-quarter view of the heads and shoulders, three heads snarling at different angles, wings rising behind, filling the frame.

- **Pose notes:** MONSTER, not a biped: fills the frame (about 460 px across and 430 px tall), sits on its coils on the baseline. idle: heads swaying. walk: coils shuffle forward, alternating two frames. attack_01: heads drawn back together. attack_02: all heads strike forward. hit: heads recoil. death: collapsed in a heap of coils, heads down, wings slack.



---

## Norse (21 deities)

### Einherjar — `einherjar` · chaff

- [ ] **Files:** `art/sprites/einherjar/einherjar_portrait.png` plus the seven poses `einherjar_idle_01`, `einherjar_walk_01`, `einherjar_walk_02`, `einherjar_attack_01`, `einherjar_attack_02`, `einherjar_hit_01`, `einherjar_death_01` (all `.png`)

- **Subject** (paste after the style block): Warrior chosen for Valhalla: round viking helm with a nasal bar, a round shield with ink spokes and a blood-red boss, an axe, a mail shirt drawn as ink cross-hatching on bone, a braided beard. Grim and cheerful at once. The shield and the helm define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, helm, braided beard, shield raised, axe over the shoulder.

- **Pose notes:** attack_01: axe raised high. attack_02: axe chopping down.


### Draugr — `draugr` · chaff

- [ ] **Files:** `art/sprites/draugr/draugr_portrait.png` plus the seven poses `draugr_idle_01`, `draugr_walk_01`, `draugr_walk_02`, `draugr_attack_01`, `draugr_attack_02`, `draugr_hit_01`, `draugr_death_01` (all `.png`)

- **Subject** (paste after the style block): Corpse that stayed in its barrow: hunched, gaunt, desiccated, with tattered burial wrappings and chipped rusty mail drawn in bone and ink greys (no brown, no orange), a notched sword, a dented helm over hollow eyes with blood-red pinpoints. Slow and heavy. The hunch and the notched sword define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, hollow eyes, ragged hood of burial cloth, sword held low.

- **Pose notes:** death_01: the body crumbling apart, bones and mail spilling, not a clean fall.


### Valkyrie — `valkyrie` · chaff

- [ ] **Files:** `art/sprites/valkyrie/valkyrie_portrait.png` plus the seven poses `valkyrie_idle_01`, `valkyrie_walk_01`, `valkyrie_walk_02`, `valkyrie_attack_01`, `valkyrie_attack_02`, `valkyrie_hit_01`, `valkyrie_death_01` (all `.png`)

- **Subject** (paste after the style block): Fast, light chooser of the slain: winged helm (bone wings), spear, round shield, a long blood-red cape streaming behind, light mail. Mid-stride, forward-leaning. The winged helm and the streaming cape define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, winged helm, spear lifted, cape sweeping behind.


### Sigurd — `sigurd` · demigod

- [ ] **Files:** `art/sprites/sigurd/sigurd_portrait.png` plus the seven poses `sigurd_idle_01`, `sigurd_walk_01`, `sigurd_walk_02`, `sigurd_attack_01`, `sigurd_attack_02`, `sigurd_hit_01`, `sigurd_death_01` (all `.png`)

- **Subject** (paste after the style block): Dragon-slayer: a long sword with a visible seam where it was reforged (Gram), a round shield, a cloak made from dragon hide drawn as an ink scale pattern, short beard, a plain helm with small wings. Young and tired. The long sword and the scaled cloak define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, sword upright with the tip beside the face, scale-patterned cloak at the shoulder, wary eyes.


### Víðarr — `vidar` · demigod

- [ ] **Files:** `art/sprites/vidar/vidar_portrait.png` plus the seven poses `vidar_idle_01`, `vidar_walk_01`, `vidar_walk_02`, `vidar_attack_01`, `vidar_attack_02`, `vidar_hit_01`, `vidar_death_01` (all `.png`)

- **Subject** (paste after the style block): The silent avenger: one enormous thick-soled iron boot (the shoe he uses to pin the wolf's jaw) clearly bigger than the other, a long spear, a hooded cloak, a grim set mouth, plain mail. Says nothing. The oversized boot and the spear define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, hood up, spear upright, jaw set, eyes forward.


### Brynhildr — `brynhildr` · demigod

- [ ] **Files:** `art/sprites/brynhildr/brynhildr_portrait.png` plus the seven poses `brynhildr_idle_01`, `brynhildr_walk_01`, `brynhildr_walk_02`, `brynhildr_attack_01`, `brynhildr_attack_02`, `brynhildr_hit_01`, `brynhildr_death_01` (all `.png`)

- **Subject** (paste after the style block): Shield-maiden stripped of her valkyrie wings: long braided hair, mail, a round shield with a blood-red boss, a longsword, a cloak of swan feathers in bone and ink hanging from the shoulders. Resolute. No wings. The braid and the feather cloak define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, braid over the shoulder, shield at the side, sword upright, feather cloak around the neck.


### Höðr — `hodr` · demigod

- [ ] **Files:** `art/sprites/hodr/hodr_portrait.png` plus the seven poses `hodr_idle_01`, `hodr_walk_01`, `hodr_walk_02`, `hodr_attack_01`, `hodr_attack_02`, `hodr_hit_01`, `hodr_death_01` (all `.png`)

- **Subject** (paste after the style block): Blind warrior: a cloth blindfold over the eyes, plain tunic, one hand outstretched feeling the air, and in the other a slender dart whose tip is a sprig of mistletoe (ink leaves). Not a villain; a man handed a weapon and told where to throw it. The blindfold and the dart define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, blindfolded face lifted, dart held back ready to throw.

- **Pose notes:** attack_01: dart drawn back over the shoulder. attack_02: dart just thrown, arm extended.


### Váli — `vali` · demigod

- [ ] **Files:** `art/sprites/vali/vali_portrait.png` plus the seven poses `vali_idle_01`, `vali_walk_01`, `vali_walk_02`, `vali_attack_01`, `vali_attack_02`, `vali_hit_01`, `vali_death_01` (all `.png`)

- **Subject** (paste after the style block): Boy born, grown and armed in a single day for revenge: slender young archer with a drawn bow, a quiver, loose unbraided hair, a plain tunic, a fixed, furious stare. Younger and thinner than the other demigods but the same standing height. The bow and the stare define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, bow drawn to the cheek, fierce unblinking eyes.

- **Pose notes:** attack_01: arrow nocked and bow fully drawn. attack_02: arrow just released.


### Magni — `magni` · demigod

- [ ] **Files:** `art/sprites/magni/magni_portrait.png` plus the seven poses `magni_idle_01`, `magni_walk_01`, `magni_walk_02`, `magni_attack_01`, `magni_attack_02`, `magni_hit_01`, `magni_death_01` (all `.png`)

- **Subject** (paste after the style block): Thor's son, stronger than Thor at three days old: a stocky young powerhouse with a beardless face, braided hair, a fur mantle over bare muscled shoulders, and a huge two-handed maul with a rough-hewn stone head (not Mjölnir). Deliberately different from Thor: no helm, no red cloak, no beard. The maul and the mantle define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, maul resting on the shoulder, young proud grin.

- **Pose notes:** attack_01: maul raised overhead in both hands. attack_02: maul slammed down.


### Skaði — `skadi` · demigod

- [ ] **Files:** `art/sprites/skadi/skadi_portrait.png` plus the seven poses `skadi_idle_01`, `skadi_walk_01`, `skadi_walk_02`, `skadi_attack_01`, `skadi_attack_02`, `skadi_hit_01`, `skadi_death_01` (all `.png`)

- **Subject** (paste after the style block): Giantess huntress of the snows: a hooded fur cloak (bone fur with ink hatching), a drawn bow, a quiver, fur-lined boots with wide snowshoes, a stern frozen face. The fur hood and the bow define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, deep fur hood, bow drawn, steady eyes.

- **Pose notes:** attack_01: arrow nocked and bow drawn. attack_02: arrow just released.


### Odin — `odin` · god

- [ ] **Files:** `art/sprites/odin/odin_portrait.png` plus the seven poses `odin_idle_01`, `odin_walk_01`, `odin_walk_02`, `odin_attack_01`, `odin_attack_02`, `odin_hit_01`, `odin_death_01` (all `.png`)

- **Subject** (paste after the style block): The one-eyed all-father: wide-brimmed hat pulled low, an eyepatch over the left eye, long bone beard, a long spear with rune marks along the shaft (Gungnir), a heavy cloak lined in blood red, and a single small raven perched on one shoulder (part of his costume, not a second character). Old and certain. The hat, the beard and the spear define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, hat brim, eyepatch, raven on the near shoulder, spear upright beside the head.


### Loki — `loki` · god

- [ ] **Files:** `art/sprites/loki/loki_portrait.png` plus the seven poses `loki_idle_01`, `loki_walk_01`, `loki_walk_02`, `loki_attack_01`, `loki_attack_02`, `loki_hit_01`, `loki_death_01` (all `.png`)

- **Subject** (paste after the style block): Slender, sly trickster: an asymmetrical horned helm (one horn curled, one broken), a crooked smirk, a rune-carved dagger in each hand, a ragged ink cloak lined in blood red, a lean forward-slouched stance. Charming and dangerous. The horns and the twin daggers define the silhouette. No fire. No gold.

- **Portrait:** Three-quarter view, head to hips, horned helm, smirk, one dagger turning in the hand.

- **Pose notes:** attack_01: both daggers drawn back crossed. attack_02: a quick slash forward, off-balance and grinning.


### Baldr — `baldr` · god

- [ ] **Files:** `art/sprites/baldr/baldr_portrait.png` plus the seven poses `baldr_idle_01`, `baldr_walk_01`, `baldr_walk_02`, `baldr_attack_01`, `baldr_attack_02`, `baldr_hit_01`, `baldr_death_01` (all `.png`)

- **Subject** (paste after the style block): The best of the gods: unarmoured, a plain white tunic, bare head with long light hair, a round shield and a sword held loosely, a small sprig of mistletoe pinned at the belt (the hint of his death). Serene and untroubled. No halo, no glow, no radiating lines (that is Apollo). The calm face and the open, unarmoured chest define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, long hair, bare shoulders, serene face, mistletoe at the belt.


### Frigg — `frigg` · god

- [ ] **Files:** `art/sprites/frigg/frigg_portrait.png` plus the seven poses `frigg_idle_01`, `frigg_walk_01`, `frigg_walk_02`, `frigg_attack_01`, `frigg_attack_02`, `frigg_hit_01`, `frigg_death_01` (all `.png`)

- **Subject** (paste after the style block): Queen of Asgard: a veil and a tall headdress held with pins, a long robe, a ring of household keys at the belt, and a distaff (a spinning staff with bound wool at the top) used as her staff. Knows every fate and says nothing. The headdress and the distaff define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, veiled, keys at the belt, distaff upright in one hand, quiet knowing look.

- **Pose notes:** attack_01: distaff drawn back. attack_02: distaff thrust forward, free hand open. No healing glow.


### Freyja — `freyja` · god

- [ ] **Files:** `art/sprites/freyja/freyja_portrait.png` plus the seven poses `freyja_idle_01`, `freyja_walk_01`, `freyja_walk_02`, `freyja_attack_01`, `freyja_attack_02`, `freyja_hit_01`, `freyja_death_01` (all `.png`)

- **Subject** (paste after the style block): Warrior goddess of love and war: a falcon-feather cloak in bone, ink and blood spread from the shoulders, a necklace of heavy beads (Brísingamen) drawn in bone and ink, a short sword and a small round shield, long braided hair. The feather cloak and the necklace define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, feather cloak flared behind both shoulders, necklace at the throat, sword raised.


### Freyr — `freyr` · god

- [ ] **Files:** `art/sprites/freyr/freyr_portrait.png` plus the seven poses `freyr_idle_01`, `freyr_walk_01`, `freyr_walk_02`, `freyr_attack_01`, `freyr_attack_02`, `freyr_hit_01`, `freyr_death_01` (all `.png`)

- **Subject** (paste after the style block): God of the harvest who gave away his sword: bare-chested, a boar-crested helm (for his golden boar, drawn bone and ink), and a stag antler held like a club as his only weapon. No sword. Open, sunlit, unarmed in the way that matters. The boar crest and the antler define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, boar helm, antler held across the chest.

- **Pose notes:** attack_01: antler raised overhead. attack_02: antler swung down.


### Týr — `tyr` · god

- [ ] **Files:** `art/sprites/tyr/tyr_portrait.png` plus the seven poses `tyr_idle_01`, `tyr_walk_01`, `tyr_walk_02`, `tyr_attack_01`, `tyr_attack_02`, `tyr_hit_01`, `tyr_death_01` (all `.png`)

- **Subject** (paste after the style block): The god of oaths: his right arm ends at the wrist in a bound stump (the wolf took the hand), his left hand holds a sword, a round shield, a plain helm, mail, a grim steady face. The stump is deliberately visible. The missing hand and the raised sword define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, the stump arm raised in front of him, sword in the other hand, steady jaw.


### Heimdall — `heimdall` · god

- [ ] **Files:** `art/sprites/heimdall/heimdall_portrait.png` plus the seven poses `heimdall_idle_01`, `heimdall_walk_01`, `heimdall_walk_02`, `heimdall_attack_01`, `heimdall_attack_02`, `heimdall_hit_01`, `heimdall_death_01` (all `.png`)

- **Subject** (paste after the style block): Watchman of the rainbow bridge: a huge curved war-horn (Gjallarhorn) in one hand, a longsword (Hofud) in the other, a long pale cloak, wide-open alert eyes, a pale beard, mail. Waiting for one specific sound. The horn and the open stare define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, horn lifted toward the mouth, other hand on the sword hilt, wide eyes.


### Njörðr — `njord` · god

- [ ] **Files:** `art/sprites/njord/njord_portrait.png` plus the seven poses `njord_idle_01`, `njord_walk_01`, `njord_walk_02`, `njord_attack_01`, `njord_attack_02`, `njord_hit_01`, `njord_death_01` (all `.png`)

- **Subject** (paste after the style block): God of the sea and of wealth: a weathered salt-white beard, a heavy sea-cloak with ink wave patterns, a harpoon with a coiled line, bare feet, a calm, patient face. Old, broad and slow. The harpoon and the wave-patterned cloak define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, harpoon upright, salt-white beard, cloak with wave patterns at the shoulder.


### Fenrir — `fenrir` · titan · beast

- [ ] **Files:** `art/sprites/fenrir/fenrir_portrait.png` plus the seven poses `fenrir_idle_01`, `fenrir_walk_01`, `fenrir_walk_02`, `fenrir_attack_01`, `fenrir_attack_02`, `fenrir_hit_01`, `fenrir_death_01` (all `.png`)

- **Subject** (paste after the style block): The great wolf: huge, hunched, shaggy, a ridge of raised hackles down the spine, jaws bared with long fangs, red pinpoint eyes, and the heavy remnants of a broken chain with thick ink links hanging from the neck. Chained-then-free. Occupies the full frame width. No fire, no glowing. No gold.

- **Portrait:** Three-quarter view of the head and shoulders, snarling, broken chain across the chest, ears flat.

- **Pose notes:** BEAST, not a biped: fills the frame width (about 460 px nose to tail), paws on the baseline. walk_01/walk_02: trot, diagonal legs alternating. attack_01: crouched low, head drawn back. attack_02: lunging bite, jaws wide. hit: thrown back, head up. death: lying on its side, legs out, jaws slack.


### Jörmungandr — `jormungandr` · titan · serpent

- [ ] **Files:** `art/sprites/jormungandr/jormungandr_portrait.png` plus the seven poses `jormungandr_idle_01`, `jormungandr_walk_01`, `jormungandr_walk_02`, `jormungandr_attack_01`, `jormungandr_attack_02`, `jormungandr_hit_01`, `jormungandr_death_01` (all `.png`)

- **Subject** (paste after the style block): The world-serpent: a thick scaled body that coils on the ground in loops, the front third reared high with a heavy, wedge-shaped head and open jaws, a ridge of spines along the neck, ink-black scales with bone belly plates and a diamond pattern along the back, a blood-red eye. Fills the frame. No fire, no water effects. No gold.

- **Portrait:** Three-quarter view of the head and neck, jaws parted, spines along the neck, coils in the lower part of the frame.

- **Pose notes:** SERPENT, not a biped: fills the frame width (about 460 px), coiled body on the baseline, head reared. idle: head swaying. walk_01/walk_02: slither, the body's humps shifted between the two frames. attack_01: head drawn back in an S-curve. attack_02: head lunged forward and down, jaws wide. hit: head thrown back. death: flat on the ground, head down, jaws open.



---

## Egyptian (21 deities)

### Medjay — `medjay` · chaff

- [ ] **Files:** `art/sprites/medjay/medjay_portrait.png` plus the seven poses `medjay_idle_01`, `medjay_walk_01`, `medjay_walk_02`, `medjay_attack_01`, `medjay_attack_02`, `medjay_hit_01`, `medjay_death_01` (all `.png`)

- **Subject** (paste after the style block): Desert patrol turned royal guard: a plain striped headcloth, kohl-lined eyes, a short linen kilt, a spear and a tall rectangular shield with a blood-red bar, a short khopesh at the belt. Competent and unremarkable. The headcloth and the tall shield define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, striped headcloth, shield raised, spear beside the head.


### Shabti — `shabti` · chaff

- [ ] **Files:** `art/sprites/shabti/shabti_portrait.png` plus the seven poses `shabti_idle_01`, `shabti_walk_01`, `shabti_walk_02`, `shabti_attack_01`, `shabti_attack_02`, `shabti_hit_01`, `shabti_death_01` (all `.png`)

- **Subject** (paste after the style block): Funerary servant figurine: a mummiform wrapped body in bone linen with blood-red hieroglyph bands, a false beard, a striped nemes headcloth, arms crossed holding a hoe and a pick. Stiff and doll-like, with a fixed painted face. The tools in the crossed arms and the stiff mummiform body define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, nemes headcloth, crossed arms holding the hoe and pick, blank painted stare.

- **Pose notes:** Stiff: little knee bend, legs bound together so the walk is short shuffled steps. attack_01: hoe raised over the head. attack_02: hoe chopped down.


### Ba — `ba` · chaff · flyer

- [ ] **Files:** `art/sprites/ba/ba_portrait.png` plus the seven poses `ba_idle_01`, `ba_walk_01`, `ba_walk_02`, `ba_attack_01`, `ba_attack_02`, `ba_hit_01`, `ba_death_01` (all `.png`)

- **Subject** (paste after the style block): The soul-bird: a falcon's body with a calm bearded human head, wings spread, small hooked talons, one holding a shen ring. Bone and ink feathers with blood-red wing tips. Quick and light. The human head on the bird body defines the silhouette. No halo, no glow. No gold.

- **Portrait:** Three-quarter view, head and chest, human face serene on a falcon's body, wings raised behind.

- **Pose notes:** FLYER. Hovers above the baseline (talons around y=400, not 480). idle: wings half-raised. walk_01/walk_02: wings full up, then full down. attack_01: wings raised high, talons drawn up. attack_02: talons thrust forward and spread. hit: thrown back, wings flung up. death: crumpled on the ground, wings folded over the body.


### Wepwawet — `wepwawet` · demigod

- [ ] **Files:** `art/sprites/wepwawet/wepwawet_portrait.png` plus the seven poses `wepwawet_idle_01`, `wepwawet_walk_01`, `wepwawet_walk_02`, `wepwawet_attack_01`, `wepwawet_attack_02`, `wepwawet_hit_01`, `wepwawet_death_01` (all `.png`)

- **Subject** (paste after the style block): The Opener of Ways: a wolf head with shorter, rounded ears than Anubis and a thicker muzzle, ink-grey fur with a bone muzzle, a war mace and a standard pole bearing a wolf emblem, a short kilt, a broad collar. Fast and forward-leaning. The wolf head and the standard define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, wolf head with ears pricked, standard pole beside the head, mace in the other hand.


### Imhotep — `imhotep` · demigod

- [ ] **Files:** `art/sprites/imhotep/imhotep_portrait.png` plus the seven poses `imhotep_idle_01`, `imhotep_walk_01`, `imhotep_walk_02`, `imhotep_attack_01`, `imhotep_attack_02`, `imhotep_hit_01`, `imhotep_death_01` (all `.png`)

- **Subject** (paste after the style block): Architect-physician: a shaved head with a plain skullcap, a long simple linen robe, a papyrus scroll in one hand and a tall measuring rod in the other. No weapon beyond the rod. Calm, thoughtful. The scroll and the rod define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, skullcap, scroll held open, rod upright, thoughtful eyes.

- **Pose notes:** attack_01: rod drawn back. attack_02: rod thrust forward, scroll held low. No healing glow.


### Nefertem — `nefertem` · demigod

- [ ] **Files:** `art/sprites/nefertem/nefertem_portrait.png` plus the seven poses `nefertem_idle_01`, `nefertem_walk_01`, `nefertem_walk_02`, `nefertem_attack_01`, `nefertem_attack_02`, `nefertem_hit_01`, `nefertem_death_01` (all `.png`)

- **Subject** (paste after the style block): God of the lotus: a lotus-blossom crown with two tall plumes (bone petals, ink outline), a short kilt, a broad collar, a bare chest, and a curved knife with a single lotus flower in the other hand. Beauty as a weapon. The lotus crown and the two plumes define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, lotus crown with plumes, lotus flower held near the chest, knife low, a half smile.


### Maahes — `maahes` · demigod

- [ ] **Files:** `art/sprites/maahes/maahes_portrait.png` plus the seven poses `maahes_idle_01`, `maahes_walk_01`, `maahes_walk_02`, `maahes_attack_01`, `maahes_attack_02`, `maahes_hit_01`, `maahes_death_01` (all `.png`)

- **Subject** (paste after the style block): Lion-headed warrior son of a plague goddess: a maned lion head with bared teeth (ink mane, bone muzzle), a large curved khopesh and a knife, a short kilt, a heavy bare chest, a blood-red sash. The maned lion head and the khopesh define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, lion head mid-snarl, khopesh raised beside the head.


### Bes — `bes` · demigod

- [ ] **Files:** `art/sprites/bes/bes_portrait.png` plus the seven poses `bes_idle_01`, `bes_walk_01`, `bes_walk_02`, `bes_attack_01`, `bes_attack_02`, `bes_hit_01`, `bes_death_01` (all `.png`)

- **Subject** (paste after the style block): Grotesque household dwarf-god: bandy legs, a barrel chest, a huge bearded face with tongue stuck out and wide eyes, a tall feather crown, a lion-pelt tail, a short heavy sword and a round shield. Short and extremely wide; still fill about 400 px of the frame height by making the head and the stance large. The face, the feather crown and the squat bowed stance define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, tongue out, feather crown, sword raised, a frightening grin.


### Khonsu — `khonsu` · demigod

- [ ] **Files:** `art/sprites/khonsu/khonsu_portrait.png` plus the seven poses `khonsu_idle_01`, `khonsu_walk_01`, `khonsu_walk_02`, `khonsu_attack_01`, `khonsu_attack_02`, `khonsu_hit_01`, `khonsu_death_01` (all `.png`)

- **Subject** (paste after the style block): Young moon god: a sidelock of youth, a crescent-and-disc headdress (bone crescent holding a blood-red disc), a long close-fitting robe, a collar, holding a heqa crook and a was staff together. Thin and watchful. No glow, no gold. The crescent headdress and the crook define the silhouette.

- **Portrait:** Three-quarter view, head to hips, crescent headdress, sidelock, crook and was staff crossed at the chest.

- **Pose notes:** attack_01: crook drawn back. attack_02: crook swung forward at full reach.


### Ra — `ra` · god

- [ ] **Files:** `art/sprites/ra/ra_portrait.png` plus the seven poses `ra_idle_01`, `ra_walk_01`, `ra_walk_02`, `ra_attack_01`, `ra_attack_02`, `ra_hit_01`, `ra_death_01` (all `.png`)

- **Subject** (paste after the style block): The sun: a falcon head (ink feathers, bone beak) crowned with a large blood-red sun disc ringed in bone and wrapped by a rearing cobra, a long spear, a broad collar, a short kilt, a bare muscled chest. The disc is blood red, never gold. The falcon head and the red disc define the silhouette.

- **Portrait:** Three-quarter view, head to hips, falcon head with the red disc and cobra, spear upright beside the head, hard eyes.


### Osiris — `osiris` · god

- [ ] **Files:** `art/sprites/osiris/osiris_portrait.png` plus the seven poses `osiris_idle_01`, `osiris_walk_01`, `osiris_walk_02`, `osiris_attack_01`, `osiris_attack_02`, `osiris_hit_01`, `osiris_death_01` (all `.png`)

- **Subject** (paste after the style block): Murdered, dismembered, reassembled king of the dead: a mummiform body in bone wrappings, a tall white atef crown (bone, with two ink-edged feathers), a false beard, the crook and flail crossed on the chest. Stiff, upright, enormously heavy. His legs are bound, so he barely steps. The crown and the crossed crook and flail define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, atef crown, crook and flail crossed at the chest, solemn stare.

- **Pose notes:** Mummiform: legs wrapped together, walk is a short rigid shuffle. attack_01: flail drawn back. attack_02: flail swung forward from the shoulder.


### Isis — `isis` · god

- [ ] **Files:** `art/sprites/isis/isis_portrait.png` plus the seven poses `isis_idle_01`, `isis_walk_01`, `isis_walk_02`, `isis_attack_01`, `isis_attack_02`, `isis_hit_01`, `isis_death_01` (all `.png`)

- **Subject** (paste after the style block): The most capable goddess: a throne-glyph headdress, a long close-fitting bone sheath dress with a blood-red sash, outstretched winged arms (the sleeves open into broad feathered wings in bone and ink), an ankh in one hand. The wings and the throne headdress define the silhouette. No halo, no glow. No gold.

- **Portrait:** Three-quarter view, head to hips, throne headdress, wings opening behind both shoulders, ankh held up.

- **Pose notes:** attack_01: wings raised, ankh drawn back. attack_02: wings swept forward, ankh extended. No healing glow.


### Set — `set` · god

- [ ] **Files:** `art/sprites/set/set_portrait.png` plus the seven poses `set_idle_01`, `set_walk_01`, `set_walk_02`, `set_attack_01`, `set_attack_02`, `set_hit_01`, `set_death_01` (all `.png`)

- **Subject** (paste after the style block): God of storms and the red desert: the Set-animal head (a long downward-curving snout and tall square-tipped ears, ink fur with blood-red eyes), a tall spear, a short blood-red kilt, a hunched muscular body. Hunched and wary. The curved snout and the tall square ears define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, curved snout and tall ears, spear upright beside the head, red eyes.


### Horus — `horus` · god

- [ ] **Files:** `art/sprites/horus/horus_portrait.png` plus the seven poses `horus_idle_01`, `horus_walk_01`, `horus_walk_02`, `horus_attack_01`, `horus_attack_02`, `horus_hit_01`, `horus_death_01` (all `.png`)

- **Subject** (paste after the style block): Falcon-headed avenger: a falcon head with a scar across the left eye (he lost it), the double crown (a tall bone crown nested with a smaller blood-red one), a long spear, an udjat-eye pendant on a collar, a short kilt. Vengeful and upright. The falcon head and the double crown define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, falcon head with the double crown, scarred eye, spear upright, hard stare.


### Nephthys — `nephthys` · god

- [ ] **Files:** `art/sprites/nephthys/nephthys_portrait.png` plus the seven poses `nephthys_idle_01`, `nephthys_walk_01`, `nephthys_walk_02`, `nephthys_attack_01`, `nephthys_attack_02`, `nephthys_hit_01`, `nephthys_death_01` (all `.png`)

- **Subject** (paste after the style block): The quiet mourner: a house-glyph headdress, a long close-fitting ink-black dress, wings of bone and ink feathers spread from the arms (smaller and lower than Isis, folded half-closed), a protective outstretched arm, a tall staff. Distinct from Isis by the dark dress, the house-glyph headdress and the half-closed wings. No glow. No gold.

- **Portrait:** Three-quarter view, head to hips, house-glyph headdress, wings half-folded behind the shoulders, one hand lifted in a gentle warding gesture.


### Thoth — `thoth` · god

- [ ] **Files:** `art/sprites/thoth/thoth_portrait.png` plus the seven poses `thoth_idle_01`, `thoth_walk_01`, `thoth_walk_02`, `thoth_attack_01`, `thoth_attack_02`, `thoth_hit_01`, `thoth_death_01` (all `.png`)

- **Subject** (paste after the style block): Ibis-headed scribe: a long downward-curved ibis beak (ink and bone), a moon-disc crown, a papyrus scroll and a scribe's palette in one hand and a tall staff in the other, a linen kilt, a collar. The long beak defines the silhouette. No glow, no gold.

- **Portrait:** Three-quarter view, head to hips, long curved beak in profile, moon-disc crown, scroll held open.

- **Pose notes:** attack_01: staff drawn back at full reach. attack_02: staff thrust forward at the longest range. No healing glow.


### Hathor — `hathor` · god

- [ ] **Files:** `art/sprites/hathor/hathor_portrait.png` plus the seven poses `hathor_idle_01`, `hathor_walk_01`, `hathor_walk_02`, `hathor_attack_01`, `hathor_attack_02`, `hathor_hit_01`, `hathor_death_01` (all `.png`)

- **Subject** (paste after the style block): Cow-eared goddess of joy: long hair, cow ears and curving horns holding a blood-red sun disc, a wide beaded collar, a long fitted dress, a sistrum (a loop-topped rattle) as her weapon. Joyful and dangerous. The cow horns and disc define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, horns and the red disc, sistrum raised beside the head, smile.

- **Pose notes:** attack_01: sistrum drawn back. attack_02: sistrum swung forward, mid-shake. No sound effects.


### Sekhmet — `sekhmet` · god

- [ ] **Files:** `art/sprites/sekhmet/sekhmet_portrait.png` plus the seven poses `sekhmet_idle_01`, `sekhmet_walk_01`, `sekhmet_walk_02`, `sekhmet_attack_01`, `sekhmet_attack_02`, `sekhmet_hit_01`, `sekhmet_death_01` (all `.png`)

- **Subject** (paste after the style block): The Eye of Ra in her killing mood: a lioness head (no mane, bared teeth) with a blood-red sun disc and a cobra, a blood-red fitted dress, a broad collar, a huge khopesh raised. Hits the hardest of the gods and looks it. The lioness head and the raised khopesh define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, lioness head snarling, the red disc, khopesh raised.


### Ptah — `ptah` · god

- [ ] **Files:** `art/sprites/ptah/ptah_portrait.png` plus the seven poses `ptah_idle_01`, `ptah_walk_01`, `ptah_walk_02`, `ptah_attack_01`, `ptah_attack_02`, `ptah_hit_01`, `ptah_death_01` (all `.png`)

- **Subject** (paste after the style block): The creator who spoke the world into being: a mummiform body in bone wrappings with ink-dark hands, a tight skullcap, a straight false beard, holding a tall sceptre that combines the was, the djed pillar and the ankh. Upright like a pillar and immovable. His legs are wrapped together, so he barely steps. The skullcap and the tall sceptre define the silhouette. No gold.

- **Portrait:** Three-quarter view, head to hips, skullcap, straight beard, tall sceptre held upright in front, calm.

- **Pose notes:** Mummiform: legs wrapped together, walk is a short rigid shuffle. attack_01: sceptre raised. attack_02: sceptre brought down like a pillar.


### Apep — `apep` · titan · serpent

- [ ] **Files:** `art/sprites/apep/apep_portrait.png` plus the seven poses `apep_idle_01`, `apep_walk_01`, `apep_walk_02`, `apep_attack_01`, `apep_attack_02`, `apep_hit_01`, `apep_death_01` (all `.png`)

- **Subject** (paste after the style block): The serpent of chaos: a huge black serpent with a broad flat head, a hood like a cobra's, open jaws, blood-red eyes, bone belly bands, and several small bone knives still stuck in the coils from the nightly fight. Distinct from Jörmungandr: no diamond pattern, a flatter head, and the embedded knives. Fills the frame. No fire. No gold.

- **Portrait:** Three-quarter view of the head and hood, jaws wide, red eyes, a couple of knives stuck in the neck.

- **Pose notes:** SERPENT, not a biped: fills the frame width (about 460 px), coiled body on the baseline, head reared. idle: head swaying. walk_01/walk_02: slither, humps shifted between the two frames. attack_01: head drawn back in an S-curve, hood flared. attack_02: head lunged forward and down, jaws wide. hit: head thrown back. death: flat on the ground, head down.


### Ammit — `ammit` · titan · beast

- [ ] **Files:** `art/sprites/ammit/ammit_portrait.png` plus the seven poses `ammit_idle_01`, `ammit_walk_01`, `ammit_walk_02`, `ammit_attack_01`, `ammit_attack_02`, `ammit_hit_01`, `ammit_death_01` (all `.png`)

- **Subject** (paste after the style block): The devourer: a four-legged composite beast — a crocodile head with a long toothed snout, a lion's forequarters with a heavy ink mane, and the heavy rear of a hippopotamus. Waits and watches, then devours. Fills the frame width. No gold.

- **Portrait:** Three-quarter view of the head and shoulders, crocodile jaws partly open, ink mane behind, a heavy low gaze.

- **Pose notes:** BEAST, not a biped: fills the frame width (about 460 px nose to tail), paws on the baseline. walk_01/walk_02: heavy trot, diagonal legs alternating. attack_01: crouched low, head drawn back. attack_02: lunging bite, jaws wide. hit: thrown back. death: lying on its side, legs out, jaws slack.

