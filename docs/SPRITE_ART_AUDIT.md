# 🎨 Style C-B (Bold Woodcut) — Full Roster Art Audit

**Auditor**: Lead Art Director & Technical Game Artist  
**Date**: 2026-08-01  
**Scope**: All 22 sprites in `art/roster/`  
**Target Spec**: Style C-B (Bold Woodcut), 64px 2D lane battler, 1024×1024 source PNG

---

> **⚠️ CRITICAL FINDING: Two Incompatible Art Pipelines Detected**
> 
> The roster contains **two completely different classes of sprites** that are drastically inconsistent with each other:
> 
> **Class A — "High-Detail Woodcut" (externally generated, ~600KB–1.5MB)**  
> Hoplite, Satyr, Harpy, Heracles, Perseus, Achilles, Asclepius, Orpheus, Dionysus, Aeneas, Hera, Poseidon, Zeus
> 
> **Class B — "Geometric Rasterizer" (Python `Canvas2D` generated, ~17KB–24KB)**  
> Athena, Ares, Aphrodite, Hephaestus, Apollo, Artemis, Hades, Cronus, Typhon
> 
> These two classes have **zero visual cohesion** — they cannot coexist on the same battlefield. The Class B sprites are crude geometric primitives (circles, rectangles, hatched triangles) while Class A sprites are richly detailed woodcut illustrations. This is the single most critical finding in the audit.

---

## Per-Asset Grading

### Legend
| Symbol | Meaning |
|--------|---------|
| ✅ PASS | Meets specification |
| ❌ FAIL | Does not meet specification |

---

## 🏛️ CHAFF TIER (Hoplite, Satyr, Harpy) — Expected ~55% frame height

---

### 1. Hoplite (`hoplite.png`) — Class A

| # | Criterion | Grade | Notes |
|---|-----------|-------|-------|
| 1 | 🔍 64px Readability | ✅ PASS | Shield + helm crest read clearly at 64px. Aspis dominates ~40% visual mass. Excellent silhouette. |
| 2 | 🚫 Palette & No-Gold | ✅ PASS | Strictly Bone/Ink/Blood. No gold detected. Crest is Blood Red. |
| 3 | 📏 Tier Scale | ❌ FAIL | **Figure fills ~88% of the frame height.** Spec requires ~55% for Chaff. This Hoplite is drawn at God-tier proportions. |
| 4 | 🎨 Woodcut Technique | ✅ PASS | Excellent chisel linework, clean hatching, severe hand-carved tone. The best execution of Style C-B in the roster. |
| 5 | 📐 Canvas & Pose | ✅ PASS | Facing right, side-view standing pose, RGBA transparent background, centered 1024×1024. |
| 6 | 🏛️ Character Recognition | ✅ PASS | Instantly recognizable — aspis shield with lambda/chevron, Corinthian helm with crest, dory spear. Textbook hoplite. |

**Score: 5 / 6** — REQUIRES REDESIGN  
**Redesign**: Shrink figure to occupy only ~55% of the 1024px frame height (feet at ~y:880, head at ~y:520). This is the most common failure across the entire roster.

---

### 2. Satyr (`satyr.png`) — Class A

| # | Criterion | Grade | Notes |
|---|-----------|-------|-------|
| 1 | 🔍 64px Readability | ✅ PASS | Goat legs + pan pipes + horns read well at small scale. Good silhouette differentiation. |
| 2 | 🚫 Palette & No-Gold | ✅ PASS | Bone/Ink/Blood only. Red sash accent. No gold. |
| 3 | 📏 Tier Scale | ❌ FAIL | **Figure fills ~90% of frame.** Should be ~55% for Chaff tier. |
| 4 | 🎨 Woodcut Technique | ✅ PASS | Strong woodcut feel with bold chisel marks, good fur hatching texture, high contrast. |
| 5 | 📐 Canvas & Pose | ✅ PASS | Facing right, side view, transparent background, 1024×1024. |
| 6 | 🏛️ Character Recognition | ✅ PASS | Instantly reads as satyr — goat legs, horns, pan pipes. No ambiguity. |

**Score: 5 / 6** — REQUIRES REDESIGN  
**Redesign**: Scale down to 55% frame height.

---

### 3. Harpy (`harpy.png`) — Class A

| # | Criterion | Grade | Notes |
|---|-----------|-------|-------|
| 1 | 🔍 64px Readability | ❌ FAIL | Wings span nearly the full canvas width, causing the central body to compress into a dense dark mass at 64px. Talons and human features merge into noise. |
| 2 | 🚫 Palette & No-Gold | ✅ PASS | Bone/Ink/Blood only. Talon accents in Blood. No gold. |
| 3 | 📏 Tier Scale | ❌ FAIL | **Figure fills ~95% of the canvas** both horizontally and vertically. Massively oversized for Chaff tier (~55% expected). |
| 4 | 🎨 Woodcut Technique | ✅ PASS | Feather hatching is well-executed. Good severity in the linework. |
| 5 | 📐 Canvas & Pose | ❌ FAIL | Wings spread almost to canvas edges (near-frontal wingspan). The pose reads as facing-front, not side-view right. |
| 6 | 🏛️ Character Recognition | ✅ PASS | Bird-woman with talons and wings — recognizable as harpy. |

**Score: 3 / 6** — REQUIRES REDESIGN  
**Redesign**: (1) Redraw in strict right-facing side view with wings folded/tucked to reduce horizontal spread. (2) Scale figure to 55% frame height. (3) Simplify wing detail to read at 64px.

---

## ⚔️ DEMIGOD TIER (Heracles, Perseus, Achilles, Asclepius, Orpheus, Dionysus, Aeneas) — Expected ~70% frame height

---

### 4. Heracles (`heracles.png`) — Class A

| # | Criterion | Grade | Notes |
|---|-----------|-------|-------|
| 1 | 🔍 64px Readability | ✅ PASS | Lion pelt hood + knotted club are clearly distinct at 64px. Strong visual mass. |
| 2 | 🚫 Palette & No-Gold | ✅ PASS | Bone/Ink/Blood. Lion maw accent in Blood. No gold. |
| 3 | 📏 Tier Scale | ❌ FAIL | **Figure fills ~92% of frame.** Should be ~70%. |
| 4 | 🎨 Woodcut Technique | ✅ PASS | Excellent cross-hatching on musculature, chisel-carved pelt texture. |
| 5 | 📐 Canvas & Pose | ❌ FAIL | **Baked ground shadow visible** — rubble/stones beneath sandals break transparent background spec. |
| 6 | 🏛️ Character Recognition | ✅ PASS | Lion pelt over head + club = unmistakably Heracles. |

**Score: 4 / 6** — REQUIRES REDESIGN  
**Redesign**: (1) Remove baked ground shadow/rubble beneath feet. (2) Scale to 70% frame height.

---

### 5. Perseus (`perseus.png`) — Class A

| # | Criterion | Grade | Notes |
|---|-----------|-------|-------|
| 1 | 🔍 64px Readability | ✅ PASS | Winged sandals + Medusa shield + harpe sword read well. |
| 2 | 🚫 Palette & No-Gold | ✅ PASS | Bone/Ink/Blood. Harness straps in Blood. No gold. |
| 3 | 📏 Tier Scale | ❌ FAIL | **Figure fills ~95% of frame.** Should be ~70%. |
| 4 | 🎨 Woodcut Technique | ✅ PASS | Strong graphic ink masses. Bold hatching on musculature and pteruges. |
| 5 | 📐 Canvas & Pose | ✅ PASS | Facing right, side-view, transparent background. |
| 6 | 🏛️ Character Recognition | ✅ PASS | Winged sandals + Medusa-faced shield + curved harpe = unambiguously Perseus. Superb iconography. |

**Score: 5 / 6** — REQUIRES REDESIGN  
**Redesign**: Scale to 70% frame height.

---

### 6. Achilles (`achilles.png`) — Class A

| # | Criterion | Grade | Notes |
|---|-----------|-------|-------|
| 1 | 🔍 64px Readability | ✅ PASS | Tall crested helm + ornate greaves + red cloak provide excellent tier readability. |
| 2 | 🚫 Palette & No-Gold | ✅ PASS | Bone/Ink/Blood. Cloak and greaves in Blood. No gold. |
| 3 | 📏 Tier Scale | ❌ FAIL | **Figure fills ~93% of frame.** Should be ~70%. |
| 4 | 🎨 Woodcut Technique | ✅ PASS | Ornate Greek key patterns on armor are beautiful, though borderline dense for 64px. Good chisel line quality. |
| 5 | 📐 Canvas & Pose | ✅ PASS | Facing right, side-view standing, transparent background. |
| 6 | 🏛️ Character Recognition | ❌ FAIL | **Problematic**: At 64px, this reads as a generic armored Greek warrior. Visually overlaps heavily with Hoplite and Aeneas. Needs a distinguishing prop (e.g., prominent vulnerability marker at the heel, or his famous shield). |

**Score: 4 / 6** — REQUIRES REDESIGN  
**Redesign**: (1) Scale to 70% frame height. (2) Exaggerate a unique silhouette-breaking element — consider making the cloak billow dramatically or adding a prominent heel detail to distinguish from Hoplite at 64px.

---

### 7. Asclepius (`asclepius.png`) — Class A

| # | Criterion | Grade | Notes |
|---|-----------|-------|-------|
| 1 | 🔍 64px Readability | ✅ PASS | Staff with serpent reads clearly as a vertical accent. Robed physician silhouette is distinct. |
| 2 | 🚫 Palette & No-Gold | ✅ PASS | Bone/Ink/Blood. Serpent in Blood Red. No gold. |
| 3 | 📏 Tier Scale | ❌ FAIL | **Figure fills ~90% of frame.** Should be ~70%. |
| 4 | 🎨 Woodcut Technique | ✅ PASS | Clean drapery hatching, restrained cross-hatching, good woodblock severity. |
| 5 | 📐 Canvas & Pose | ✅ PASS | Facing right, side view, transparent background. |
| 6 | 🏛️ Character Recognition | ✅ PASS | Rod of Asclepius (single serpent on staff) = instant medical deity recognition. |

**Score: 5 / 6** — REQUIRES REDESIGN  
**Redesign**: Scale to 70% frame height.

---

### 8. Orpheus (`orpheus.png`) — Class A

| # | Criterion | Grade | Notes |
|---|-----------|-------|-------|
| 1 | 🔍 64px Readability | ✅ PASS | Lyre held forward is clearly identifiable as the key feature. |
| 2 | 🚫 Palette & No-Gold | ✅ PASS | Bone/Ink/Blood. Sash in Blood. No gold. |
| 3 | 📏 Tier Scale | ❌ FAIL | **Figure fills ~90% of frame.** Should be ~70%. |
| 4 | 🎨 Woodcut Technique | ✅ PASS | Clean linework. |
| 5 | 📐 Canvas & Pose | ❌ FAIL | **Baked border/frame visible** — dark ink border around entire image creates a matted rectangle. This is NOT transparent background. It appears as a woodblock print WITH its border. |
| 6 | 🏛️ Character Recognition | ✅ PASS | Lyre + poet robes = Orpheus. |

**Score: 4 / 6** — REQUIRES REDESIGN  
**Redesign**: (1) **Remove the baked woodblock print border** — must be pure RGBA transparent. (2) Scale to 70% frame height.

---

### 9. Dionysus (`dionysus.png`) — Class A

| # | Criterion | Grade | Notes |
|---|-----------|-------|-------|
| 1 | 🔍 64px Readability | ✅ PASS | Thyrsus + grape wreath + drinking cup create good feature mass. |
| 2 | 🚫 Palette & No-Gold | ✅ PASS | Bone/Ink/Blood. Grapes and thyrsus tip in Blood. No gold. |
| 3 | 📏 Tier Scale | ❌ FAIL | **Figure fills ~90% of frame.** Should be ~70%. |
| 4 | 🎨 Woodcut Technique | ✅ PASS | Lovely drapery linework with controlled hatching. |
| 5 | 📐 Canvas & Pose | ✅ PASS | Facing right, side view, transparent background. |
| 6 | 🏛️ Character Recognition | ✅ PASS | Grape wreath + thyrsus staff + kantharos cup = undeniably Dionysus. |

**Score: 5 / 6** — REQUIRES REDESIGN  
**Redesign**: Scale to 70% frame height.

---

### 10. Aeneas (`aeneas.png`) — Class A

| # | Criterion | Grade | Notes |
|---|-----------|-------|-------|
| 1 | 🔍 64px Readability | ❌ FAIL | At 64px, this reads as "another armored Greek warrior with shield and spear" — almost identical silhouette to Hoplite and Achilles. The boar emblem on the shield is unreadable at target size. |
| 2 | 🚫 Palette & No-Gold | ✅ PASS | Bone/Ink/Blood. Boar emblem in Blood. No gold. |
| 3 | 📏 Tier Scale | ❌ FAIL | **Figure fills ~93% of frame.** Should be ~70%. |
| 4 | 🎨 Woodcut Technique | ✅ PASS | Strong bold linework. |
| 5 | 📐 Canvas & Pose | ✅ PASS | Facing right, side view, transparent background. |
| 6 | 🏛️ Character Recognition | ❌ FAIL | **Generic warrior problem**: Aeneas, Achilles, and Hoplite are nearly interchangeable at 64px. Needs a uniquely Aeneas-specific silhouette element (e.g., carrying his father Anchises on his back, or the Palladium). |

**Score: 3 / 6** — REQUIRES REDESIGN  
**Redesign**: (1) Scale to 70% frame height. (2) Replace the round shield with a distinctly different element (tower shield per the code spec, or Anchises on back). (3) Ensure silhouette is immediately differentiable from Hoplite and Achilles.

---

## 🏛️ GOD TIER (Zeus, Hera, Poseidon, Hades, Athena, Ares, Aphrodite, Hephaestus, Apollo, Artemis) — Expected ~85% frame height

---

### 11. Zeus (`zeus.png`) — Class A

| # | Criterion | Grade | Notes |
|---|-----------|-------|-------|
| 1 | 🔍 64px Readability | ✅ PASS | Thunderbolt + beard + majestic robes read strongly. |
| 2 | 🚫 Palette & No-Gold | ✅ PASS | Bone/Ink/Blood. Thunderbolt in Blood Red. No gold. |
| 3 | 📏 Tier Scale | ❌ FAIL | **Figure fills ~93% of frame.** Should be ~85%. Close but still non-compliant. |
| 4 | 🎨 Woodcut Technique | ✅ PASS | Excellent drapery folds, bold chisel strokes, high contrast. Best God-tier execution. |
| 5 | 📐 Canvas & Pose | ❌ FAIL | **White background detected** — not RGBA transparent. The background appears as solid white, not the transparency checkerboard. |
| 6 | 🏛️ Character Recognition | ✅ PASS | Thunderbolt + full beard + aegis = unmistakably Zeus. |

**Score: 4 / 6** — REQUIRES REDESIGN  
**Redesign**: (1) Re-export with proper RGBA transparency. (2) Scale to 85% frame height.

---

### 12. Hera (`hera.png`) — Class A

| # | Criterion | Grade | Notes |
|---|-----------|-------|-------|
| 1 | 🔍 64px Readability | ✅ PASS | Tall crown + peacock sceptre create a distinctive vertical silhouette. |
| 2 | 🚫 Palette & No-Gold | ✅ PASS | Bone/Ink/Blood. Cloak accents in Blood. No gold. |
| 3 | 📏 Tier Scale | ❌ FAIL | **Figure fills ~93% of frame.** Should be ~85%. |
| 4 | 🎨 Woodcut Technique | ✅ PASS | Richly hatched drapery. Bold linework. Peacock feather detail is handled well. |
| 5 | 📐 Canvas & Pose | ✅ PASS | Facing right, side view, transparent background. |
| 6 | 🏛️ Character Recognition | ✅ PASS | Crown + peacock-feathered sceptre = Hera. |

**Score: 5 / 6** — REQUIRES REDESIGN  
**Redesign**: Scale to 85% frame height.

---

### 13. Poseidon (`poseidon.png`) — Class A

| # | Criterion | Grade | Notes |
|---|-----------|-------|-------|
| 1 | 🔍 64px Readability | ❌ FAIL | **Overly dense wave/scroll ornamental detail** fills the entire lower body and hair region. At 64px, the swirling wave motifs collapse into visual noise that competes with the trident. The trident prongs are small relative to the overwhelming decorative mass. |
| 2 | 🚫 Palette & No-Gold | ✅ PASS | Bone/Ink/Blood. Trident prongs in Blood. No gold. |
| 3 | 📏 Tier Scale | ❌ FAIL | **Figure fills ~95% of frame.** Should be ~85%. |
| 4 | 🎨 Woodcut Technique | ❌ FAIL | **Over-decorated**: The spiral wave motifs, Greek key borders, and swirling hair create dense decorative fields that violate the "restraint" criterion. This reads more as Art Nouveau illustration than severe woodblock print. Cross-hatching and ornamental fill are excessive. |
| 5 | 📐 Canvas & Pose | ❌ FAIL | **White/off-white background detected** — not RGBA transparent. |
| 6 | 🏛️ Character Recognition | ✅ PASS | Trident + wild beard + wave motifs = Poseidon. |

**Score: 2 / 6** — REQUIRES REDESIGN  
**Redesign**: (1) Drastically simplify wave ornaments — waves should be 2-3 bold chisel strokes, not scrollwork filigree. (2) Enlarge trident prongs to dominate the silhouette. (3) Fix background to RGBA transparent. (4) Scale to 85% frame height. (5) Reduce hair ornament density.

---

### 14. Hades (`hades.png`) — Class B (Rasterizer)

| # | Criterion | Grade | Notes |
|---|-----------|-------|-------|
| 1 | 🔍 64px Readability | ❌ FAIL | At 64px, this is a dark ink rectangle with two small prongs at top and a red stripe. Completely unreadable as a character. |
| 2 | 🚫 Palette & No-Gold | ✅ PASS | Uses only Ink/Blood/Bone palette. No gold. |
| 3 | 📏 Tier Scale | ❌ FAIL | **Figure fills ~80% of frame but has no feet/baseline** — the shape floats ambiguously. No visible feet anchoring to a baseline. |
| 4 | 🎨 Woodcut Technique | ❌ FAIL | **Not woodcut at all** — flat geometric shapes (rectangles, circles, line hatching) with no chisel linework, no hatching, no chiaroscuro. This is geometric abstract art, not Style C-B. |
| 5 | 📐 Canvas & Pose | ❌ FAIL | **No discernible facing direction** — the shape is symmetrical with no side-view pose. The hatching extends beyond character bounds creating a non-transparent "hatch field" background. |
| 6 | 🏛️ Character Recognition | ❌ FAIL | This could be anything — a lighthouse, a chess piece, an abstract logo. Zero mythological character recognition. |

**Score: 1 / 6** — REQUIRES COMPLETE REDRAW  
**Redesign**: Complete redraw from scratch in the Class A style. Needs: shadowed Helm of Darkness, bident weapon, heavy dark robes, menacing stillness, proper woodcut technique, transparent background.

---

### 15. Athena (`athena.png`) — Class B (Rasterizer)

| # | Criterion | Grade | Notes |
|---|-----------|-------|-------|
| 1 | 🔍 64px Readability | ❌ FAIL | At 64px this reads as a stick figure with a vertical line and a small triangle. The owl (tiny circle) vanishes entirely. |
| 2 | 🚫 Palette & No-Gold | ✅ PASS | Ink/Blood/Bone only. No gold. |
| 3 | 📏 Tier Scale | ❌ FAIL | Figure proportions are wrong — very tall and narrow, not matching God tier ~85% spec in a recognizable way. |
| 4 | 🎨 Woodcut Technique | ❌ FAIL | Flat geometric shapes, no woodcut technique whatsoever. |
| 5 | 📐 Canvas & Pose | ❌ FAIL | Hatching background extends across canvas. No transparent background. No clear facing direction. |
| 6 | 🏛️ Character Recognition | ❌ FAIL | Unrecognizable as Athena — no crested helm, no visible aegis, owl is a 24px dot at this scale. |

**Score: 1 / 6** — REQUIRES COMPLETE REDRAW

---

### 16. Ares (`ares.png`) — Class B (Rasterizer)

| # | Criterion | Grade | Notes |
|---|-----------|-------|-------|
| 1 | 🔍 64px Readability | ❌ FAIL | Dark rectangle with a red circle = unreadable as a character. |
| 2 | 🚫 Palette & No-Gold | ✅ PASS | Ink/Blood/Bone only. |
| 3 | 📏 Tier Scale | ❌ FAIL | No baseline anchoring, no feet, no anatomical proportions. |
| 4 | 🎨 Woodcut Technique | ❌ FAIL | Flat geometric primitives. No woodcut technique. |
| 5 | 📐 Canvas & Pose | ❌ FAIL | Hatching background. No transparency. No facing direction. |
| 6 | 🏛️ Character Recognition | ❌ FAIL | Cannot be recognized as the god of war or any specific character. |

**Score: 1 / 6** — REQUIRES COMPLETE REDRAW

---

### 17. Aphrodite (`aphrodite.png`) — Class B (Rasterizer)

| # | Criterion | Grade | Notes |
|---|-----------|-------|-------|
| 1 | 🔍 64px Readability | ❌ FAIL | A bone-colored cone with a red inner cone and a small circle at top. Not recognizable as a figure. |
| 2 | 🚫 Palette & No-Gold | ✅ PASS | Ink/Blood/Bone only. |
| 3 | 📏 Tier Scale | ❌ FAIL | No feet, no baseline, no anatomy. |
| 4 | 🎨 Woodcut Technique | ❌ FAIL | Flat geometric shapes. No woodcut technique. |
| 5 | 📐 Canvas & Pose | ❌ FAIL | Hatching extends across canvas. No transparency. No facing direction. |
| 6 | 🏛️ Character Recognition | ❌ FAIL | Completely unrecognizable as Aphrodite. No mirror, no dove (the dove is a tiny dot), no flowing drapery. |

**Score: 1 / 6** — REQUIRES COMPLETE REDRAW

---

### 18. Hephaestus (`hephaestus.png`) — Class B (Rasterizer)

| # | Criterion | Grade | Notes |
|---|-----------|-------|-------|
| 1 | 🔍 64px Readability | ❌ FAIL | Dark rectangle with a bone circle head and a small red square — unreadable. |
| 2 | 🚫 Palette & No-Gold | ✅ PASS | Ink/Blood/Bone only. |
| 3 | 📏 Tier Scale | ❌ FAIL | No anatomical proportions. No baseline. |
| 4 | 🎨 Woodcut Technique | ❌ FAIL | Flat geometric primitives. No woodcut. |
| 5 | 📐 Canvas & Pose | ❌ FAIL | Hatching background. No transparency. |
| 6 | 🏛️ Character Recognition | ❌ FAIL | Unrecognizable as the smith god. |

**Score: 1 / 6** — REQUIRES COMPLETE REDRAW

---

### 19. Apollo (`apollo.png`) — Class B (Rasterizer)

| # | Criterion | Grade | Notes |
|---|-----------|-------|-------|
| 1 | 🔍 64px Readability | ❌ FAIL | A cone shape with blood-red rays around a head circle. At 64px this is an indistinct red/brown smear. |
| 2 | 🚫 Palette & No-Gold | ✅ PASS | Ink/Blood/Bone only. |
| 3 | 📏 Tier Scale | ❌ FAIL | No anatomical proportions or baseline. |
| 4 | 🎨 Woodcut Technique | ❌ FAIL | Flat geometric primitives. No woodcut. |
| 5 | 📐 Canvas & Pose | ❌ FAIL | Hatching background. No transparency. |
| 6 | 🏛️ Character Recognition | ❌ FAIL | The radiating lines vaguely suggest a sun motif, but no lyre, no laurel, no bow — unrecognizable. |

**Score: 1 / 6** — REQUIRES COMPLETE REDRAW

---

### 20. Artemis (`artemis.png`) — Class B (Rasterizer)

| # | Criterion | Grade | Notes |
|---|-----------|-------|-------|
| 1 | 🔍 64px Readability | ❌ FAIL | A stepped rectangle with a small red dot head and a blood-red horizontal line. Unreadable. |
| 2 | 🚫 Palette & No-Gold | ✅ PASS | Ink/Blood/Bone only. |
| 3 | 📏 Tier Scale | ❌ FAIL | No anatomical proportions. No baseline. |
| 4 | 🎨 Woodcut Technique | ❌ FAIL | Flat geometric primitives. No woodcut. |
| 5 | 📐 Canvas & Pose | ❌ FAIL | Hatching background. No transparency. The stepped block at bottom reads as a staircase. |
| 6 | 🏛️ Character Recognition | ❌ FAIL | Unrecognizable as the huntress goddess. No bow, no quiver, no crescent moon, no hound. |

**Score: 1 / 6** — REQUIRES COMPLETE REDRAW

---

## 👹 TITAN TIER (Cronus, Typhon) — Expected 100% frame height

---

### 21. Cronus (`cronus.png`) — Class B (Rasterizer)

| # | Criterion | Grade | Notes |
|---|-----------|-------|-------|
| 1 | 🔍 64px Readability | ❌ FAIL | A dark tapered rectangle with a red inner stripe, a circle head, and a triangular blade. At 64px this is an unreadable dark mass. |
| 2 | 🚫 Palette & No-Gold | ✅ PASS | Ink/Blood/Bone only. |
| 3 | 📏 Tier Scale | ✅ PASS | Fills the full frame as intended for Titan tier. |
| 4 | 🎨 Woodcut Technique | ❌ FAIL | Flat geometric shapes. No woodcut. |
| 5 | 📐 Canvas & Pose | ❌ FAIL | No facing direction. No transparency (hatching extends into "background"). |
| 6 | 🏛️ Character Recognition | ❌ FAIL | The blade shape vaguely suggests a scythe but the overall form is unrecognizable as Cronus. |

**Score: 1 / 6** — REQUIRES COMPLETE REDRAW

---

### 22. Typhon (`typhon.png`) — Class B (Rasterizer)

| # | Criterion | Grade | Notes |
|---|-----------|-------|-------|
| 1 | 🔍 64px Readability | ❌ FAIL | Three circles + triangles + crossed thick lines. Reads as an abstract logo at 64px. |
| 2 | 🚫 Palette & No-Gold | ✅ PASS | Ink/Blood only. |
| 3 | 📏 Tier Scale | ❌ FAIL | **Inverted layout** — the figure is top-heavy with all mass in the upper third, and the "legs" (serpentine coils) do not reach the canvas bottom. Baseline is ~y:950 but content does not fill 100% height. |
| 4 | 🎨 Woodcut Technique | ❌ FAIL | Flat geometric shapes. No woodcut. |
| 5 | 📐 Canvas & Pose | ❌ FAIL | No facing direction. No clear transparency. |
| 6 | 🏛️ Character Recognition | ❌ FAIL | The three circles could suggest "multiple heads" but overall this is unrecognizable as Typhon. No serpentine legs, no wings in a recognizable form. |

**Score: 1 / 6** — REQUIRES COMPLETE REDRAW

---

## 📊 Roster Summary

| Unit | Tier | Class | Score | Verdict |
|------|------|-------|-------|---------|
| Hoplite | Chaff | A | **5/6** | ⚠️ REDESIGN (scale) |
| Satyr | Chaff | A | **5/6** | ⚠️ REDESIGN (scale) |
| Harpy | Chaff | A | **3/6** | 🔴 REDESIGN (pose, scale, readability) |
| Heracles | Demigod | A | **4/6** | ⚠️ REDESIGN (scale, ground shadow) |
| Perseus | Demigod | A | **5/6** | ⚠️ REDESIGN (scale) |
| Achilles | Demigod | A | **4/6** | ⚠️ REDESIGN (scale, differentiation) |
| Asclepius | Demigod | A | **5/6** | ⚠️ REDESIGN (scale) |
| Orpheus | Demigod | A | **4/6** | ⚠️ REDESIGN (scale, remove border) |
| Dionysus | Demigod | A | **5/6** | ⚠️ REDESIGN (scale) |
| Aeneas | Demigod | A | **3/6** | 🔴 REDESIGN (scale, differentiation) |
| Zeus | God | A | **4/6** | ⚠️ REDESIGN (scale, transparency) |
| Hera | God | A | **5/6** | ⚠️ REDESIGN (scale) |
| Poseidon | God | A | **2/6** | 🔴 REDESIGN (multiple failures) |
| Hades | God | B | **1/6** | 🔴 COMPLETE REDRAW |
| Athena | God | B | **1/6** | 🔴 COMPLETE REDRAW |
| Ares | God | B | **1/6** | 🔴 COMPLETE REDRAW |
| Aphrodite | God | B | **1/6** | 🔴 COMPLETE REDRAW |
| Hephaestus | God | B | **1/6** | 🔴 COMPLETE REDRAW |
| Apollo | God | B | **1/6** | 🔴 COMPLETE REDRAW |
| Artemis | God | B | **1/6** | 🔴 COMPLETE REDRAW |
| Cronus | Titan | B | **1/6** | 🔴 COMPLETE REDRAW |
| Typhon | Titan | B | **1/6** | 🔴 COMPLETE REDRAW |

---

## Overall Verdict

> **🔴 REQUIRES REDESIGN — 0 of 22 sprites approved for production**
> 
> **No sprites pass all 6 criteria.** The roster cannot ship in its current state.

### Pass rate by criterion (across all 22 sprites):

| Criterion | Pass | Fail | Rate |
|-----------|------|------|------|
| 1. 64px Readability | 11 | 11 | 50% |
| 2. No-Gold / Palette | **22** | 0 | **100%** ✅ |
| 3. Tier Scale & Baseline | 1 | 21 | 5% |
| 4. Woodcut Technique | 13 | 9 | 59% |
| 5. Canvas & Pose | 9 | 13 | 41% |
| 6. Character Recognition | 13 | 9 | 59% |

> **NOTE**: The **only universally passing criterion is palette compliance** — all 22 sprites correctly avoid gold and use only Bone/Ink/Blood. The rasterizer palette constants were correctly defined and the external generation prompts respected the constraint. This is a solid foundation.

---

## 🔧 Actionable Redesign Checklist

### Priority 1: Complete Redraws (9 sprites) — BLOCKING
These Class B rasterizer sprites are placeholder-quality geometric primitives that share no visual DNA with Style C-B. They must be completely redrawn in the Class A high-detail woodcut style:

1. **Hades** — Shadowed Helm of Darkness, bident, heavy dark robes, menacing stillness
2. **Athena** — Prominent crested Corinthian helm, aegis breastplate, spear, owl on shoulder
3. **Ares** — Full-face war helm with visor slit, aggressive forward stance, spear + round shield
4. **Aphrodite** — Flowing drapery cascade, hand mirror, dove, elegant pose
5. **Hephaestus** — Broad stocky build, massive smith hammer, forge apron, tongs
6. **Apollo** — Radiating sun-ray halo (chisel lines, not geometric), lyre OR bow, laurel wreath
7. **Artemis** — Drawn bow with nocked arrow, quiver on back, crescent moon diadem, hound at heel
8. **Cronus** — Colossal devouring menace, harpe scythe dominating frame, open maw
9. **Typhon** — Serpentine lower coils, multiple heads, vast wings, monstrous scale

### Priority 2: Global Scale Correction (ALL 22 sprites) — BLOCKING
Every single Class A sprite fills 88–95% of the frame regardless of tier. The spec requires:
- **Chaff** (Hoplite, Satyr, Harpy): ~55% frame height → ~563px figure in 1024px canvas
- **Demigod**: ~70% frame height → ~717px figure
- **God**: ~85% frame height → ~870px figure
- **Titan**: 100% frame height → ~1024px figure (Cronus is the only one near correct)

> **IMPORTANT**: The renderer already has a **workaround** in `src/render/draw.ts` (lines 136–153) that scales sprites per-tier at render time (the `SPRITE_TIER_SCALE` map). This confirms the art team already knows the scale is wrong — the code comments explicitly call this out. However, this runtime scaling **compounds quality loss** at 64px and should not be the permanent solution.

### Priority 3: Background & Canvas Fixes
- **Zeus, Poseidon**: Remove white/off-white opaque backgrounds → pure RGBA transparent
- **Heracles**: Remove baked ground shadow/rubble beneath sandals  
- **Orpheus**: Remove baked woodblock print border/frame
- **All Class B sprites**: Remove the diagonal hatching "background" that extends across the canvas

### Priority 4: Pose & Silhouette Corrections
- **Harpy**: Redraw in right-facing side view with wings folded, not spread-front
- **Achilles**: Differentiate from Hoplite silhouette (exaggerate cloak, add heel detail)
- **Aeneas**: Differentiate from Hoplite/Achilles (carry Anchises, or use tower shield instead of round)

### Priority 5: Detail Density
- **Poseidon**: Drastically reduce wave scroll ornament density; simplify to bold chisel strokes
