# Rig animation iteration 01

- Objective: give every roster entity a procedural rig with distinct pantheon styling and an admin evaluator.
- Implemented: 66/66 entities, four body plans, authored equipment and proportions, Greek/Norse/Egyptian palettes and biped gait profiles, casting and archery attacks.
- Evaluator: shared in-game dialog and `/rig.html`; pantheon filters, full lineup, selected-character preview, search, full-cycle/five-state playback, speed, pause, restart, scrub, step, facing and guides.
- Review fixes: mirror the serpent/beast preview anchor when facing left; preserve continuous idle/walk phase; move controls above previews for smaller windows.
- Verified: running browser renders all 66 entities across all five animations; modal opens from admin, Escape closes it and restores focus; filtering, search, slow playback, step and scrubbing work. Browser console has no errors. Build and tests pass.
- Next iteration: user evaluation of silhouette, pantheon feel and individual motion details. This pass establishes complete coverage and a convenient review surface.
