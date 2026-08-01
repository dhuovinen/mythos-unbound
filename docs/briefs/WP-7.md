# WP-7 — Art concept boards

**Model tier: image generation. Status: DELIVERED (two rounds).**

## ⚠️ Path rule — read this before running WP-7 again

**Write only inside `art/concepts/`. Never write to the repository root.**

Both delivered rounds wrote `index.html`, `styles.css` and `assets/` to the project root, which
**overwrote the game's own `index.html` entry point** and required manual recovery each time. The
game and the concept board are two different web pages living in one repo; only the game owns the
root.

Correct locations:

| File | Correct path |
|---|---|
| Concept board page | `art/concepts/index.html` |
| Its stylesheet | `art/concepts/styles.css` |
| Renders | `art/concepts/assets/` |

Do not touch `index.html`, `NOTES.md`, `src/`, `public/`, or anything else at the root.

## Goal

Three (now four) visual directions for the game, each rendering the **same three test subjects** so
they are directly comparable: **Zeus** (god), **Heracles** (demigod), **Hoplite** (chaff).

The decision gate is small-size readability: if a style can't keep those three distinguishable at
**64 px tall**, it fails regardless of how good the full-size render looks. Charm is the tiebreaker,
not the primary criterion.

**Shared output spec:** 1024×1024, transparent background, single character centred, full body, side
view facing right, neutral standing pose, no ground shadow, no text, no border.

## The styles

### Style A — "Attic Black-Figure Neon"
Greek black-figure pottery, but divine power renders as electric neon.
- **Palette:** terracotta `#C86A3A`, ink black `#141010`, bone `#E8DCC4`; accents cyan `#4FE3E0`, magenta `#E34FA8`
- **Line:** no outlines — solid black silhouettes with fine *incised* interior detail, as on real vases
- **Silhouette rule:** readable as pure black shape; attributes break the body outline
- **Relational VFX:** neon meander/Greek-key ribbon tethers; proc tags in incised capitals on a terracotta banner
- **Prompt:** `Ancient Greek attic black-figure vase painting of {DEITY}, solid black silhouette figure with fine incised interior linework, terracotta orange background, side profile facing right, holding {ATTRIBUTE}, glowing cyan and magenta neon energy accents, flat graphic 2D, high contrast, no outline, centered full body, transparent background`

### Style B — "Saturday Morning Olympus"
The Battle Cats lane. Deliberately goofy, chunky, minimal.
- **Palette:** sky `#8FD4E8`, peach `#F5C99B`, mint `#A8E0C0`, coral `#F58F7C`; outline `#2B2B33`
- **Line:** thick uniform black outline (~6 px at 1024), no gradients, one flat shadow tone
- **Silhouette rule:** comedy through proportion — 2-head-tall bodies, oversized heads, attribute ≥40% of the silhouette. Zeus is mostly beard.
- **Relational VFX:** bouncy dashed tethers; proc tags in a fat display face inside a wobbling speech bubble
- **Prompt:** `Cute chunky cartoon mascot of {DEITY}, thick black outline, flat pastel colors, no shading, 2-heads-tall chibi proportions, oversized head and oversized {ATTRIBUTE}, goofy expression, side view facing right, simple mobile game sprite, centered full body, transparent background`

### Style C — "Ink & Gold Woodcut"
Heavy ink, cross-hatching, mythic and severe.
- **Palette:** bone `#EDE6D6`, ink `#1A1A1E`, oxidized gold `#C9A227`, blood `#8C2F20` — four colours, no more
- **Line:** dense woodcut cross-hatching for all shading; hard chisel-edged strokes
- **Silhouette rule:** high-contrast ink masses. **Gold is reserved exclusively for relation VFX**, never costume — so gold on screen always means "the graph is firing"
- **Relational VFX:** gold filigree tethers; proc tags in engraved serif small-caps on torn parchment
- **Prompt:** `Woodcut engraving illustration of {DEITY}, heavy black ink cross-hatching, bone white background, oxidized gold and blood red accents only, severe mythic tone, side view facing right, holding {ATTRIBUTE}, hand-carved print texture, centered full body, transparent background`

### ✅ Style C-B — "Bold Woodcut (Clean)" — **CHOSEN, 2026-07-31**
Style C with the hatching density pulled back for small-size legibility — clean chisel lines,
simplified graphic shadows, same four-colour palette and same gold-means-relations rule.

**This is the production art direction.** All future roster art targets this style.

- **Palette (four colours, no more):** bone `#EDE6D6`, ink `#1A1A1E`, oxidized gold `#C9A227`,
  blood `#8C2F20`
- **Line:** hard chisel-edged strokes, minimal cross-hatching. Shadows are simplified graphic
  shapes, not hatch fields — this is what buys the 64 px legibility that Style C loses.
- **Silhouette rule:** high-contrast ink masses readable as pure shape at 64 px.
- **Gold is reserved exclusively for relational VFX**, never for costume or ornament. Gold on
  screen always means "the graph is firing." This is a systemic rule, not a style preference —
  it makes the game's core mechanic self-announcing, and the in-game tether colours in
  `src/sim/constants.ts` should be reconciled against it when production art lands.
- **Prompt template:** `Minimalist bold woodcut illustration of {DEITY}, clean chisel ink lines
  with minimal cross-hatching, simplified graphic shadows, bone white background, oxidized gold
  and blood red accents only, severe mythic tone, side view facing right, holding {ATTRIBUTE},
  centered full body, transparent background`

## Delivered

12 renders in `art/concepts/assets/` (`style_{a,b,c,cb}_{zeus,heracles,hoplite}.jpg`), plus an
interactive comparison page at `art/concepts/index.html` with a 64 px readability matrix, scale
toggles (64/128/256 px), and background swatches.

Viewable at http://localhost:3033/art/concepts/ while `npm run dev` is running.

## Still open

**Style C-B is chosen** (2026-07-31), so the concept-board phase is closed. What does not exist yet
is a **production-asset pipeline**: 22 units in C-B with consistent scale, transparency, naming and
a common baseline, plus a loader replacing the placeholder geometry in `src/render/draw.ts`. That is
a separate exercise and a separate brief — do not attempt it from this one.
