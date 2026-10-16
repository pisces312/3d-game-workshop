# Bolt Plan

## Bolt 1 — Playable game client

- Render stage and HUD.
- Spawn and move blocks.
- Accept release input.
- Drop, overlap, clip, score, and restart.
- Verify with syntax check and static HTTP serving.

## Definition of done

- FR-01 through FR-07 implemented.
- NFR-01 through NFR-03 reviewed.
- `node --check game.js` passes.
- `git diff --check` passes.
- `python3 -m http.server 4173` serves the page.
