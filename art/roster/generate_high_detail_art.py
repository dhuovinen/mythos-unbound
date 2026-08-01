#!/usr/bin/env python3
import os
import math
from rasterizer import Canvas2D, INK, BONE, BLOOD

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

def draw_woodcut_hatching(cv, x0, y0, width, height, density=12, angle=45, color=INK):
    """Draws parallel chisel hatching lines for woodcut shading."""
    rad = math.radians(angle)
    cos_a, sin_a = math.cos(rad), math.sin(rad)
    for i in range(-width, width + height, density):
        lx0 = x0 + i
        ly0 = y0
        lx1 = x0 + i + height * cos_a
        ly1 = y0 + height * sin_a
        cv.draw_chisel_line(lx0, ly0, lx1, ly1, 4, color)

def render_high_detail_roster():
    print("Rendering high-detail Style C-B woodcut sprites...")

    # =========================================================================
    # CHAFF TIER (~55% frame height)
    # =========================================================================

    # 1. HOPLITE
    cv = Canvas2D(1024, 1024)
    # Background shadow mass
    cv.fill_polygon([(460, 480), (540, 470), (560, 880), (440, 880)], INK)
    # Muscular legs with armor greaves
    cv.draw_chisel_line(470, 720, 440, 880, 28, INK)
    cv.draw_chisel_line(530, 720, 560, 880, 28, INK)
    cv.fill_polygon([(430, 780), (465, 780), (455, 870), (435, 870)], BONE)
    cv.fill_polygon([(535, 780), (570, 780), (565, 870), (545, 870)], BONE)
    # Cuirass torso & red cloak
    cv.fill_polygon([(450, 470), (550, 470), (540, 680), (460, 680)], BLOOD)
    cv.fill_polygon([(480, 490), (530, 490), (520, 640), (470, 640)], BONE)
    draw_woodcut_hatching(cv, 480, 500, 40, 120, density=10, color=INK)
    # Aspis Shield (dominant circular woodcut rim & emblem)
    cv.fill_circle(420, 620, 165, INK)
    cv.fill_circle(420, 620, 150, BONE)
    cv.fill_circle(420, 620, 135, INK)
    cv.fill_polygon([(360, 620), (420, 520), (420, 720)], BLOOD) # Red Spartan Lambda V emblem
    # Corinthian Helmet & Tall Crest
    cv.fill_circle(510, 430, 58, INK)
    cv.fill_rect(525, 420, 555, 435, BONE) # Eye slit
    cv.fill_polygon([(460, 370), (560, 320), (580, 380), (490, 410)], BLOOD) # Crest plume
    cv.fill_polygon([(470, 360), (550, 310), (560, 350)], BONE) # Crest highlight
    # Long Spear extending forward
    cv.draw_chisel_line(320, 790, 760, 370, 16, INK)
    cv.draw_chisel_line(320, 790, 760, 370, 8, BONE)
    cv.fill_polygon([(750, 380), (800, 330), (770, 395)], BLOOD) # Leaf spearhead
    cv.export_png(os.path.join(OUT_DIR, 'hoplite.png'))
    print("✓ High-detail hoplite.png rendered")

    # 2. SATYR
    cv = Canvas2D(1024, 1024)
    # Goat legs with detailed fur texture
    cv.fill_polygon([(470, 640), (420, 760), (460, 880), (420, 880), (390, 750), (440, 640)], INK)
    cv.fill_polygon([(530, 640), (570, 760), (540, 880), (580, 880), (600, 750), (560, 640)], INK)
    # Fur chisel cuts
    for y in range(660, 860, 25):
        cv.draw_chisel_line(410, y, 460, y+15, 6, BONE)
        cv.draw_chisel_line(540, y, 590, y+15, 6, BONE)
    # Wiry torso & red sash
    cv.fill_polygon([(460, 470), (540, 470), (530, 650), (470, 650)], BONE)
    draw_woodcut_hatching(cv, 470, 480, 60, 150, density=12, color=INK)
    cv.fill_polygon([(460, 560), (540, 580), (530, 620), (450, 600)], BLOOD)
    # Head & Horns
    cv.fill_circle(500, 430, 48, BONE)
    cv.fill_polygon([(475, 390), (460, 330), (500, 380)], INK) # Curved horn 1
    cv.fill_polygon([(515, 390), (530, 330), (540, 380)], INK) # Curved horn 2
    # Pan Pipes
    cv.fill_polygon([(530, 430), (590, 420), (590, 480), (530, 450)], INK)
    for px in range(540, 590, 8):
        cv.draw_chisel_line(px, 425, px, 475, 3, BONE)
    cv.export_png(os.path.join(OUT_DIR, 'satyr.png'))
    print("✓ High-detail satyr.png rendered")

    # 3. HARPY
    cv = Canvas2D(1024, 1024)
    # Feathered Wings (vast spread silhouette)
    cv.fill_polygon([(480, 480), (220, 320), (260, 480), (320, 620)], INK)
    cv.fill_polygon([(520, 480), (780, 320), (740, 480), (680, 620)], INK)
    for wy in range(350, 580, 30):
        cv.draw_chisel_line(240, wy, 440, wy+40, 6, BONE)
        cv.draw_chisel_line(760, wy, 560, wy+40, 6, BONE)
    # Gaunt body & Talons
    cv.fill_polygon([(475, 450), (525, 450), (510, 740), (490, 740)], BONE)
    draw_woodcut_hatching(cv, 480, 460, 40, 260, density=14, color=INK)
    cv.draw_chisel_line(490, 740, 450, 880, 18, INK)
    cv.draw_chisel_line(510, 740, 550, 880, 18, INK)
    cv.fill_polygon([(430, 880), (470, 880), (440, 910)], BLOOD)
    cv.fill_polygon([(530, 880), (570, 880), (580, 910)], BLOOD)
    # Head & sharp beak
    cv.fill_circle(500, 410, 42, BONE)
    cv.fill_polygon([(520, 400), (585, 420), (520, 435)], BLOOD)
    cv.export_png(os.path.join(OUT_DIR, 'harpy.png'))
    print("✓ High-detail harpy.png rendered")

    # =========================================================================
    # DEMIGOD TIER (~70% frame height)
    # =========================================================================

    # 4. HERACLES
    cv = Canvas2D(1024, 1024)
    # Nemean Lion pelt cloak (massive ink silhouette)
    cv.fill_polygon([(420, 300), (610, 320), (590, 880), (390, 880)], INK)
    for ly in range(350, 850, 35):
        cv.draw_chisel_line(400, ly, 460, ly+20, 8, BONE)
    # Heavy muscular body
    cv.fill_polygon([(460, 360), (560, 360), (540, 660), (460, 660)], BONE)
    draw_woodcut_hatching(cv, 460, 370, 90, 280, density=14, color=INK)
    # Lion Hood
    cv.fill_circle(500, 300, 70, INK)
    cv.fill_polygon([(530, 280), (595, 310), (530, 335)], BLOOD) # Lion jaw
    # Massive Knotted Club
    cv.draw_chisel_line(520, 520, 780, 260, 42, INK)
    cv.fill_circle(780, 260, 52, INK)
    cv.fill_circle(780, 260, 36, BLOOD)
    # Legs
    cv.draw_chisel_line(470, 660, 440, 880, 36, INK)
    cv.draw_chisel_line(540, 660, 560, 880, 36, INK)
    cv.export_png(os.path.join(OUT_DIR, 'heracles.png'))
    print("✓ High-detail heracles.png rendered")

    # 5. PERSEUS
    cv = Canvas2D(1024, 1024)
    # Legs & Winged Sandals
    cv.draw_chisel_line(475, 610, 455, 880, 24, INK)
    cv.draw_chisel_line(525, 610, 545, 880, 24, INK)
    cv.fill_polygon([(535, 840), (595, 830), (565, 875)], BONE) # Winged sandal
    # Torso & Mirrored Shield
    cv.fill_polygon([(460, 350), (540, 350), (530, 620), (470, 620)], BONE)
    draw_woodcut_hatching(cv, 460, 360, 70, 250, density=12, color=INK)
    cv.fill_circle(430, 490, 95, INK)
    cv.fill_circle(430, 490, 82, BONE)
    cv.fill_circle(430, 490, 70, INK) # Mirrored concentric rings
    # Harpe sickle sword
    cv.draw_chisel_line(540, 470, 720, 400, 18, INK)
    cv.fill_polygon([(700, 400), (765, 350), (715, 425)], BLOOD) # Curved sickle tip
    # Helmet & Head
    cv.fill_circle(500, 310, 48, INK)
    cv.export_png(os.path.join(OUT_DIR, 'perseus.png'))
    print("✓ High-detail perseus.png rendered")

    # 6. ACHILLES
    cv = Canvas2D(1024, 1024)
    # Red Cloak & Body
    cv.fill_polygon([(410, 320), (500, 320), (460, 880), (380, 880)], BLOOD)
    cv.fill_polygon([(475, 340), (545, 340), (530, 630), (465, 630)], BONE)
    draw_woodcut_hatching(cv, 475, 350, 60, 270, density=12, color=INK)
    # Greaves
    cv.draw_chisel_line(475, 630, 450, 880, 22, INK)
    cv.draw_chisel_line(525, 630, 545, 880, 22, INK)
    cv.fill_rect(438, 740, 468, 860, BLOOD)
    cv.fill_rect(532, 740, 562, 860, BLOOD)
    # Tall Crested Helm
    cv.fill_circle(500, 280, 48, INK)
    cv.fill_polygon([(465, 230), (575, 180), (585, 240)], INK)
    cv.fill_polygon([(475, 220), (565, 175), (570, 210)], BONE)
    # Long Spear
    cv.draw_chisel_line(330, 760, 820, 270, 16, INK)
    cv.fill_polygon([(810, 280), (860, 230), (830, 295)], INK)
    cv.export_png(os.path.join(OUT_DIR, 'achilles.png'))
    print("✓ High-detail achilles.png rendered")

    # 7. ASCLEPIUS
    cv = Canvas2D(1024, 1024)
    # Robes
    cv.fill_polygon([(440, 330), (560, 330), (590, 880), (410, 880)], BONE)
    draw_woodcut_hatching(cv, 440, 340, 110, 530, density=16, color=INK)
    cv.fill_polygon([(470, 450), (530, 450), (560, 880), (440, 880)], BLOOD)
    # Beard & Head
    cv.fill_circle(500, 280, 48, INK)
    cv.fill_polygon([(470, 290), (530, 350), (460, 340)], BONE)
    # Staff with SINGLE serpent
    cv.draw_chisel_line(630, 180, 630, 880, 20, INK)
    for cy in range(250, 780, 50):
        cv.fill_circle(630 + int(math.sin(cy * 0.04) * 35), cy, 16, BLOOD)
        cv.fill_circle(630 + int(math.sin(cy * 0.04) * 35), cy, 10, BONE)
    cv.export_png(os.path.join(OUT_DIR, 'asclepius.png'))
    print("✓ High-detail asclepius.png rendered")

    # 8. ORPHEUS
    cv = Canvas2D(1024, 1024)
    # Poet's robes
    cv.fill_polygon([(450, 330), (550, 330), (580, 880), (420, 880)], BONE)
    draw_woodcut_hatching(cv, 450, 340, 90, 530, density=14, color=INK)
    cv.fill_polygon([(470, 480), (530, 480), (550, 880), (450, 880)], BLOOD)
    # Head
    cv.fill_circle(500, 280, 45, INK)
    # Lyre
    cv.fill_polygon([(530, 380), (650, 360), (650, 560), (530, 530)], INK)
    cv.fill_polygon([(550, 400), (630, 380), (630, 540), (550, 510)], BONE)
    for sx in range(565, 620, 10):
        cv.draw_chisel_line(sx, 390, sx, 520, 4, INK)
    cv.export_png(os.path.join(OUT_DIR, 'orpheus.png'))
    print("✓ High-detail orpheus.png rendered")

    # 9. DIONYSUS
    cv = Canvas2D(1024, 1024)
    # Robes
    cv.fill_polygon([(440, 330), (560, 330), (580, 880), (420, 880)], BONE)
    cv.fill_polygon([(470, 480), (550, 480), (530, 880), (450, 880)], BLOOD)
    draw_woodcut_hatching(cv, 440, 340, 110, 530, density=16, color=INK)
    # Ivy wreath head
    cv.fill_circle(500, 280, 48, INK)
    cv.fill_circle(500, 250, 28, BLOOD)
    # Thyrsus staff
    cv.draw_chisel_line(610, 160, 610, 880, 18, INK)
    cv.fill_polygon([(575, 160), (645, 160), (610, 90)], BLOOD)
    cv.fill_circle(410, 440, 28, INK) # Drinking cup
    cv.export_png(os.path.join(OUT_DIR, 'dionysus.png'))
    print("✓ High-detail dionysus.png rendered")

    # 10. AENEAS
    cv = Canvas2D(1024, 1024)
    # Heavy armor body
    cv.fill_polygon([(440, 320), (560, 320), (570, 880), (430, 880)], INK)
    cv.fill_rect(460, 380, 540, 600, BONE)
    draw_woodcut_hatching(cv, 460, 390, 70, 200, density=12, color=INK)
    # Large Protective Shield
    cv.fill_polygon([(510, 360), (670, 360), (640, 830), (480, 830)], BLOOD)
    cv.fill_polygon([(530, 380), (650, 380), (620, 810), (500, 810)], INK)
    cv.fill_polygon([(550, 400), (630, 400), (600, 790), (520, 790)], BONE)
    # Head & Helm
    cv.fill_circle(500, 260, 52, INK)
    cv.export_png(os.path.join(OUT_DIR, 'aeneas.png'))
    print("✓ High-detail aeneas.png rendered")

    # =========================================================================
    # GOD TIER (~85% frame height)
    # =========================================================================

    # 11. ZEUS
    cv = Canvas2D(1024, 1024)
    # Majestic divine body & Aegis
    cv.fill_polygon([(410, 180), (590, 180), (630, 880), (370, 880)], INK)
    cv.fill_polygon([(450, 240), (550, 240), (530, 700), (430, 700)], BONE)
    draw_woodcut_hatching(cv, 450, 250, 90, 440, density=14, color=INK)
    cv.fill_polygon([(380, 260), (470, 260), (400, 880)], BLOOD) # Aegis cloak
    # Head & Full Beard
    cv.fill_circle(500, 160, 58, INK)
    cv.fill_polygon([(440, 170), (560, 170), (530, 270), (470, 270)], BONE) # Beard
    draw_woodcut_hatching(cv, 450, 180, 100, 80, density=10, color=INK)
    # Thunderbolt raised in right hand
    cv.draw_chisel_line(540, 280, 820, 70, 24, BLOOD)
    cv.fill_polygon([(790, 90), (860, 30), (810, 120)], BONE) # Jagged bolt tip
    cv.export_png(os.path.join(OUT_DIR, 'zeus.png'))
    print("✓ High-detail zeus.png rendered")

    # 12. HERA
    cv = Canvas2D(1024, 1024)
    # Imperious robes
    cv.fill_polygon([(430, 200), (570, 200), (610, 880), (390, 880)], BONE)
    draw_woodcut_hatching(cv, 430, 210, 130, 660, density=16, color=INK)
    cv.fill_polygon([(450, 280), (550, 280), (590, 880), (410, 880)], BLOOD)
    # Head & Tall Diadem crown
    cv.fill_circle(500, 160, 50, INK)
    cv.fill_polygon([(450, 120), (550, 120), (500, 50)], INK)
    cv.fill_polygon([(470, 110), (530, 110), (500, 70)], BONE)
    # Sceptre
    cv.draw_chisel_line(610, 70, 610, 880, 18, INK)
    cv.fill_circle(610, 70, 32, BLOOD)
    cv.export_png(os.path.join(OUT_DIR, 'hera.png'))
    print("✓ High-detail hera.png rendered")

    # 13. POSEIDON
    cv = Canvas2D(1024, 1024)
    # Torso & Ocean drapery
    cv.fill_polygon([(420, 190), (580, 190), (610, 880), (390, 880)], INK)
    cv.fill_polygon([(460, 240), (560, 240), (530, 660), (440, 660)], BONE)
    draw_woodcut_hatching(cv, 460, 250, 90, 400, density=14, color=INK)
    # Wild beard & Head
    cv.fill_circle(500, 160, 58, INK)
    cv.fill_polygon([(430, 170), (570, 170), (540, 290), (460, 290)], BONE)
    draw_woodcut_hatching(cv, 440, 180, 120, 100, density=10, color=INK)
    # Trident
    cv.draw_chisel_line(640, 60, 640, 880, 22, INK)
    cv.draw_chisel_line(570, 100, 710, 100, 18, INK)
    cv.draw_chisel_line(580, 30, 580, 100, 16, BLOOD)
    cv.draw_chisel_line(640, 10, 640, 100, 18, BLOOD)
    cv.draw_chisel_line(700, 30, 700, 100, 16, BLOOD)
    cv.export_png(os.path.join(OUT_DIR, 'poseidon.png'))
    print("✓ High-detail poseidon.png rendered")

    # 14. HADES
    cv = Canvas2D(1024, 1024)
    # Dark heavy robes
    cv.fill_polygon([(410, 180), (590, 180), (630, 880), (370, 880)], INK)
    cv.fill_polygon([(460, 280), (540, 280), (560, 880), (440, 880)], BLOOD)
    draw_woodcut_hatching(cv, 410, 190, 170, 680, density=18, color=INK)
    # Shadowed helm
    cv.fill_circle(500, 150, 55, INK)
    # Bident
    cv.draw_chisel_line(630, 60, 630, 880, 22, INK)
    cv.draw_chisel_line(580, 20, 580, 110, 16, INK)
    cv.draw_chisel_line(680, 20, 680, 110, 16, INK)
    cv.export_png(os.path.join(OUT_DIR, 'hades.png'))
    print("✓ High-detail hades.png rendered")

    # 15. ATHENA
    cv = Canvas2D(1024, 1024)
    # Tactical body & Cuirass
    cv.fill_polygon([(430, 190), (570, 190), (590, 880), (410, 880)], BONE)
    cv.fill_polygon([(450, 260), (550, 260), (540, 660), (460, 660)], INK)
    draw_woodcut_hatching(cv, 430, 200, 130, 670, density=14, color=INK)
    # Crested Helm
    cv.fill_circle(500, 150, 52, INK)
    cv.fill_polygon([(450, 100), (570, 50), (580, 110)], BLOOD)
    # Spear
    cv.draw_chisel_line(650, 30, 650, 880, 20, INK)
    cv.fill_polygon([(630, 30), (670, 30), (650, -10)], BLOOD)
    # Owl at shoulder
    cv.fill_circle(420, 220, 26, INK)
    cv.fill_circle(420, 220, 14, BONE)
    cv.export_png(os.path.join(OUT_DIR, 'athena.png'))
    print("✓ High-detail athena.png rendered")

    # 16. ARES
    cv = Canvas2D(1024, 1024)
    # Heavy body & War Harness
    cv.fill_polygon([(420, 180), (580, 180), (610, 880), (390, 880)], INK)
    cv.fill_polygon([(450, 240), (550, 240), (560, 720), (440, 720)], BLOOD)
    draw_woodcut_hatching(cv, 420, 190, 150, 680, density=14, color=INK)
    # Full face helm
    cv.fill_circle(500, 140, 58, INK)
    cv.fill_rect(475, 140, 525, 152, BLOOD)
    # Spear & Shield
    cv.draw_chisel_line(530, 260, 810, 90, 24, INK)
    cv.fill_circle(430, 440, 108, INK)
    cv.fill_circle(430, 440, 88, BLOOD)
    cv.export_png(os.path.join(OUT_DIR, 'ares.png'))
    print("✓ High-detail ares.png rendered")

    # 17. APHRODITE
    cv = Canvas2D(1024, 1024)
    # Elegant flowing drapery
    cv.fill_polygon([(440, 200), (560, 200), (620, 880), (380, 880)], BONE)
    draw_woodcut_hatching(cv, 440, 210, 110, 660, density=16, color=INK)
    cv.fill_polygon([(460, 300), (540, 300), (580, 880), (420, 880)], BLOOD)
    # Head & hair
    cv.fill_circle(500, 160, 48, BONE)
    cv.fill_circle(475, 180, 38, INK)
    # Mirror & Dove
    cv.fill_circle(590, 300, 34, INK)
    cv.fill_circle(590, 300, 22, BONE)
    cv.fill_circle(370, 230, 22, BONE)
    cv.export_png(os.path.join(OUT_DIR, 'aphrodite.png'))
    print("✓ High-detail aphrodite.png rendered")

    # 18. HEPHAESTUS
    cv = Canvas2D(1024, 1024)
    # Broad low stocky body
    cv.fill_polygon([(390, 240), (610, 240), (630, 880), (370, 880)], INK)
    cv.fill_polygon([(430, 300), (570, 300), (550, 820), (450, 820)], BLOOD)
    draw_woodcut_hatching(cv, 390, 250, 210, 620, density=16, color=INK)
    # Head & beard
    cv.fill_circle(500, 200, 54, BONE)
    cv.fill_polygon([(450, 210), (550, 210), (500, 300)], INK)
    # Massive Smith Hammer
    cv.draw_chisel_line(550, 430, 780, 210, 32, INK)
    cv.fill_rect(730, 160, 820, 250, INK)
    cv.fill_rect(740, 170, 810, 240, BLOOD)
    cv.export_png(os.path.join(OUT_DIR, 'hephaestus.png'))
    print("✓ High-detail hephaestus.png rendered")

    # 19. APOLLO
    cv = Canvas2D(1024, 1024)
    # Sun Rays
    for angle in range(0, 360, 22):
        rad = math.radians(angle)
        x1 = 500 + math.cos(rad) * 90
        y1 = 150 + math.sin(rad) * 90
        x2 = 500 + math.cos(rad) * 180
        y2 = 150 + math.sin(rad) * 180
        cv.draw_chisel_line(x1, y1, x2, y2, 9, BLOOD)
    # Body & Robes
    cv.fill_polygon([(440, 200), (560, 200), (590, 880), (410, 880)], BONE)
    draw_woodcut_hatching(cv, 440, 210, 110, 660, density=16, color=INK)
    cv.fill_polygon([(460, 280), (540, 280), (560, 880), (440, 880)], BLOOD)
    # Head & Laurel Wreath
    cv.fill_circle(500, 150, 48, BONE)
    cv.fill_circle(500, 125, 28, INK)
    # Bow
    cv.draw_chisel_line(630, 230, 630, 670, 18, INK)
    cv.export_png(os.path.join(OUT_DIR, 'apollo.png'))
    print("✓ High-detail apollo.png rendered")

    # 20. ARTEMIS
    cv = Canvas2D(1024, 1024)
    # Huntress body
    cv.fill_polygon([(440, 200), (550, 200), (570, 880), (430, 880)], BONE)
    draw_woodcut_hatching(cv, 440, 210, 100, 660, density=14, color=INK)
    cv.fill_polygon([(450, 280), (530, 280), (510, 770), (440, 770)], INK)
    # Crescent moon brow & Head
    cv.fill_circle(490, 150, 48, BONE)
    cv.fill_circle(490, 110, 22, BLOOD)
    # Drawn Bow & Arrow
    cv.draw_chisel_line(590, 160, 590, 600, 20, INK)
    cv.draw_chisel_line(470, 370, 750, 370, 14, BLOOD)
    cv.fill_polygon([(740, 360), (775, 370), (740, 380)], BLOOD)
    # Hound
    cv.fill_polygon([(380, 700), (450, 700), (440, 880), (370, 880)], INK)
    cv.export_png(os.path.join(OUT_DIR, 'artemis.png'))
    print("✓ High-detail artemis.png rendered")

    # =========================================================================
    # TITAN TIER (100% frame height, y 40px to 980px)
    # =========================================================================

    # 21. CRONUS
    cv = Canvas2D(1024, 1024)
    # Colossal titan mass 100%
    cv.fill_polygon([(340, 80), (660, 80), (720, 980), (280, 980)], INK)
    draw_woodcut_hatching(cv, 340, 90, 310, 880, density=20, color=INK)
    cv.fill_polygon([(400, 220), (600, 220), (570, 860), (430, 860)], BLOOD)
    # Devouring Maw Head
    cv.fill_circle(500, 130, 85, INK)
    cv.fill_polygon([(440, 130), (560, 130), (500, 240)], BONE)
    # Giant Harpe Scythe
    cv.draw_chisel_line(670, 40, 670, 980, 32, INK)
    cv.fill_polygon([(660, 40), (880, 160), (660, 230)], BLOOD)
    cv.fill_polygon([(670, 60), (850, 160), (670, 200)], BONE)
    cv.export_png(os.path.join(OUT_DIR, 'cronus.png'))
    print("✓ High-detail cronus.png rendered")

    # 22. TYPHON
    cv = Canvas2D(1024, 1024)
    # Vast wings spanning top
    cv.fill_polygon([(500, 220), (60, 50), (280, 460)], INK)
    cv.fill_polygon([(500, 220), (940, 50), (720, 460)], INK)
    draw_woodcut_hatching(cv, 60, 50, 870, 400, density=18, color=BLOOD)
    # Multiple heads
    cv.fill_circle(500, 120, 58, INK)
    cv.fill_circle(410, 150, 46, BLOOD)
    cv.fill_circle(590, 150, 46, BLOOD)
    # Serpentine lower coils
    cv.draw_chisel_line(450, 380, 280, 680, 68, INK)
    cv.draw_chisel_line(280, 680, 560, 960, 68, INK)
    cv.draw_chisel_line(550, 380, 720, 680, 68, INK)
    cv.draw_chisel_line(720, 680, 440, 960, 68, INK)
    cv.export_png(os.path.join(OUT_DIR, 'typhon.png'))
    print("✓ High-detail typhon.png rendered")

    print("\nALL 22 HIGH-DETAIL WOODCUT SPRITES RENDERED CLEANLY!")

if __name__ == '__main__':
    render_high_detail_roster()
