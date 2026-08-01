#!/usr/bin/env python3
"""
Style C-B (Bold Woodcut) — production sprite generator v2.

Addresses every finding from docs/SPRITE_ART_AUDIT.md:
  Priority 1 — Complete redraw of 9 Class-B placeholders (Hades, Athena,
               Ares, Aphrodite, Hephaestus, Apollo, Artemis, Cronus, Typhon)
  Priority 2 — Correct tier scaling for all 22 sprites
  Priority 3 — Clean RGBA transparency on every sprite
  Priority 4 — Right-facing side-view poses; unique silhouettes for
               Harpy, Achilles, and Aeneas
  Priority 5 — Restraint in decoration density (Poseidon)

Palette: INK / BONE / BLOOD only. No gold on any character.
Canvas: 1024×1024, RGBA transparent background, side-view facing right.
"""

import os
import math
from rasterizer import Canvas2D, INK, BONE, BLOOD

OUT = os.path.dirname(os.path.abspath(__file__))
S = 1024

# ── Tier geometry (Priority 2) ─────────────────────────────────────────────
# Shared foot baseline for chaff / demigod / god.  Titans use their own.
FEET = 880

CHAFF_TOP  = FEET - int(S * 0.55)   # 317 — figure is 563 px tall
DEMI_TOP   = FEET - int(S * 0.70)   # 163 — 717 px
GOD_TOP    = FEET - int(S * 0.85)   # 10  — 870 px
TITAN_TOP  = 22
TITAN_FEET = 1000                    # ~978 px tall

# ── Drawing helpers ────────────────────────────────────────────────────────

def shade(cv, cx, y0, y1, half_w, step=24, color=INK, thick=3):
    """Sparse diagonal shadow strokes confined within a body column.
    Style C-B calls for graphic shadow shapes, not dense hatch fields."""
    left  = cx - half_w + 6
    right = cx + half_w - 6
    y = y0 + 8
    while y < y1 - 8:
        cv.draw_chisel_line(left, y, right, y + step // 2, thick, color)
        y += step


def legs_standing(cv, cx, hip_y, feet_y, spread=20, thick=22, color=INK):
    """Two standing legs, slightly splayed."""
    cv.draw_chisel_line(cx - spread, hip_y,
                        cx - spread - 6, feet_y, thick, color)
    cv.draw_chisel_line(cx + spread, hip_y,
                        cx + spread + 6, feet_y, thick, color)


def body_torso(cv, cx, shoulder_y, hip_y, sw, hw, color=BONE):
    """Tapered torso polygon: wider at shoulders, narrower at hips."""
    cv.fill_polygon([
        (cx - sw, shoulder_y), (cx + sw, shoulder_y),
        (cx + hw, hip_y),      (cx - hw, hip_y),
    ], color)


def helm_crested(cv, cx, head_y, hr, crest_color=BLOOD):
    """Corinthian helmet with a tall side crest."""
    cv.fill_circle(cx, head_y, hr + 6, INK)
    cv.fill_rect(cx + 4, head_y - 4, cx + hr + 8, head_y + 4, BONE)
    cv.fill_polygon([
        (cx - hr,      head_y - hr - 2),
        (cx + hr + 18, head_y - hr - 22),
        (cx + hr + 14, head_y - hr + 8),
    ], crest_color)


def shield_round(cv, scx, scy, r, emblem_color=BLOOD, emblem_fn=None):
    """Concentric round shield: INK rim → BONE face → INK inner ring."""
    cv.fill_circle(scx, scy, r + 8, INK)
    cv.fill_circle(scx, scy, r, BONE)
    cv.fill_circle(scx, scy, r - 12, INK)
    if emblem_fn:
        emblem_fn(cv, scx, scy, r)


def spear_right(cv, base_x, base_y, tip_x, tip_y, shaft=8, head_size=22):
    """Spear extending right. Shaft in INK+BONE, leaf head in BLOOD."""
    cv.draw_chisel_line(base_x, base_y, tip_x, tip_y, shaft, INK)
    cv.draw_chisel_line(base_x, base_y, tip_x, tip_y, shaft // 2, BONE)
    cv.fill_polygon([
        (tip_x,             tip_y + 6),
        (tip_x + head_size, tip_y - head_size // 2),
        (tip_x + 4,         tip_y - head_size // 3),
    ], BLOOD)


def _save(cv, name):
    cv.export_png(os.path.join(OUT, name))
    print(f'  ✓ {name}')


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  CHAFF TIER — 55 % frame height  (top 317, feet 880, height 563 px)    ║
# ╚══════════════════════════════════════════════════════════════════════════╝

def render_hoplite():
    """Greek foot soldier. Aspis shield (~40% visual mass) + crested helm + spear."""
    cv = Canvas2D(S, S)
    T, F = CHAFF_TOP, FEET
    H = F - T  # 563
    cx = 490

    head_y  = T + int(H * 0.07)
    shldr_y = T + int(H * 0.17)
    hip_y   = T + int(H * 0.56)
    hr  = int(H * 0.055)
    sw  = int(H * 0.10)
    hw  = int(H * 0.07)

    # Cloak behind body
    cv.fill_polygon([(cx - sw - 5, shldr_y), (cx - sw - 30, F),
                      (cx - hw + 10, F), (cx - hw, hip_y)], BLOOD)

    legs_standing(cv, cx, hip_y, F, spread=int(H * 0.04), thick=int(H * 0.04))

    # Cuirass torso
    body_torso(cv, cx, shldr_y, hip_y, sw, hw)
    shade(cv, cx, shldr_y + 5, hip_y - 5, sw - 4, step=int(H * 0.05))

    # === Aspis shield (dominant, left of body) ===
    shld_cx = cx - int(H * 0.17)
    shld_cy = T + int(H * 0.44)
    shld_r  = int(H * 0.20)
    def lambda_emblem(cv2, scx, scy, r):
        cv2.fill_polygon([(scx - 18, scy + 14),
                          (scx, scy - 28),
                          (scx + 18, scy + 14)], BLOOD)
    shield_round(cv, shld_cx, shld_cy, shld_r, emblem_fn=lambda_emblem)

    # Crested Corinthian helm
    helm_crested(cv, cx, head_y, hr)

    # Spear extending right
    spear_right(cv,
                cx - int(H * 0.08), T + int(H * 0.70),
                cx + int(H * 0.38), T + int(H * 0.14))

    _save(cv, 'hoplite.png')


def render_satyr():
    """Goat-legged reveller. Bent goat legs + horns + pan pipes. Small and wiry."""
    cv = Canvas2D(S, S)
    T, F = CHAFF_TOP, FEET
    H = F - T
    cx = 490

    head_y  = T + int(H * 0.07)
    shldr_y = T + int(H * 0.17)
    hip_y   = T + int(H * 0.52)
    hr  = int(H * 0.05)
    sw  = int(H * 0.08)
    hw  = int(H * 0.06)

    # === Bent goat legs (distinctive silhouette) ===
    knee_y = T + int(H * 0.72)
    hock_y = T + int(H * 0.85)
    # Left leg: hip → backward knee → forward hock → hoof
    cv.fill_polygon([
        (cx - 18, hip_y), (cx - 24, hip_y + 5),
        (cx - 35, knee_y), (cx - 22, hock_y),
        (cx - 30, F), (cx - 20, F),
        (cx - 14, hock_y), (cx - 28, knee_y),
    ], INK)
    # Right leg
    cv.fill_polygon([
        (cx + 18, hip_y), (cx + 24, hip_y + 5),
        (cx + 35, knee_y), (cx + 22, hock_y),
        (cx + 30, F), (cx + 20, F),
        (cx + 14, hock_y), (cx + 28, knee_y),
    ], INK)
    # Fur texture on legs
    for y in range(hip_y + 15, F - 20, int(H * 0.06)):
        cv.draw_chisel_line(cx - 35, y, cx - 18, y + 8, 4, BONE)
        cv.draw_chisel_line(cx + 18, y, cx + 35, y + 8, 4, BONE)

    # Wiry torso
    body_torso(cv, cx, shldr_y, hip_y, sw, hw)
    shade(cv, cx, shldr_y + 5, hip_y - 5, sw - 3, step=int(H * 0.06))

    # Red sash at waist
    cv.fill_polygon([(cx - sw - 3, hip_y - 15), (cx + sw + 3, hip_y - 8),
                      (cx + sw, hip_y + 10), (cx - sw, hip_y + 15)], BLOOD)

    # Head
    cv.fill_circle(cx, head_y, hr, BONE)

    # === Short curved horns (key feature) ===
    cv.fill_polygon([(cx - 12, head_y - hr),
                      (cx - 22, head_y - hr - int(H * 0.08)),
                      (cx - 5, head_y - hr + 5)], INK)
    cv.fill_polygon([(cx + 12, head_y - hr),
                      (cx + 22, head_y - hr - int(H * 0.08)),
                      (cx + 5, head_y - hr + 5)], INK)

    # === Pan pipes held at mouth level (key feature) ===
    pipes_x = cx + int(H * 0.10)
    pipes_y = head_y
    pw = int(H * 0.10)
    cv.fill_rect(pipes_x, pipes_y - 5, pipes_x + pw, pipes_y + int(H * 0.08), INK)
    for px in range(pipes_x + 3, pipes_x + pw - 3, 6):
        cv.draw_chisel_line(px, pipes_y - 3, px, pipes_y + int(H * 0.07), 2, BONE)

    _save(cv, 'satyr.png')


def render_harpy():
    """Bird-woman. RIGHT-FACING side view with wings swept back, not frontal.
    Priority 4 fix: redraw from spread-front to folded side view."""
    cv = Canvas2D(S, S)
    T, F = CHAFF_TOP, FEET
    H = F - T
    cx = 470

    head_y  = T + int(H * 0.07)
    shldr_y = T + int(H * 0.16)
    hip_y   = T + int(H * 0.50)
    hr  = int(H * 0.045)
    sw  = int(H * 0.07)

    # === Wings swept back (folded, extending behind/right) ===
    # Primary wing — large swept shape behind the body
    cv.fill_polygon([
        (cx - 10, shldr_y),
        (cx - int(H * 0.28), T - int(H * 0.02)),       # wing tip up-left
        (cx - int(H * 0.22), T + int(H * 0.25)),
        (cx - int(H * 0.10), hip_y - 20),
    ], INK)
    # Secondary wing edge visible behind
    cv.fill_polygon([
        (cx + 10, shldr_y + 10),
        (cx - int(H * 0.15), T + int(H * 0.05)),
        (cx - int(H * 0.08), T + int(H * 0.30)),
    ], INK)
    # Feather texture on wings
    for wy in range(T + 10, T + int(H * 0.30), int(H * 0.04)):
        cv.draw_chisel_line(cx - int(H * 0.24), wy,
                            cx - int(H * 0.06), wy + 12, 4, BONE)

    # Gaunt body
    cv.fill_polygon([
        (cx - sw, shldr_y), (cx + sw, shldr_y),
        (cx + sw - 5, hip_y), (cx - sw + 5, hip_y),
    ], BONE)
    shade(cv, cx, shldr_y + 5, hip_y - 5, sw - 3, step=int(H * 0.06))

    # === Taloned bird legs (key feature) ===
    cv.draw_chisel_line(cx - 8, hip_y, cx - 12, F - 15, 14, INK)
    cv.draw_chisel_line(cx + 8, hip_y, cx + 12, F - 15, 14, INK)
    # Talons
    cv.fill_polygon([(cx - 20, F), (cx - 5, F - 15), (cx + 5, F)], BLOOD)
    cv.fill_polygon([(cx + 5, F), (cx + 18, F - 15), (cx + 25, F)], BLOOD)

    # Head with sharp beak
    cv.fill_circle(cx, head_y, hr, BONE)
    cv.fill_polygon([
        (cx + hr, head_y - 3),
        (cx + hr + int(H * 0.08), head_y + 3),
        (cx + hr, head_y + 5),
    ], BLOOD)

    _save(cv, 'harpy.png')


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  DEMIGOD TIER — 70 % frame height  (top 163, feet 880, height 717 px)  ║
# ╚══════════════════════════════════════════════════════════════════════════╝

def render_heracles():
    """Lion pelt hood + massive knotted club. Heaviest demigod silhouette.
    Priority 3: no ground shadow/rubble beneath feet."""
    cv = Canvas2D(S, S)
    T, F = DEMI_TOP, FEET
    H = F - T
    cx = 470

    head_y  = T + int(H * 0.07)
    shldr_y = T + int(H * 0.15)
    hip_y   = T + int(H * 0.52)
    hr  = int(H * 0.055)
    sw  = int(H * 0.11)
    hw  = int(H * 0.08)

    # === Nemean lion pelt cloak (major mass, behind body) ===
    cv.fill_polygon([
        (cx - sw - 10, shldr_y - 10),
        (cx - sw - 25, F),
        (cx - hw + 15, F),
        (cx - hw + 5, hip_y + 30),
    ], INK)
    # Pelt fur texture
    for ly in range(shldr_y, F - 30, int(H * 0.05)):
        cv.draw_chisel_line(cx - sw - 20, ly,
                            cx - sw - 5, ly + 12, 5, BONE)

    # Heavy legs
    legs_standing(cv, cx, hip_y, F, spread=int(H * 0.04), thick=int(H * 0.05))

    # Muscular torso
    body_torso(cv, cx, shldr_y, hip_y, sw, hw)
    shade(cv, cx, shldr_y + 5, hip_y - 5, sw - 4, step=int(H * 0.04))

    # === Lion-head hood (distinctive) ===
    cv.fill_circle(cx, head_y, hr + 10, INK)   # lion skull mass
    # Lion maw (open jaws framing face)
    cv.fill_polygon([
        (cx + hr + 5, head_y - 8),
        (cx + hr + 18, head_y + 8),
        (cx + hr + 5, head_y + 12),
    ], BLOOD)
    cv.fill_rect(cx - 3, head_y - 4, cx + hr, head_y + 4, BONE)  # face visible

    # === Massive knotted club (extends far right — key feature) ===
    club_base_x = cx + int(H * 0.06)
    club_base_y = T + int(H * 0.42)
    club_tip_x  = cx + int(H * 0.42)
    club_tip_y  = T + int(H * 0.10)
    cv.draw_chisel_line(club_base_x, club_base_y,
                        club_tip_x, club_tip_y, int(H * 0.05), INK)
    # Knotted head
    cv.fill_circle(club_tip_x, club_tip_y, int(H * 0.06), INK)
    cv.fill_circle(club_tip_x, club_tip_y, int(H * 0.04), BLOOD)

    _save(cv, 'heracles.png')


def render_perseus():
    """Winged sandals + curved harpe sword + mirrored shield."""
    cv = Canvas2D(S, S)
    T, F = DEMI_TOP, FEET
    H = F - T
    cx = 480

    head_y  = T + int(H * 0.07)
    shldr_y = T + int(H * 0.15)
    hip_y   = T + int(H * 0.52)
    hr  = int(H * 0.05)
    sw  = int(H * 0.09)
    hw  = int(H * 0.07)

    legs_standing(cv, cx, hip_y, F, spread=int(H * 0.035), thick=int(H * 0.035))

    # === Winged sandals (distinctive feature at feet) ===
    cv.fill_polygon([
        (cx + int(H * 0.04), F - 25),
        (cx + int(H * 0.10), F - 35),
        (cx + int(H * 0.08), F - 15),
    ], BONE)
    cv.fill_polygon([
        (cx - int(H * 0.04), F - 25),
        (cx + int(H * 0.03), F - 38),
        (cx + int(H * 0.01), F - 15),
    ], BONE)

    # Athletic torso with harness
    body_torso(cv, cx, shldr_y, hip_y, sw, hw)
    shade(cv, cx, shldr_y + 5, hip_y - 5, sw - 3, step=int(H * 0.05))
    # Red harness straps
    cv.draw_chisel_line(cx - sw, shldr_y + 5, cx + hw, hip_y - 5, 5, BLOOD)
    cv.draw_chisel_line(cx + sw, shldr_y + 5, cx - hw, hip_y - 5, 5, BLOOD)

    # === Mirrored shield (concentric, left of body) ===
    shld_cx = cx - int(H * 0.14)
    shld_cy = T + int(H * 0.38)
    shld_r  = int(H * 0.12)
    cv.fill_circle(shld_cx, shld_cy, shld_r + 6, INK)
    cv.fill_circle(shld_cx, shld_cy, shld_r, BONE)
    cv.fill_circle(shld_cx, shld_cy, shld_r - 10, INK)
    cv.fill_circle(shld_cx, shld_cy, shld_r - 18, BONE)

    # Helm (simple cap, no crest — not Hoplite)
    cv.fill_circle(cx, head_y, hr + 4, INK)

    # === Curved harpe sword (key feature — extends right) ===
    harpe_x = cx + int(H * 0.08)
    harpe_y = T + int(H * 0.35)
    cv.draw_chisel_line(harpe_x, harpe_y,
                        cx + int(H * 0.30), T + int(H * 0.22), 12, INK)
    # Curved sickle tip
    cv.fill_polygon([
        (cx + int(H * 0.28), T + int(H * 0.22)),
        (cx + int(H * 0.38), T + int(H * 0.15)),
        (cx + int(H * 0.30), T + int(H * 0.26)),
    ], BLOOD)

    _save(cv, 'perseus.png')


def render_achilles():
    """Priority 4: differentiate from Hoplite — dramatic billowing cloak,
    extra-tall crest, and blood-red heel vulnerability marker."""
    cv = Canvas2D(S, S)
    T, F = DEMI_TOP, FEET
    H = F - T
    cx = 480

    head_y  = T + int(H * 0.07)
    shldr_y = T + int(H * 0.15)
    hip_y   = T + int(H * 0.52)
    hr  = int(H * 0.05)
    sw  = int(H * 0.09)
    hw  = int(H * 0.07)

    # === DRAMATIC BILLOWING CLOAK (extends far behind — silhouette breaker) ===
    cv.fill_polygon([
        (cx - sw, shldr_y),
        (cx - int(H * 0.30), hip_y + int(H * 0.10)),
        (cx - int(H * 0.25), F + 10),
        (cx - hw, F),
        (cx - hw, hip_y),
    ], BLOOD)
    # Cloak folds
    cv.draw_chisel_line(cx - int(H * 0.20), shldr_y + 30,
                        cx - int(H * 0.22), F - 20, 5, INK)
    cv.draw_chisel_line(cx - int(H * 0.14), shldr_y + 50,
                        cx - int(H * 0.18), F - 40, 4, INK)

    # Legs with ornate greaves
    legs_standing(cv, cx, hip_y, F, spread=int(H * 0.035), thick=int(H * 0.04))
    # Greaves
    knee_y = T + int(H * 0.74)
    cv.fill_rect(cx - int(H*0.05), knee_y, cx - int(H*0.02), F - 10, BLOOD)
    cv.fill_rect(cx + int(H*0.02), knee_y, cx + int(H*0.05), F - 10, BLOOD)

    # === Blood-red heel mark (vulnerability — key differentiator) ===
    cv.fill_circle(cx + int(H * 0.04), F - 5, 8, BLOOD)

    # Lean torso
    body_torso(cv, cx, shldr_y, hip_y, sw, hw)
    shade(cv, cx, shldr_y + 5, hip_y - 5, sw - 3, step=int(H * 0.05))

    # === Extra-tall crested helm (taller than Hoplite's) ===
    cv.fill_circle(cx, head_y, hr + 5, INK)
    cv.fill_rect(cx + 3, head_y - 3, cx + hr + 6, head_y + 3, BONE)
    # VERY tall crest
    cv.fill_polygon([
        (cx - hr - 2, head_y - hr),
        (cx + hr + 22, head_y - hr - int(H * 0.06)),
        (cx + hr + 18, head_y - hr + 6),
    ], BLOOD)
    cv.fill_polygon([
        (cx - hr + 3, head_y - hr + 2),
        (cx + hr + 16, head_y - hr - int(H * 0.04)),
        (cx + hr + 12, head_y - hr + 5),
    ], BONE)

    # Long spear
    spear_right(cv,
                cx - int(H * 0.12), T + int(H * 0.68),
                cx + int(H * 0.40), T + int(H * 0.12))

    _save(cv, 'achilles.png')


def render_asclepius():
    """Staff with SINGLE serpent coil + physician's robes."""
    cv = Canvas2D(S, S)
    T, F = DEMI_TOP, FEET
    H = F - T
    cx = 470

    head_y  = T + int(H * 0.07)
    shldr_y = T + int(H * 0.15)
    hip_y   = T + int(H * 0.50)
    hr  = int(H * 0.05)
    sw  = int(H * 0.09)
    hw  = int(H * 0.10)

    # Physician's robes (flowing, wider at bottom)
    cv.fill_polygon([
        (cx - sw, shldr_y), (cx + sw, shldr_y),
        (cx + hw + 10, F), (cx - hw - 10, F),
    ], BONE)
    shade(cv, cx, shldr_y + 10, F - 20, hw, step=int(H * 0.04))
    # Inner robe layer
    cv.fill_polygon([
        (cx - sw + 10, hip_y - 20), (cx + sw - 10, hip_y - 20),
        (cx + hw + 5, F), (cx - hw - 5, F),
    ], BLOOD)

    # Head with beard
    cv.fill_circle(cx, head_y, hr, INK)
    cv.fill_polygon([
        (cx - hr + 5, head_y + hr - 5),
        (cx + hr - 5, head_y + hr - 5),
        (cx, head_y + hr + int(H * 0.04)),
    ], BONE)

    # === Rod of Asclepius: tall staff with SINGLE coiling serpent ===
    staff_x = cx + int(H * 0.18)
    cv.draw_chisel_line(staff_x, T + int(H * 0.03), staff_x, F, 14, INK)
    # Single serpent coiling up the staff
    for cy in range(T + int(H * 0.10), T + int(H * 0.80), int(H * 0.06)):
        offset = int(math.sin(cy * 0.025) * int(H * 0.04))
        cv.fill_circle(staff_x + offset, cy, int(H * 0.02), BLOOD)
        cv.fill_circle(staff_x + offset, cy, int(H * 0.012), BONE)
    # Serpent head at top
    cv.fill_circle(staff_x + int(H * 0.03), T + int(H * 0.08), int(H * 0.015), BLOOD)

    _save(cv, 'asclepius.png')


def render_orpheus():
    """Lyre held forward + poet's robes. No weapon.
    Priority 3: no baked border/frame."""
    cv = Canvas2D(S, S)
    T, F = DEMI_TOP, FEET
    H = F - T
    cx = 460

    head_y  = T + int(H * 0.07)
    shldr_y = T + int(H * 0.15)
    hip_y   = T + int(H * 0.50)
    hr  = int(H * 0.05)
    sw  = int(H * 0.09)
    hw  = int(H * 0.10)

    # Poet's robes
    cv.fill_polygon([
        (cx - sw, shldr_y), (cx + sw, shldr_y),
        (cx + hw + 8, F), (cx - hw - 8, F),
    ], BONE)
    shade(cv, cx, shldr_y + 10, F - 20, hw, step=int(H * 0.04))
    # Inner robe layer with sash
    cv.fill_polygon([
        (cx - sw + 8, hip_y - 15), (cx + sw - 8, hip_y - 15),
        (cx + hw + 3, F), (cx - hw - 3, F),
    ], BLOOD)

    # Head (dark, poet's locks)
    cv.fill_circle(cx, head_y, hr + 3, INK)

    # === LYRE (key feature — large, held forward/right) ===
    lyre_x = cx + int(H * 0.12)
    lyre_y = T + int(H * 0.25)
    lw = int(H * 0.13)
    lh = int(H * 0.20)
    # Lyre frame
    cv.fill_polygon([
        (lyre_x, lyre_y), (lyre_x + lw, lyre_y - 10),
        (lyre_x + lw, lyre_y + lh), (lyre_x, lyre_y + lh - 10),
    ], INK)
    cv.fill_polygon([
        (lyre_x + 8, lyre_y + 8), (lyre_x + lw - 8, lyre_y),
        (lyre_x + lw - 8, lyre_y + lh - 8), (lyre_x + 8, lyre_y + lh - 16),
    ], BONE)
    # Strings
    for sx in range(lyre_x + 14, lyre_x + lw - 10, 8):
        cv.draw_chisel_line(sx, lyre_y + 6, sx, lyre_y + lh - 12, 2, INK)

    _save(cv, 'orpheus.png')


def render_dionysus():
    """Thyrsus (pinecone-tipped staff) + grape wreath + drinking cup."""
    cv = Canvas2D(S, S)
    T, F = DEMI_TOP, FEET
    H = F - T
    cx = 470

    head_y  = T + int(H * 0.07)
    shldr_y = T + int(H * 0.15)
    hip_y   = T + int(H * 0.50)
    hr  = int(H * 0.05)
    sw  = int(H * 0.09)
    hw  = int(H * 0.10)

    # Flowing robes
    cv.fill_polygon([
        (cx - sw, shldr_y), (cx + sw, shldr_y),
        (cx + hw + 10, F), (cx - hw - 10, F),
    ], BONE)
    shade(cv, cx, shldr_y + 10, F - 20, hw, step=int(H * 0.04))
    cv.fill_polygon([
        (cx - sw + 8, hip_y), (cx + sw - 8, hip_y),
        (cx + hw + 5, F), (cx - hw - 5, F),
    ], BLOOD)

    # Head with grape wreath
    cv.fill_circle(cx, head_y, hr, INK)
    # Grape bunches on wreath
    for angle in range(-60, 61, 40):
        rad = math.radians(angle)
        gx = cx + int(math.cos(rad) * (hr + 6))
        gy = head_y - int(math.sin(rad) * (hr + 6))
        cv.fill_circle(gx, gy, 6, BLOOD)

    # === Thyrsus staff (pinecone tip — key feature) ===
    staff_x = cx + int(H * 0.20)
    cv.draw_chisel_line(staff_x, T + int(H * 0.04), staff_x, F, 14, INK)
    # Pinecone top
    cv.fill_polygon([
        (staff_x - 12, T + int(H * 0.04)),
        (staff_x + 12, T + int(H * 0.04)),
        (staff_x, T - int(H * 0.04)),
    ], BLOOD)
    cv.fill_polygon([
        (staff_x - 8, T + int(H * 0.05)),
        (staff_x + 8, T + int(H * 0.05)),
        (staff_x, T + int(H * 0.01)),
    ], BONE)

    # === Drinking cup (kantharos) held left ===
    cup_x = cx - int(H * 0.14)
    cup_y = T + int(H * 0.35)
    cv.fill_polygon([
        (cup_x - 10, cup_y), (cup_x + 10, cup_y),
        (cup_x + 8, cup_y + 18), (cup_x - 8, cup_y + 18),
    ], INK)
    cv.fill_polygon([
        (cup_x - 7, cup_y + 3), (cup_x + 7, cup_y + 3),
        (cup_x + 5, cup_y + 15), (cup_x - 5, cup_y + 15),
    ], BONE)

    _save(cv, 'dionysus.png')


def render_aeneas():
    """Priority 4: tower shield (rectangular, not round) + Anchises on back.
    Differentiate clearly from Hoplite and Achilles."""
    cv = Canvas2D(S, S)
    T, F = DEMI_TOP, FEET
    H = F - T
    cx = 500  # shifted right to make room for tower shield

    head_y  = T + int(H * 0.07)
    shldr_y = T + int(H * 0.15)
    hip_y   = T + int(H * 0.52)
    hr  = int(H * 0.05)
    sw  = int(H * 0.10)
    hw  = int(H * 0.08)

    # === Anchises on back (small hunched figure — silhouette breaker) ===
    anch_cx = cx - int(H * 0.10)
    anch_y  = T + int(H * 0.08)
    cv.fill_circle(anch_cx, anch_y, int(H * 0.03), BONE)  # Anchises head
    cv.fill_polygon([
        (anch_cx - 8, anch_y + int(H * 0.03)),
        (anch_cx + 8, anch_y + int(H * 0.03)),
        (anch_cx + 5, shldr_y + 5),
        (anch_cx - 5, shldr_y + 5),
    ], INK)  # Anchises body

    # Heavy armor body
    legs_standing(cv, cx, hip_y, F, spread=int(H * 0.04), thick=int(H * 0.045))
    body_torso(cv, cx, shldr_y, hip_y, sw, hw)
    shade(cv, cx, shldr_y + 5, hip_y - 5, sw - 3, step=int(H * 0.04))

    # Helm (plain round, no crest — not Achilles/Hoplite)
    cv.fill_circle(cx, head_y, hr + 4, INK)

    # === TALL TOWER SHIELD (rectangular — key differentiator from Hoplite) ===
    shld_left  = cx + int(H * 0.08)
    shld_right = cx + int(H * 0.24)
    shld_top   = T + int(H * 0.14)
    shld_bot   = T + int(H * 0.72)
    cv.fill_polygon([
        (shld_left, shld_top), (shld_right, shld_top),
        (shld_right, shld_bot), (shld_left, shld_bot),
    ], INK)
    cv.fill_polygon([
        (shld_left + 6, shld_top + 6), (shld_right - 6, shld_top + 6),
        (shld_right - 6, shld_bot - 6), (shld_left + 6, shld_bot - 6),
    ], BLOOD)
    cv.fill_polygon([
        (shld_left + 14, shld_top + 14), (shld_right - 14, shld_top + 14),
        (shld_right - 14, shld_bot - 14), (shld_left + 14, shld_bot - 14),
    ], BONE)

    _save(cv, 'aeneas.png')


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  GOD TIER — 85 % frame height  (top 10, feet 880, height 870 px)       ║
# ╚══════════════════════════════════════════════════════════════════════════╝

def render_zeus():
    """Thunderbolt raised + full beard + aegis cloak.
    Priority 3: transparent background (no white fill)."""
    cv = Canvas2D(S, S)
    T, F = GOD_TOP, FEET
    H = F - T
    cx = 460

    head_y  = T + int(H * 0.07)
    shldr_y = T + int(H * 0.15)
    hip_y   = T + int(H * 0.50)
    hr  = int(H * 0.055)
    sw  = int(H * 0.10)
    hw  = int(H * 0.12)

    # Majestic robes (outer — INK shadow mass)
    cv.fill_polygon([
        (cx - sw - 8, shldr_y), (cx + sw + 8, shldr_y),
        (cx + hw + 15, F), (cx - hw - 15, F),
    ], INK)
    # Inner robe (BONE)
    cv.fill_polygon([
        (cx - sw + 5, shldr_y + 10), (cx + sw - 5, shldr_y + 10),
        (cx + hw + 5, F - 10), (cx - hw - 5, F - 10),
    ], BONE)
    shade(cv, cx, shldr_y + 20, F - 30, hw, step=int(H * 0.035))

    # Aegis cloak (left side, BLOOD)
    cv.fill_polygon([
        (cx - sw - 5, shldr_y + 5),
        (cx - sw - 20, hip_y),
        (cx - hw - 12, F),
        (cx - hw - 5, F),
    ], BLOOD)

    # Head with full beard (major mass)
    cv.fill_circle(cx, head_y, hr, INK)
    # Beard — large BONE triangle below head
    cv.fill_polygon([
        (cx - hr + 3, head_y + hr - 8),
        (cx + hr - 3, head_y + hr - 8),
        (cx + 5, head_y + hr + int(H * 0.06)),
        (cx - 5, head_y + hr + int(H * 0.06)),
    ], BONE)
    shade(cv, cx, head_y + hr - 5, head_y + hr + int(H * 0.05), hr - 5,
          step=8, thick=2)

    # === THUNDERBOLT (key feature — zigzag extending up-right) ===
    bolt_base_x = cx + int(H * 0.08)
    bolt_base_y = T + int(H * 0.22)
    bolt_pts = []
    bx, by = bolt_base_x, bolt_base_y
    for i in range(6):
        bolt_pts.append((bx, by))
        if i % 2 == 0:
            bx += int(H * 0.05)
            by -= int(H * 0.03)
        else:
            bx += int(H * 0.02)
            by += int(H * 0.02)
    # Draw bolt as thick chisel segments
    for i in range(len(bolt_pts) - 1):
        cv.draw_chisel_line(bolt_pts[i][0], bolt_pts[i][1],
                            bolt_pts[i+1][0], bolt_pts[i+1][1],
                            14, BLOOD)
    # Bright bolt tip
    cv.fill_polygon([
        (bolt_pts[-1][0], bolt_pts[-1][1] + 6),
        (bolt_pts[-1][0] + 25, bolt_pts[-1][1] - 10),
        (bolt_pts[-1][0] + 5, bolt_pts[-1][1] - 6),
    ], BONE)

    _save(cv, 'zeus.png')


def render_hera():
    """Tall diadem crown + peacock-feathered sceptre + imperious bearing."""
    cv = Canvas2D(S, S)
    T, F = GOD_TOP, FEET
    H = F - T
    cx = 460

    head_y  = T + int(H * 0.07)
    shldr_y = T + int(H * 0.15)
    hip_y   = T + int(H * 0.48)
    hr  = int(H * 0.05)
    sw  = int(H * 0.09)
    hw  = int(H * 0.12)

    # Imperial robes
    cv.fill_polygon([
        (cx - sw - 5, shldr_y), (cx + sw + 5, shldr_y),
        (cx + hw + 12, F), (cx - hw - 12, F),
    ], BONE)
    shade(cv, cx, shldr_y + 15, F - 25, hw, step=int(H * 0.035))
    cv.fill_polygon([
        (cx - sw + 8, hip_y - 10), (cx + sw - 8, hip_y - 10),
        (cx + hw + 6, F), (cx - hw - 6, F),
    ], BLOOD)

    # Head
    cv.fill_circle(cx, head_y, hr, INK)

    # === TALL DIADEM CROWN (key feature — extends above head) ===
    cv.fill_polygon([
        (cx - hr - 3, head_y - hr + 2),
        (cx + hr + 3, head_y - hr + 2),
        (cx + hr - 5, head_y - hr - int(H * 0.04)),
        (cx, head_y - hr - int(H * 0.06)),
        (cx - hr + 5, head_y - hr - int(H * 0.04)),
    ], INK)
    cv.fill_polygon([
        (cx - hr + 2, head_y - hr + 3),
        (cx + hr - 2, head_y - hr + 3),
        (cx, head_y - hr - int(H * 0.04)),
    ], BONE)

    # === Peacock sceptre (tall, right of body) ===
    scep_x = cx + int(H * 0.18)
    cv.draw_chisel_line(scep_x, T + int(H * 0.04), scep_x, F, 14, INK)
    # Peacock-feather ornament at top
    cv.fill_circle(scep_x, T + int(H * 0.04), int(H * 0.03), BLOOD)
    # Feather "eyes"
    for dy in range(-12, 13, 12):
        cv.fill_circle(scep_x, T + int(H * 0.04) + dy, 5, BONE)
        cv.fill_circle(scep_x, T + int(H * 0.04) + dy, 3, INK)

    _save(cv, 'hera.png')


def render_poseidon():
    """Priority 5: simplified wave motifs (2-3 bold strokes, not filigree).
    Priority 3: transparent background. Enlarged trident prongs."""
    cv = Canvas2D(S, S)
    T, F = GOD_TOP, FEET
    H = F - T
    cx = 450

    head_y  = T + int(H * 0.07)
    shldr_y = T + int(H * 0.15)
    hip_y   = T + int(H * 0.50)
    hr  = int(H * 0.055)
    sw  = int(H * 0.10)
    hw  = int(H * 0.12)

    # Ocean robes (outer INK, inner BONE)
    cv.fill_polygon([
        (cx - sw - 6, shldr_y), (cx + sw + 6, shldr_y),
        (cx + hw + 12, F), (cx - hw - 12, F),
    ], INK)
    cv.fill_polygon([
        (cx - sw + 5, shldr_y + 10), (cx + sw - 5, shldr_y + 10),
        (cx + hw + 3, F - 10), (cx - hw - 3, F - 10),
    ], BONE)
    shade(cv, cx, shldr_y + 20, F - 30, hw, step=int(H * 0.04))

    # Simple bold wave motifs on lower robe (Priority 5: restraint)
    wave_y_start = T + int(H * 0.65)
    for i in range(3):
        wy = wave_y_start + i * int(H * 0.08)
        cv.draw_chisel_line(cx - hw - 5, wy,
                            cx + hw + 5, wy + 10, 6, INK)

    # Head with wild beard
    cv.fill_circle(cx, head_y, hr, INK)
    cv.fill_polygon([
        (cx - hr + 3, head_y + hr - 5),
        (cx + hr - 3, head_y + hr - 5),
        (cx + 8, head_y + hr + int(H * 0.07)),
        (cx - 8, head_y + hr + int(H * 0.07)),
    ], BONE)
    shade(cv, cx, head_y + hr - 3, head_y + hr + int(H * 0.06), hr - 5,
          step=8, thick=2)

    # === TRIDENT (dominant feature — LARGE prongs) ===
    tri_x = cx + int(H * 0.22)
    cv.draw_chisel_line(tri_x, T + int(H * 0.08), tri_x, F, 16, INK)
    # Crossbar
    prong_w = int(H * 0.08)
    cross_y = T + int(H * 0.08)
    cv.draw_chisel_line(tri_x - prong_w, cross_y,
                        tri_x + prong_w, cross_y, 12, INK)
    # Three prongs (ENLARGED for readability)
    prong_h = int(H * 0.08)
    cv.draw_chisel_line(tri_x - prong_w, cross_y,
                        tri_x - prong_w, cross_y - prong_h, 12, BLOOD)
    cv.draw_chisel_line(tri_x, cross_y - 5,
                        tri_x, cross_y - prong_h - 8, 14, BLOOD)
    cv.draw_chisel_line(tri_x + prong_w, cross_y,
                        tri_x + prong_w, cross_y - prong_h, 12, BLOOD)

    _save(cv, 'poseidon.png')


def render_hades():
    """COMPLETE REDRAW. Shadowed Helm of Darkness + bident + heavy dark robes.
    Most static/menacing pose in roster. Heaviest ink mass of any god."""
    cv = Canvas2D(S, S)
    T, F = GOD_TOP, FEET
    H = F - T
    cx = 460

    head_y  = T + int(H * 0.07)
    shldr_y = T + int(H * 0.14)
    hip_y   = T + int(H * 0.50)
    hr  = int(H * 0.055)
    sw  = int(H * 0.11)
    hw  = int(H * 0.13)

    # Heavy dark robes — mostly INK (darkest silhouette of all gods)
    cv.fill_polygon([
        (cx - sw - 10, shldr_y), (cx + sw + 10, shldr_y),
        (cx + hw + 18, F), (cx - hw - 18, F),
    ], INK)
    # Inner robe fold — only a narrow stripe of BLOOD visible
    cv.fill_polygon([
        (cx - 12, hip_y), (cx + 12, hip_y),
        (cx + hw, F - 5), (cx - hw, F - 5),
    ], BLOOD)
    # Sparse shadow detail
    shade(cv, cx, shldr_y + 20, hip_y - 10, sw, step=int(H * 0.06), thick=4)

    # === Helm of Darkness (deep, shadowed — face barely visible) ===
    cv.fill_circle(cx, head_y, hr + 8, INK)
    # Only a faint slit of BONE where eyes would be
    cv.fill_rect(cx - 5, head_y - 2, cx + hr + 4, head_y + 2, BONE)

    # === BIDENT (two-pronged — differentiates from Poseidon's trident) ===
    bi_x = cx + int(H * 0.20)
    cv.draw_chisel_line(bi_x, T + int(H * 0.06), bi_x, F, 16, INK)
    prong_h = int(H * 0.08)
    prong_w = int(H * 0.05)
    cross_y = T + int(H * 0.06)
    # Two prongs only (not three)
    cv.draw_chisel_line(bi_x - prong_w, cross_y,
                        bi_x - prong_w, cross_y - prong_h, 12, INK)
    cv.draw_chisel_line(bi_x + prong_w, cross_y,
                        bi_x + prong_w, cross_y - prong_h, 12, INK)
    # Crossbar connecting prongs to shaft
    cv.draw_chisel_line(bi_x - prong_w, cross_y,
                        bi_x + prong_w, cross_y, 10, INK)

    _save(cv, 'hades.png')


def render_athena():
    """COMPLETE REDRAW. Crested Corinthian helm + aegis with gorgoneion +
    spear + owl on shoulder."""
    cv = Canvas2D(S, S)
    T, F = GOD_TOP, FEET
    H = F - T
    cx = 470

    head_y  = T + int(H * 0.07)
    shldr_y = T + int(H * 0.15)
    hip_y   = T + int(H * 0.50)
    hr  = int(H * 0.055)
    sw  = int(H * 0.10)
    hw  = int(H * 0.08)

    # Tactical peplos / armor
    cv.fill_polygon([
        (cx - sw - 3, shldr_y), (cx + sw + 3, shldr_y),
        (cx + hw + 8, F), (cx - hw - 8, F),
    ], BONE)
    shade(cv, cx, shldr_y + 10, F - 25, hw, step=int(H * 0.04))

    # Aegis breastplate (INK armor over torso)
    cv.fill_polygon([
        (cx - sw + 3, shldr_y + 5), (cx + sw - 3, shldr_y + 5),
        (cx + hw - 3, hip_y - 10), (cx - hw + 3, hip_y - 10),
    ], INK)
    # Gorgoneion on aegis (small circle with features)
    gorg_y = T + int(H * 0.32)
    cv.fill_circle(cx, gorg_y, int(H * 0.03), BLOOD)
    cv.fill_circle(cx, gorg_y, int(H * 0.018), BONE)

    # Legs visible below robes
    legs_standing(cv, cx, hip_y + int(H * 0.15), F,
                  spread=int(H * 0.03), thick=int(H * 0.035))

    # === Prominent crested Corinthian helm ===
    helm_crested(cv, cx, head_y, hr, BLOOD)

    # === OWL on shoulder (key feature — must be large enough to read) ===
    owl_cx = cx - int(H * 0.13)
    owl_cy = T + int(H * 0.14)
    owl_r  = int(H * 0.03)
    cv.fill_circle(owl_cx, owl_cy, owl_r + 3, INK)
    cv.fill_circle(owl_cx, owl_cy, owl_r, BONE)
    # Owl eyes
    cv.fill_circle(owl_cx - 4, owl_cy - 2, 3, INK)
    cv.fill_circle(owl_cx + 4, owl_cy - 2, 3, INK)
    # Owl beak
    cv.fill_polygon([(owl_cx, owl_cy + 2),
                      (owl_cx + 3, owl_cy + 6),
                      (owl_cx - 3, owl_cy + 6)], INK)

    # === Long spear (right side) ===
    spear_right(cv,
                cx + int(H * 0.05), T + int(H * 0.70),
                cx + int(H * 0.20), T - int(H * 0.02),
                shaft=12, head_size=20)

    _save(cv, 'athena.png')


def render_ares():
    """COMPLETE REDRAW. Full-face war helm with visor slit + aggressive forward
    lean + spear + round shield."""
    cv = Canvas2D(S, S)
    T, F = GOD_TOP, FEET
    H = F - T
    cx = 480

    head_y  = T + int(H * 0.07)
    shldr_y = T + int(H * 0.14)
    hip_y   = T + int(H * 0.50)
    hr  = int(H * 0.06)
    sw  = int(H * 0.11)
    hw  = int(H * 0.09)

    # War harness body (aggressive forward lean — right foot forward)
    cv.fill_polygon([
        (cx - sw, shldr_y), (cx + sw + 5, shldr_y - 5),
        (cx + hw + 5, hip_y), (cx - hw, hip_y),
    ], INK)
    cv.fill_polygon([
        (cx - sw + 6, shldr_y + 6), (cx + sw - 2, shldr_y + 2),
        (cx + hw, hip_y - 6), (cx - hw + 6, hip_y - 6),
    ], BLOOD)

    # Legs — forward-leaning stance
    cv.draw_chisel_line(cx - int(H*0.03), hip_y,
                        cx - int(H*0.05), F, int(H*0.045), INK)
    cv.draw_chisel_line(cx + int(H*0.03), hip_y,
                        cx + int(H*0.06), F, int(H*0.045), INK)

    # === Full-face war helm (covers entire face — key differentiator) ===
    cv.fill_circle(cx, head_y, hr + 8, INK)
    # Only a narrow visor slit
    cv.fill_rect(cx - hr, head_y - 2, cx + hr, head_y + 2, BLOOD)

    # === Round war shield (left side, BLOOD-faced) ===
    shld_cx = cx - int(H * 0.16)
    shld_cy = T + int(H * 0.38)
    shld_r  = int(H * 0.12)
    cv.fill_circle(shld_cx, shld_cy, shld_r + 6, INK)
    cv.fill_circle(shld_cx, shld_cy, shld_r, BLOOD)
    cv.fill_circle(shld_cx, shld_cy, int(shld_r * 0.4), INK)

    # === Spear (aggressive angle, extending right) ===
    spear_right(cv,
                cx + int(H * 0.06), T + int(H * 0.60),
                cx + int(H * 0.38), T + int(H * 0.05),
                shaft=14, head_size=24)

    _save(cv, 'ares.png')


def render_aphrodite():
    """COMPLETE REDRAW. Flowing drapery cascade + hand mirror + dove.
    Most curved silhouette in roster. No weapon."""
    cv = Canvas2D(S, S)
    T, F = GOD_TOP, FEET
    H = F - T
    cx = 470

    head_y  = T + int(H * 0.07)
    shldr_y = T + int(H * 0.15)
    hip_y   = T + int(H * 0.46)
    hr  = int(H * 0.05)
    sw  = int(H * 0.08)
    hw  = int(H * 0.13)

    # === Flowing drapery cascade (most curved silhouette) ===
    cv.fill_polygon([
        (cx - sw - 3, shldr_y), (cx + sw + 3, shldr_y),
        (cx + hw + 18, F), (cx - hw - 18, F),
    ], BONE)
    shade(cv, cx, shldr_y + 15, F - 25, hw, step=int(H * 0.035))
    # Inner robe flow
    cv.fill_polygon([
        (cx - sw + 8, hip_y - 20), (cx + sw - 8, hip_y - 20),
        (cx + hw + 10, F), (cx - hw - 10, F),
    ], BLOOD)
    # Drapery fold lines (elegant curves)
    for i in range(3):
        fold_x = cx - hw + i * int(H * 0.07)
        cv.draw_chisel_line(fold_x, hip_y, fold_x + 8, F - 15, 3, INK)

    # Head with flowing hair
    cv.fill_circle(cx, head_y, hr, BONE)
    # Hair cascading left
    cv.fill_polygon([
        (cx - hr - 2, head_y - 5),
        (cx - hr - 10, head_y + int(H * 0.08)),
        (cx - hr + 5, head_y + int(H * 0.06)),
    ], INK)

    # === Hand mirror (held right — key feature) ===
    mirror_cx = cx + int(H * 0.16)
    mirror_cy = T + int(H * 0.22)
    mir_r = int(H * 0.04)
    cv.fill_circle(mirror_cx, mirror_cy, mir_r + 4, INK)
    cv.fill_circle(mirror_cx, mirror_cy, mir_r, BONE)
    # Mirror handle
    cv.draw_chisel_line(mirror_cx, mirror_cy + mir_r + 2,
                        mirror_cx + 5, mirror_cy + mir_r + int(H * 0.06),
                        8, INK)

    # === Dove perched on left shoulder (key feature) ===
    dove_cx = cx - int(H * 0.12)
    dove_cy = T + int(H * 0.13)
    cv.fill_polygon([
        (dove_cx - 10, dove_cy),
        (dove_cx + 10, dove_cy - 3),
        (dove_cx + 8, dove_cy + 8),
        (dove_cx - 8, dove_cy + 8),
    ], BONE)
    # Dove wing
    cv.fill_polygon([
        (dove_cx - 8, dove_cy - 2),
        (dove_cx - 18, dove_cy - 8),
        (dove_cx - 5, dove_cy + 5),
    ], INK)

    _save(cv, 'aphrodite.png')


def render_hephaestus():
    """COMPLETE REDRAW. Broadest/stockiest god silhouette. Massive smith's
    hammer + forge apron + tongs."""
    cv = Canvas2D(S, S)
    T, F = GOD_TOP, FEET
    H = F - T
    cx = 460

    head_y  = T + int(H * 0.08)
    shldr_y = T + int(H * 0.15)
    hip_y   = T + int(H * 0.52)
    hr  = int(H * 0.055)
    sw  = int(H * 0.14)   # extra-wide shoulders
    hw  = int(H * 0.12)   # wide hips too

    # Broad stocky body (widest god silhouette)
    cv.fill_polygon([
        (cx - sw - 5, shldr_y), (cx + sw + 5, shldr_y),
        (cx + hw + 10, F), (cx - hw - 10, F),
    ], INK)
    # Forge apron (BLOOD front panel)
    cv.fill_polygon([
        (cx - sw + 10, shldr_y + 20), (cx + sw - 10, shldr_y + 20),
        (cx + hw + 3, F - 15), (cx - hw - 3, F - 15),
    ], BLOOD)
    shade(cv, cx, shldr_y + 30, F - 30, hw - 5, step=int(H * 0.04))

    # Head with bushy beard
    cv.fill_circle(cx, head_y, hr, BONE)
    cv.fill_polygon([
        (cx - hr + 3, head_y + hr - 6),
        (cx + hr - 3, head_y + hr - 6),
        (cx, head_y + hr + int(H * 0.05)),
    ], INK)

    # Legs (thick, sturdy)
    legs_standing(cv, cx, hip_y + int(H * 0.08), F,
                  spread=int(H * 0.05), thick=int(H * 0.05))

    # === MASSIVE SMITH'S HAMMER (key feature — raised right) ===
    hammer_shaft_x = cx + int(H * 0.08)
    hammer_shaft_y = T + int(H * 0.30)
    hammer_head_x  = cx + int(H * 0.30)
    hammer_head_y  = T + int(H * 0.10)
    cv.draw_chisel_line(hammer_shaft_x, hammer_shaft_y,
                        hammer_head_x, hammer_head_y, int(H * 0.04), INK)
    # Hammer head (heavy rectangular mass)
    hh_w = int(H * 0.08)
    hh_h = int(H * 0.06)
    cv.fill_rect(hammer_head_x - hh_w // 2, hammer_head_y - hh_h // 2,
                 hammer_head_x + hh_w // 2, hammer_head_y + hh_h // 2, INK)
    cv.fill_rect(hammer_head_x - hh_w // 2 + 4, hammer_head_y - hh_h // 2 + 4,
                 hammer_head_x + hh_w // 2 - 4, hammer_head_y + hh_h // 2 - 4, BLOOD)

    # === Tongs held in left hand ===
    tongs_x = cx - int(H * 0.15)
    tongs_y = T + int(H * 0.35)
    cv.draw_chisel_line(tongs_x, tongs_y, tongs_x - 5, tongs_y + int(H * 0.15), 8, INK)
    cv.draw_chisel_line(tongs_x + 8, tongs_y, tongs_x + 3, tongs_y + int(H * 0.15), 8, INK)

    _save(cv, 'hephaestus.png')


def render_apollo():
    """COMPLETE REDRAW. Radiating sun-ray halo (chisel lines, not geometric) +
    bow + laurel wreath."""
    cv = Canvas2D(S, S)
    T, F = GOD_TOP, FEET
    H = F - T
    cx = 470

    head_y  = T + int(H * 0.08)
    shldr_y = T + int(H * 0.16)
    hip_y   = T + int(H * 0.50)
    hr  = int(H * 0.05)
    sw  = int(H * 0.09)
    hw  = int(H * 0.11)

    # === SUN-RAY HALO (chisel strokes radiating from head — key feature) ===
    ray_len = int(H * 0.10)
    for angle in range(0, 360, 25):
        rad = math.radians(angle)
        x1 = cx + int(math.cos(rad) * (hr + 10))
        y1 = head_y + int(math.sin(rad) * (hr + 10))
        x2 = cx + int(math.cos(rad) * (hr + 10 + ray_len))
        y2 = head_y + int(math.sin(rad) * (hr + 10 + ray_len))
        cv.draw_chisel_line(x1, y1, x2, y2, 6, BLOOD)

    # Robes
    cv.fill_polygon([
        (cx - sw - 3, shldr_y), (cx + sw + 3, shldr_y),
        (cx + hw + 10, F), (cx - hw - 10, F),
    ], BONE)
    shade(cv, cx, shldr_y + 15, F - 25, hw, step=int(H * 0.04))
    cv.fill_polygon([
        (cx - sw + 8, hip_y - 10), (cx + sw - 8, hip_y - 10),
        (cx + hw + 5, F), (cx - hw - 5, F),
    ], BLOOD)

    # Head with laurel wreath
    cv.fill_circle(cx, head_y, hr, BONE)
    # Laurel wreath (circle of small marks)
    for angle in range(-120, 121, 30):
        rad = math.radians(angle)
        lx = cx + int(math.cos(rad) * (hr + 3))
        ly = head_y + int(math.sin(rad) * (hr + 3))
        cv.fill_circle(lx, ly, 4, INK)

    # === Bow (right side — tall vertical arc) ===
    bow_x = cx + int(H * 0.18)
    bow_top = T + int(H * 0.18)
    bow_bot = T + int(H * 0.58)
    cv.draw_chisel_line(bow_x, bow_top, bow_x, bow_bot, 14, INK)
    # Bowstring
    cv.draw_chisel_line(bow_x - 3, bow_top + 5,
                        bow_x - 3, bow_bot - 5, 3, BONE)

    _save(cv, 'apollo.png')


def render_artemis():
    """COMPLETE REDRAW. Drawn bow with nocked arrow + quiver on back +
    crescent moon diadem + hunting hound at heel."""
    cv = Canvas2D(S, S)
    T, F = GOD_TOP, FEET
    H = F - T
    cx = 460

    head_y  = T + int(H * 0.07)
    shldr_y = T + int(H * 0.15)
    hip_y   = T + int(H * 0.48)
    hr  = int(H * 0.05)
    sw  = int(H * 0.08)
    hw  = int(H * 0.10)

    # === Quiver on back (visible behind shoulder) ===
    cv.fill_polygon([
        (cx - int(H * 0.10), shldr_y - 10),
        (cx - int(H * 0.06), shldr_y - 10),
        (cx - int(H * 0.07), hip_y - 20),
        (cx - int(H * 0.11), hip_y - 20),
    ], INK)
    # Arrow fletching visible
    for ay in range(shldr_y - 8, shldr_y + 15, 8):
        cv.draw_chisel_line(cx - int(H * 0.10), ay,
                            cx - int(H * 0.06), ay, 3, BLOOD)

    # Huntress robes (shorter, practical)
    cv.fill_polygon([
        (cx - sw, shldr_y), (cx + sw, shldr_y),
        (cx + hw + 5, F), (cx - hw - 5, F),
    ], BONE)
    shade(cv, cx, shldr_y + 10, F - 25, hw - 3, step=int(H * 0.04))
    cv.fill_polygon([
        (cx - sw + 5, hip_y - 10), (cx + sw - 5, hip_y - 10),
        (cx + hw, hip_y + int(H * 0.20)), (cx - hw, hip_y + int(H * 0.20)),
    ], INK)

    # Legs (visible below shorter tunic)
    legs_standing(cv, cx, hip_y + int(H * 0.15), F,
                  spread=int(H * 0.03), thick=int(H * 0.035))

    # Head with crescent moon diadem
    cv.fill_circle(cx, head_y, hr, BONE)
    # === Crescent moon at brow ===
    cv.fill_circle(cx, head_y - hr - 5, int(H * 0.025), BLOOD)
    cv.fill_circle(cx + 4, head_y - hr - 4, int(H * 0.015), BONE)  # crescent cutout

    # === DRAWN BOW with nocked arrow (key feature — horizontal accent) ===
    bow_cx = cx + int(H * 0.15)
    bow_top = T + int(H * 0.18)
    bow_bot = T + int(H * 0.48)
    bow_mid = (bow_top + bow_bot) // 2
    # Bow stave (curved)
    cv.draw_chisel_line(bow_cx, bow_top, bow_cx + 8, bow_mid, 12, INK)
    cv.draw_chisel_line(bow_cx + 8, bow_mid, bow_cx, bow_bot, 12, INK)
    # Bowstring (pulled back)
    cv.draw_chisel_line(bow_cx, bow_top, cx + int(H * 0.05), bow_mid, 3, BONE)
    cv.draw_chisel_line(cx + int(H * 0.05), bow_mid, bow_cx, bow_bot, 3, BONE)
    # Nocked arrow (extending far right)
    cv.draw_chisel_line(cx + int(H * 0.05), bow_mid,
                        cx + int(H * 0.38), bow_mid - 5, 6, INK)
    cv.fill_polygon([
        (cx + int(H * 0.36), bow_mid - 2),
        (cx + int(H * 0.42), bow_mid - 5),
        (cx + int(H * 0.37), bow_mid + 2),
    ], BLOOD)

    # === Hunting hound at heel (companion — reads at 64px) ===
    hound_x = cx - int(H * 0.08)
    hound_y = F - int(H * 0.12)
    # Hound body
    cv.fill_polygon([
        (hound_x - 18, hound_y), (hound_x + 18, hound_y - 5),
        (hound_x + 22, hound_y + 15), (hound_x - 15, hound_y + 18),
    ], INK)
    # Hound head
    cv.fill_circle(hound_x + 22, hound_y, 8, INK)
    # Hound legs
    cv.draw_chisel_line(hound_x - 12, hound_y + 15, hound_x - 14, F, 5, INK)
    cv.draw_chisel_line(hound_x + 15, hound_y + 15, hound_x + 17, F, 5, INK)

    _save(cv, 'artemis.png')


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  TITAN TIER — ~100 % frame  (top 22, feet 1000, height 978 px)         ║
# ╚══════════════════════════════════════════════════════════════════════════╝

def render_cronus():
    """COMPLETE REDRAW. Colossal — harpe scythe dominates frame, devouring
    open maw. Should feel like it barely fits the canvas."""
    cv = Canvas2D(S, S)
    T, F = TITAN_TOP, TITAN_FEET
    H = F - T
    cx = 440

    head_y  = T + int(H * 0.07)
    shldr_y = T + int(H * 0.13)
    hip_y   = T + int(H * 0.52)
    hr  = int(H * 0.065)
    sw  = int(H * 0.14)
    hw  = int(H * 0.16)

    # === COLOSSAL BODY (massive, fills frame width) ===
    cv.fill_polygon([
        (cx - sw - 15, shldr_y), (cx + sw + 15, shldr_y),
        (cx + hw + 25, F), (cx - hw - 25, F),
    ], INK)
    # Inner robe mass
    cv.fill_polygon([
        (cx - sw + 10, shldr_y + 20), (cx + sw - 10, shldr_y + 20),
        (cx + hw + 10, F - 15), (cx - hw - 10, F - 15),
    ], BLOOD)
    shade(cv, cx, shldr_y + 30, F - 40, hw, step=int(H * 0.035), thick=5)

    # === DEVOURING MAW HEAD (open jaws — key feature) ===
    cv.fill_circle(cx, head_y, hr + 10, INK)
    # Open maw (triangular gap = teeth)
    cv.fill_polygon([
        (cx - hr + 8, head_y + 5),
        (cx + hr - 8, head_y + 5),
        (cx, head_y + hr + 15),
    ], BONE)
    # Teeth
    for tx in range(cx - hr + 14, cx + hr - 10, 10):
        cv.fill_polygon([
            (tx, head_y + 8),
            (tx + 5, head_y + 8),
            (tx + 3, head_y + 18),
        ], INK)

    # === GIANT HARPE SCYTHE (curves over the top — dominates frame) ===
    scythe_shaft_x = cx + int(H * 0.22)
    cv.draw_chisel_line(scythe_shaft_x, T + int(H * 0.10),
                        scythe_shaft_x, F, int(H * 0.035), INK)
    # Scythe blade (sweeping curve over the top)
    cv.fill_polygon([
        (scythe_shaft_x, T + int(H * 0.10)),
        (scythe_shaft_x + int(H * 0.25), T + int(H * 0.06)),
        (scythe_shaft_x + int(H * 0.22), T + int(H * 0.18)),
    ], BLOOD)
    cv.fill_polygon([
        (scythe_shaft_x + 5, T + int(H * 0.12)),
        (scythe_shaft_x + int(H * 0.20), T + int(H * 0.08)),
        (scythe_shaft_x + int(H * 0.18), T + int(H * 0.16)),
    ], BONE)

    _save(cv, 'cronus.png')


def render_typhon():
    """COMPLETE REDRAW. Monstrous: serpentine coils for legs, multiple heads,
    vast wings. Least human shape in the roster."""
    cv = Canvas2D(S, S)
    T, F = TITAN_TOP, TITAN_FEET
    H = F - T
    cx = S // 2  # centered — this creature is symmetric-ish

    head_y  = T + int(H * 0.10)
    shldr_y = T + int(H * 0.18)
    coil_start = T + int(H * 0.42)
    hr  = int(H * 0.05)
    sw  = int(H * 0.12)

    # === VAST WINGS (spanning wide — key feature) ===
    # Left wing
    cv.fill_polygon([
        (cx - 15, shldr_y),
        (cx - int(H * 0.38), T + int(H * 0.02)),
        (cx - int(H * 0.30), T + int(H * 0.15)),
        (cx - int(H * 0.18), coil_start - 20),
    ], INK)
    # Right wing
    cv.fill_polygon([
        (cx + 15, shldr_y),
        (cx + int(H * 0.38), T + int(H * 0.02)),
        (cx + int(H * 0.30), T + int(H * 0.15)),
        (cx + int(H * 0.18), coil_start - 20),
    ], INK)
    # Wing membrane texture
    for wy in range(T + int(H * 0.05), T + int(H * 0.20), int(H * 0.03)):
        cv.draw_chisel_line(cx - int(H * 0.32), wy,
                            cx - int(H * 0.10), wy + 8, 4, BLOOD)
        cv.draw_chisel_line(cx + int(H * 0.10), wy + 8,
                            cx + int(H * 0.32), wy, 4, BLOOD)

    # Upper torso mass
    cv.fill_polygon([
        (cx - sw, shldr_y), (cx + sw, shldr_y),
        (cx + sw - 10, coil_start), (cx - sw + 10, coil_start),
    ], INK)
    shade(cv, cx, shldr_y + 10, coil_start - 10, sw - 5,
          step=int(H * 0.04), thick=4)

    # === MULTIPLE HEADS (three — key feature) ===
    # Central head
    cv.fill_circle(cx, head_y, hr + 8, INK)
    cv.fill_rect(cx - hr, head_y - 3, cx + hr, head_y + 3, BLOOD)  # eyes
    # Left head
    cv.fill_circle(cx - int(H * 0.10), head_y + int(H * 0.03), hr + 3, BLOOD)
    cv.fill_circle(cx - int(H * 0.10), head_y + int(H * 0.03), hr - 4, INK)
    # Right head
    cv.fill_circle(cx + int(H * 0.10), head_y + int(H * 0.03), hr + 3, BLOOD)
    cv.fill_circle(cx + int(H * 0.10), head_y + int(H * 0.03), hr - 4, INK)

    # === SERPENTINE COILS (no legs — key feature) ===
    coil_thick = int(H * 0.06)
    # Left coil: down, curves right, curves back left
    cv.draw_chisel_line(cx - int(H * 0.06), coil_start,
                        cx - int(H * 0.18), coil_start + int(H * 0.18),
                        coil_thick, INK)
    cv.draw_chisel_line(cx - int(H * 0.18), coil_start + int(H * 0.18),
                        cx + int(H * 0.05), coil_start + int(H * 0.36),
                        coil_thick, INK)
    cv.draw_chisel_line(cx + int(H * 0.05), coil_start + int(H * 0.36),
                        cx - int(H * 0.10), F,
                        coil_thick, INK)
    # Right coil: mirrors left
    cv.draw_chisel_line(cx + int(H * 0.06), coil_start,
                        cx + int(H * 0.18), coil_start + int(H * 0.18),
                        coil_thick, INK)
    cv.draw_chisel_line(cx + int(H * 0.18), coil_start + int(H * 0.18),
                        cx - int(H * 0.05), coil_start + int(H * 0.36),
                        coil_thick, INK)
    cv.draw_chisel_line(cx - int(H * 0.05), coil_start + int(H * 0.36),
                        cx + int(H * 0.10), F,
                        coil_thick, INK)
    # Scale texture on coils
    for cy in range(coil_start + 15, F - 20, int(H * 0.05)):
        cv.draw_chisel_line(cx - int(H * 0.15), cy,
                            cx - int(H * 0.08), cy + 5, 4, BLOOD)
        cv.draw_chisel_line(cx + int(H * 0.08), cy + 5,
                            cx + int(H * 0.15), cy, 4, BLOOD)

    _save(cv, 'typhon.png')


# ══════════════════════════════════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════════════════════════════════

def render_all():
    print('Rendering Style C-B sprites (v2 — audit fixes)...\n')
    print('CHAFF TIER (55% frame height):')
    render_hoplite()
    render_satyr()
    render_harpy()

    print('\nDEMIGOD TIER (70% frame height):')
    render_heracles()
    render_perseus()
    render_achilles()
    render_asclepius()
    render_orpheus()
    render_dionysus()
    render_aeneas()

    print('\nGOD TIER (85% frame height):')
    render_zeus()
    render_hera()
    render_poseidon()
    render_hades()
    render_athena()
    render_ares()
    render_aphrodite()
    render_hephaestus()
    render_apollo()
    render_artemis()

    print('\nTITAN TIER (100% frame height):')
    render_cronus()
    render_typhon()

    print('\n✅ ALL 22 SPRITES RENDERED.')


if __name__ == '__main__':
    render_all()
