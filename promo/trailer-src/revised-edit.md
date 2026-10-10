# Revised landscape trailer

Approved review implemented on 2026-10-10. The original landscape and vertical videos are preserved.
Output: `promo/mythos-unbound-trailer-16x9-revised.mp4`, 26 seconds, 1920×1080, 30 fps.

| Revised time | Scene | Source |
|---|---|---|
| 0–1 | Immediate Norse battle teaser | Original Asgard footage around 16–17 seconds |
| 1–2.5 | Every god has a family, with Cronus named | Rebuilt original opening artwork |
| 2.5–5 | Cronus / Zeus, father and son | Rebuilt rivalry card with names and plain-language effects |
| 5–7 | Ares / Aphrodite, lovers | Rebuilt lovers card with names |
| 7–9 | Entranced in battle | Original Greek recording, frames 30–89 |
| 9–11 | Thor / Jörmungandr, vengeance | Rebuilt card with names and damage explanation |
| 11–13.5 | Norse battle and vengeance hit | Original Norse recording, frames 120–194 |
| 13.5–16.5 | Draft the family; select Zeus | New recording of the actual local game; selection asserted |
| 16.5–18 | Egyptian battle | Original Egyptian recording, frames 155–199 |
| 18–19.5 | Odin, Ra, Anubis | Existing portraits, half a second each |
| 19.5–21.5 | 66 legends, 3 pantheons | Existing roster artwork, rebuilt reveal |
| 21.5–26 | Mythos Unbound, play message and link | Rebuilt title; fully readable by 21.95, fade starts 25.5 |

Original unlabelled battle recordings were recovered from the previous trailer's working files
and saved as `greek.mp4`, `norse.mp4`, `egyptian.mp4` in `promo/trailer-media/`.
`draft.mp4` preserves the new family-tree capture. Keep that folder with the project when
moving or archiving the editable trailer: the videos are intentionally excluded from Git.

No AI footage was generated. Battle footage is cropped more closely and labelled with one
large explanation per scene. The original white flashes are removed; only the visible vengeance
hit and title landing have brief, reduced shakes. The score reuses the original synthesis
instruments, with cues rebuilt for this cut and loudness normalized for the export.

The drafting capture uses an isolated temporary browser, so the user's saved game draft is
unaffected. Its pointer and confirmation label are presentation overlays; selecting Zeus
invokes the game's real card action and checks that it becomes a picked card.

Fonts are bundled locally for deterministic rendering; their OFL licenses are in `fonts/`.
The reproduction command and dependencies are in the project's `NOTES.md` runbook.

Verification: all 780 frames rendered without missing assets or browser errors; the export
decodes completely without errors. Browser playback and seeking passed. Both streams are
26 seconds; audio measures −14.0 LUFS with a −1.3 dBFS true peak. Visual checks covered the
opening, all relationship cards, battle examples, drafting action, roster and end card.
The existing 198 game tests and TypeScript check pass; game code is unchanged.
