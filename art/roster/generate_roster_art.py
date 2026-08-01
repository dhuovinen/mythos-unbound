#!/usr/bin/env python3
import os
import math
from rasterizer import Canvas2D, INK, BONE, BLOOD

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

def generate_all_units():
    print("Generating 22 production roster sprites in Style C-B...")
    
    # -------------------------------------------------------------
    # CHAFF TIER (~55% frame height, baseline y ~880px)
    # -------------------------------------------------------------
    
    # 1. hoplite.png (mostly round aspis shield, spear, crested helm)
    cv = Canvas2D(1024, 1024)
    # Body ink mass
    cv.fill_polygon([(460, 480), (530, 480), (550, 880), (440, 880)], INK)
    # Legs (facing right)
    cv.draw_chisel_line(470, 750, 450, 880, 24, INK)
    cv.draw_chisel_line(520, 750, 540, 880, 24, INK)
    # Bone skin highlights
    cv.fill_rect(500, 500, 525, 650, BONE)
    # Large Aspis Shield (dominates silhouette ~40%)
    cv.fill_circle(440, 640, 160, INK)
    cv.fill_circle(440, 640, 145, BONE)
    cv.fill_polygon([(380, 640), (440, 550), (440, 730)], BLOOD) # Red chevron emblem
    # Spear angled forward right
    cv.draw_chisel_line(350, 780, 720, 420, 16, INK)
    cv.fill_polygon([(710, 430), (745, 395), (730, 445)], INK) # Spear tip
    # Crested Helm facing right
    cv.fill_circle(500, 450, 55, INK)
    cv.fill_polygon([(470, 400), (540, 370), (560, 410), (490, 430)], BLOOD) # Crest plume
    cv.export_png(os.path.join(OUT_DIR, 'hoplite.png'))
    print("✓ hoplite.png generated")

    # 2. satyr.png (small wiry goat legs, pan pipes, short horns)
    cv = Canvas2D(1024, 1024)
    # Goat legs
    cv.fill_polygon([(480, 650), (440, 760), (470, 880), (430, 880), (400, 750), (450, 650)], INK)
    cv.fill_polygon([(530, 650), (560, 760), (530, 880), (570, 880), (590, 750), (550, 650)], INK)
    # Torso wiry bone
    cv.fill_polygon([(460, 480), (540, 480), (530, 660), (470, 660)], BONE)
    cv.draw_chisel_line(470, 540, 530, 540, 12, INK)
    # Red sash
    cv.fill_polygon([(470, 580), (540, 600), (530, 630), (460, 610)], BLOOD)
    # Head & Horns
    cv.fill_circle(500, 440, 45, BONE)
    cv.fill_polygon([(490, 400), (480, 360), (510, 390)], INK) # Short horn
    cv.fill_polygon([(510, 400), (520, 360), (530, 390)], INK) # Short horn
    # Pan pipes held to mouth facing right
    cv.fill_polygon([(530, 440), (580, 440), (580, 490), (530, 460)], INK)
    cv.export_png(os.path.join(OUT_DIR, 'satyr.png'))
    print("✓ satyr.png generated")

    # 3. harpy.png (winged bird-woman, gaunt, hooked talons)
    cv = Canvas2D(1024, 1024)
    # Wings spread breaking silhouette
    cv.fill_polygon([(480, 500), (250, 350), (320, 600)], INK)
    cv.fill_polygon([(520, 500), (750, 350), (680, 600)], INK)
    # Gaunt body
    cv.fill_polygon([(480, 460), (520, 460), (510, 720), (490, 720)], BONE)
    cv.draw_chisel_line(470, 470, 530, 720, 14, INK)
    # Hooked Talons
    cv.draw_chisel_line(490, 720, 460, 880, 16, INK)
    cv.draw_chisel_line(510, 720, 540, 880, 16, INK)
    cv.fill_polygon([(440, 880), (470, 880), (450, 900)], INK)
    cv.fill_polygon([(520, 880), (550, 880), (560, 900)], INK)
    # Head & beak
    cv.fill_circle(500, 420, 40, BONE)
    cv.fill_polygon([(520, 410), (570, 430), (520, 440)], BLOOD) # Sharp beak accent
    cv.export_png(os.path.join(OUT_DIR, 'harpy.png'))
    print("✓ harpy.png generated")

    # -------------------------------------------------------------
    # DEMIGOD TIER (~70% frame height, baseline y ~880px)
    # -------------------------------------------------------------
    
    # 4. heracles.png (Lion pelt hood/cloak, massive knotted club)
    cv = Canvas2D(1024, 1024)
    # Lion pelt cloak (ink mass)
    cv.fill_polygon([(430, 330), (600, 360), (580, 880), (400, 880)], INK)
    # Muscular torso
    cv.fill_polygon([(470, 380), (550, 380), (540, 650), (460, 650)], BONE)
    cv.draw_chisel_line(460, 480, 550, 480, 18, INK)
    # Lion head hood over head
    cv.fill_circle(500, 330, 65, INK)
    cv.fill_polygon([(520, 310), (580, 340), (520, 360)], BLOOD) # Lion jaw accent
    # Massive Knotted Club held forward
    cv.draw_chisel_line(520, 520, 750, 300, 36, INK)
    cv.fill_circle(750, 300, 45, INK)
    cv.fill_circle(750, 300, 30, BLOOD)
    # Legs
    cv.draw_chisel_line(470, 650, 450, 880, 32, INK)
    cv.draw_chisel_line(530, 650, 550, 880, 32, INK)
    cv.export_png(os.path.join(OUT_DIR, 'heracles.png'))
    print("✓ heracles.png generated")

    # 5. perseus.png (winged sandals, harpe sword, mirrored shield)
    cv = Canvas2D(1024, 1024)
    # Legs & Winged Sandals
    cv.draw_chisel_line(480, 620, 460, 880, 22, INK)
    cv.draw_chisel_line(530, 620, 540, 880, 22, INK)
    cv.fill_polygon([(530, 850), (580, 840), (550, 870)], BONE) # Winged sandal detail
    # Torso & Mirrored shield on left arm
    cv.fill_polygon([(460, 360), (540, 360), (530, 630), (470, 630)], BONE)
    cv.fill_circle(440, 500, 90, INK)
    cv.fill_circle(440, 500, 75, BONE) # Mirrored surface
    # Curved Harpe Sword in right hand forward
    cv.draw_chisel_line(540, 480, 700, 420, 16, INK)
    cv.fill_polygon([(680, 420), (740, 380), (690, 440)], BLOOD) # Curved sickle tip
    # Head & Helmet
    cv.fill_circle(500, 320, 45, INK)
    cv.export_png(os.path.join(OUT_DIR, 'perseus.png'))
    print("✓ perseus.png generated")

    # 6. achilles.png (tall crested helm, long spear, ornate greaves)
    cv = Canvas2D(1024, 1024)
    # Lean body & red cloak
    cv.fill_polygon([(420, 340), (500, 340), (470, 880), (400, 880)], BLOOD) # Cloak
    cv.fill_polygon([(480, 360), (540, 360), (530, 640), (470, 640)], BONE)
    # Greaves & Legs
    cv.draw_chisel_line(480, 640, 460, 880, 20, INK)
    cv.draw_chisel_line(520, 640, 540, 880, 20, INK)
    cv.fill_rect(445, 750, 475, 850, BLOOD) # Greaves accent
    cv.fill_rect(525, 750, 555, 850, BLOOD)
    # Tall Crested Helm
    cv.fill_circle(500, 300, 45, INK)
    cv.fill_polygon([(470, 250), (560, 210), (570, 260)], INK) # Crest
    # Long spear
    cv.draw_chisel_line(350, 750, 780, 300, 14, INK)
    cv.fill_polygon([(770, 310), (810, 270), (790, 320)], INK)
    cv.export_png(os.path.join(OUT_DIR, 'achilles.png'))
    print("✓ achilles.png generated")

    # 7. asclepius.png (staff with SINGLE serpent, physician robe)
    cv = Canvas2D(1024, 1024)
    # Physician robes
    cv.fill_polygon([(450, 350), (550, 350), (580, 880), (420, 880)], BONE)
    cv.draw_chisel_line(450, 350, 580, 880, 16, INK)
    cv.draw_chisel_line(550, 350, 420, 880, 16, INK)
    # Head & beard
    cv.fill_circle(500, 300, 45, INK)
    cv.fill_polygon([(480, 310), (530, 360), (470, 350)], BONE) # Beard
    # Staff with single serpent held in right hand facing right
    cv.draw_chisel_line(620, 220, 620, 880, 18, INK) # Staff
    # Coiled Serpent
    for cy in range(300, 750, 60):
        cv.fill_circle(620 + int(math.sin(cy * 0.05) * 30), cy, 14, BLOOD)
    cv.export_png(os.path.join(OUT_DIR, 'asclepius.png'))
    print("✓ asclepius.png generated")

    # 8. orpheus.png (Lyre held forward, poet robes, no weapon)
    cv = Canvas2D(1024, 1024)
    # Poet's robes
    cv.fill_polygon([(460, 350), (540, 350), (570, 880), (430, 880)], BONE)
    cv.fill_polygon([(460, 450), (540, 450), (560, 880), (440, 880)], BLOOD) # Under-robe
    # Head
    cv.fill_circle(500, 300, 42, INK)
    # Lyre held forward in hands
    cv.fill_polygon([(540, 400), (640, 380), (640, 550), (540, 520)], INK)
    cv.fill_polygon([(560, 420), (620, 400), (620, 530), (560, 500)], BONE)
    for sx in range(575, 615, 10):
        cv.draw_chisel_line(sx, 410, sx, 510, 4, INK) # Lyre strings
    cv.export_png(os.path.join(OUT_DIR, 'orpheus.png'))
    print("✓ orpheus.png generated")

    # 9. dionysus.png (Thyrsus pinecone staff, grape vines, drinking cup)
    cv = Canvas2D(1024, 1024)
    # Robes & loose stance
    cv.fill_polygon([(450, 350), (550, 350), (570, 880), (430, 880)], BONE)
    cv.fill_polygon([(480, 500), (560, 500), (540, 880), (460, 880)], BLOOD)
    # Head with ivy wreath
    cv.fill_circle(500, 300, 45, INK)
    cv.fill_circle(500, 270, 25, BLOOD) # Grape wreath
    # Thyrsus staff with pinecone top
    cv.draw_chisel_line(600, 200, 600, 880, 16, INK)
    cv.fill_polygon([(570, 200), (630, 200), (600, 140)], BLOOD) # Pinecone tip
    # Drinking cup in left hand
    cv.fill_polygon([(410, 450), (450, 450), (430, 490)], INK)
    cv.export_png(os.path.join(OUT_DIR, 'dionysus.png'))
    print("✓ dionysus.png generated")

    # 10. aeneas.png (large protective shield, heavy armor)
    cv = Canvas2D(1024, 1024)
    # Heavy armor body
    cv.fill_polygon([(450, 340), (550, 340), (560, 880), (440, 880)], INK)
    cv.fill_rect(470, 400, 530, 600, BONE) # Cuirass
    # Large Tower Shield in front
    cv.fill_polygon([(520, 380), (660, 380), (640, 820), (500, 820)], BLOOD)
    cv.fill_polygon([(540, 400), (640, 400), (620, 800), (520, 800)], INK)
    # Head & Helm
    cv.fill_circle(500, 280, 48, INK)
    cv.export_png(os.path.join(OUT_DIR, 'aeneas.png'))
    print("✓ aeneas.png generated")

    # -------------------------------------------------------------
    # GOD TIER (~85% frame height, baseline y ~880px)
    # -------------------------------------------------------------

    # 11. zeus.png (Thunderbolt raised, full beard, aegis shoulder)
    cv = Canvas2D(1024, 1024)
    # Majestic divine body & cloak
    cv.fill_polygon([(420, 200), (580, 200), (620, 880), (380, 880)], INK)
    cv.fill_polygon([(460, 260), (540, 260), (520, 700), (440, 700)], BONE)
    cv.fill_polygon([(400, 280), (480, 280), (420, 880)], BLOOD) # Aegis cloak
    # Head & Full Beard (major mass)
    cv.fill_circle(500, 180, 55, INK)
    cv.fill_polygon([(450, 190), (550, 190), (520, 280), (480, 280)], BONE) # Full beard
    # Thunderbolt raised in right hand
    cv.draw_chisel_line(540, 300, 780, 100, 20, BLOOD)
    cv.fill_polygon([(750, 120), (820, 70), (780, 150)], BONE) # Jagged bolt tip
    cv.export_png(os.path.join(OUT_DIR, 'zeus.png'))
    print("✓ zeus.png generated")

    # 12. hera.png (Tall diadem, peacock feather motif, sceptre)
    cv = Canvas2D(1024, 1024)
    # Imperious robes
    cv.fill_polygon([(440, 220), (560, 220), (600, 880), (400, 880)], BONE)
    cv.fill_polygon([(460, 300), (540, 300), (580, 880), (420, 880)], BLOOD)
    # Head & Tall Diadem crown
    cv.fill_circle(500, 180, 48, INK)
    cv.fill_polygon([(460, 140), (540, 140), (500, 80)], INK) # Tall Crown
    # Sceptre in right hand
    cv.draw_chisel_line(600, 100, 600, 880, 16, INK)
    cv.fill_circle(600, 100, 28, BLOOD) # Peacock orb top
    cv.export_png(os.path.join(OUT_DIR, 'hera.png'))
    print("✓ hera.png generated")

    # 13. poseidon.png (Trident, wild beard, wave motifs)
    cv = Canvas2D(1024, 1024)
    # Powerful torso & ocean drapery
    cv.fill_polygon([(430, 210), (570, 210), (600, 880), (400, 880)], INK)
    cv.fill_polygon([(470, 260), (550, 260), (530, 650), (450, 650)], BONE)
    # Wild beard & head
    cv.fill_circle(500, 180, 55, INK)
    cv.fill_polygon([(440, 190), (560, 190), (540, 300), (460, 300)], BONE) # Wild beard
    # Trident held forward
    cv.draw_chisel_line(630, 80, 630, 880, 20, INK)
    cv.draw_chisel_line(570, 120, 690, 120, 16, INK) # Crossbar
    cv.draw_chisel_line(580, 50, 580, 120, 14, BLOOD) # Left prong
    cv.draw_chisel_line(630, 30, 630, 120, 16, BLOOD) # Center prong
    cv.draw_chisel_line(680, 50, 680, 120, 14, BLOOD) # Right prong
    cv.export_png(os.path.join(OUT_DIR, 'poseidon.png'))
    print("✓ poseidon.png generated")

    # 14. hades.png (Bident, shadowed helm, still heavy posture)
    cv = Canvas2D(1024, 1024)
    # Still, heavy dark robes mass
    cv.fill_polygon([(420, 200), (580, 200), (620, 880), (380, 880)], INK)
    cv.fill_polygon([(470, 300), (530, 300), (550, 880), (450, 880)], BLOOD)
    # Shadowed helm & head
    cv.fill_circle(500, 170, 52, INK)
    # Bident in hand
    cv.draw_chisel_line(620, 80, 620, 880, 20, INK)
    cv.draw_chisel_line(580, 50, 580, 130, 14, INK) # Prong 1
    cv.draw_chisel_line(660, 50, 660, 130, 14, INK) # Prong 2
    cv.export_png(os.path.join(OUT_DIR, 'hades.png'))
    print("✓ hades.png generated")

    # 15. athena.png (Crested helm, aegis, spear, owl shoulder)
    cv = Canvas2D(1024, 1024)
    # Armored tactical body
    cv.fill_polygon([(440, 210), (560, 210), (580, 880), (420, 880)], BONE)
    cv.fill_polygon([(460, 280), (540, 280), (530, 650), (470, 650)], INK) # Cuirass
    # Crested Helm
    cv.fill_circle(500, 170, 48, INK)
    cv.fill_polygon([(460, 120), (560, 80), (570, 130)], BLOOD) # Crest
    # Spear
    cv.draw_chisel_line(640, 50, 640, 880, 18, INK)
    cv.fill_polygon([(625, 50), (655, 50), (640, 10)], BLOOD)
    # Owl at shoulder
    cv.fill_circle(430, 240, 24, INK)
    cv.export_png(os.path.join(OUT_DIR, 'athena.png'))
    print("✓ athena.png generated")

    # 16. ares.png (Full-face war helm, spear & shield, aggressive stance)
    cv = Canvas2D(1024, 1024)
    # Aggressive heavy body
    cv.fill_polygon([(430, 200), (570, 200), (600, 880), (400, 880)], INK)
    cv.fill_polygon([(460, 260), (540, 260), (550, 700), (450, 700)], BLOOD) # War harness
    # Full face helm
    cv.fill_circle(500, 160, 55, INK)
    cv.fill_rect(480, 160, 520, 170, BLOOD) # Visor slit
    # Spear & Shield forward
    cv.draw_chisel_line(530, 280, 780, 120, 22, INK)
    cv.fill_circle(440, 450, 100, INK)
    cv.fill_circle(440, 450, 80, BLOOD)
    cv.export_png(os.path.join(OUT_DIR, 'ares.png'))
    print("✓ ares.png generated")

    # 17. aphrodite.png (Flowing drapery, dove, hand mirror, no weapon)
    cv = Canvas2D(1024, 1024)
    # Elegant flowing drapery
    cv.fill_polygon([(450, 220), (550, 220), (610, 880), (390, 880)], BONE)
    cv.fill_polygon([(470, 320), (530, 320), (570, 880), (430, 880)], BLOOD)
    # Head & hair
    cv.fill_circle(500, 180, 45, BONE)
    cv.fill_circle(480, 200, 35, INK) # Hair mass
    # Hand mirror held right
    cv.fill_circle(580, 320, 30, INK)
    cv.fill_circle(580, 320, 20, BONE)
    # Dove floating nearby
    cv.fill_circle(380, 250, 20, BONE)
    cv.export_png(os.path.join(OUT_DIR, 'aphrodite.png'))
    print("✓ aphrodite.png generated")

    # 18. hephaestus.png (Smith hammer/tongs, forge apron, broad low stance)
    cv = Canvas2D(1024, 1024)
    # Broad low stocky body
    cv.fill_polygon([(400, 260), (600, 260), (620, 880), (380, 880)], INK)
    cv.fill_polygon([(440, 320), (560, 320), (540, 800), (460, 800)], BLOOD) # Forge apron
    # Head & beard
    cv.fill_circle(500, 220, 50, BONE)
    cv.fill_polygon([(460, 230), (540, 230), (500, 310)], INK)
    # Massive Smith Hammer
    cv.draw_chisel_line(550, 450, 750, 250, 28, INK)
    cv.fill_rect(710, 200, 790, 280, INK) # Hammer head
    cv.export_png(os.path.join(OUT_DIR, 'hephaestus.png'))
    print("✓ hephaestus.png generated")

    # 19. apollo.png (Lyre & bow, laurel wreath, radiating linework)
    cv = Canvas2D(1024, 1024)
    # Radiating sun linework behind head
    for angle in range(0, 360, 30):
        rad = math.radians(angle)
        x1 = 500 + math.cos(rad) * 90
        y1 = 170 + math.sin(rad) * 90
        x2 = 500 + math.cos(rad) * 160
        y2 = 170 + math.sin(rad) * 160
        cv.draw_chisel_line(x1, y1, x2, y2, 8, BLOOD)
    # Body & Robes
    cv.fill_polygon([(450, 220), (550, 220), (580, 880), (420, 880)], BONE)
    cv.fill_polygon([(470, 300), (530, 300), (550, 880), (450, 880)], BLOOD)
    # Head with Laurel Wreath
    cv.fill_circle(500, 170, 45, BONE)
    cv.fill_circle(500, 145, 25, INK) # Laurel
    # Bow held in right hand
    cv.draw_chisel_line(620, 250, 620, 650, 16, INK)
    cv.export_png(os.path.join(OUT_DIR, 'apollo.png'))
    print("✓ apollo.png generated")

    # 20. artemis.png (Drawn bow, quiver, crescent moon brow, hound)
    cv = Canvas2D(1024, 1024)
    # Agile huntress body
    cv.fill_polygon([(450, 220), (540, 220), (560, 880), (440, 880)], BONE)
    cv.fill_polygon([(460, 300), (520, 300), (500, 750), (450, 750)], INK) # Tunic
    # Crescent moon at brow & head
    cv.fill_circle(490, 170, 45, BONE)
    cv.fill_circle(490, 130, 20, BLOOD) # Crescent moon
    # Drawn Bow & Arrow pointing right
    cv.draw_chisel_line(580, 180, 580, 580, 18, INK) # Bow arc
    cv.draw_chisel_line(480, 380, 720, 380, 12, BLOOD) # Arrow
    cv.fill_polygon([(710, 370), (740, 380), (710, 390)], BLOOD) # Arrowhead
    # Hound at heel
    cv.fill_polygon([(400, 720), (460, 720), (450, 880), (390, 880)], INK)
    cv.export_png(os.path.join(OUT_DIR, 'artemis.png'))
    print("✓ artemis.png generated")

    # -------------------------------------------------------------
    # TITAN TIER (100% frame height, y 80px to 980px)
    # -------------------------------------------------------------

    # 21. cronus.png (Colossal, harpe scythe, devouring menace filling frame)
    cv = Canvas2D(1024, 1024)
    # Colossal titan mass filling frame 100%
    cv.fill_polygon([(360, 120), (640, 120), (700, 980), (300, 980)], INK)
    cv.fill_polygon([(420, 250), (580, 250), (550, 850), (450, 850)], BLOOD)
    # Massive Head & Devouring Maw
    cv.fill_circle(500, 160, 75, INK)
    cv.fill_polygon([(450, 160), (550, 160), (500, 260)], BONE) # Open maw
    # Giant Harpe Scythe
    cv.draw_chisel_line(650, 60, 650, 980, 28, INK)
    cv.fill_polygon([(640, 60), (840, 180), (640, 240)], BLOOD) # Massive blade
    cv.export_png(os.path.join(OUT_DIR, 'cronus.png'))
    print("✓ cronus.png generated")

    # 22. typhon.png (Serpentine coils, multiple heads, vast wings)
    cv = Canvas2D(1024, 1024)
    # Vast wings spanning top
    cv.fill_polygon([(500, 250), (100, 80), (300, 450)], INK)
    cv.fill_polygon([(500, 250), (900, 80), (700, 450)], INK)
    # Multiple heads
    cv.fill_circle(500, 150, 50, INK) # Center head
    cv.fill_circle(420, 180, 40, BLOOD) # Left head
    cv.fill_circle(580, 180, 40, BLOOD) # Right head
    # Serpentine lower coils filling bottom
    cv.draw_chisel_line(450, 400, 300, 700, 60, INK)
    cv.draw_chisel_line(300, 700, 550, 950, 60, INK)
    cv.draw_chisel_line(550, 400, 700, 700, 60, INK)
    cv.draw_chisel_line(700, 700, 450, 950, 60, INK)
    cv.export_png(os.path.join(OUT_DIR, 'typhon.png'))
    print("✓ typhon.png generated")

    print("\nALL 22 PRODUCTION ROSTER SPRITES GENERATED SUCCESSFULLY!")

if __name__ == '__main__':
    generate_all_units()
