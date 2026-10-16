# Functional Specification

The game controller owns a four-state loop: `ready`, `playing`, `dropping`, and `over`. `spawnBlock()` creates a Three.js group and assigns an alternating movement axis. `dropBlock()` changes state and starts acceleration. `settleBlock()` calculates X/Z interval intersections, clips a successful block, increments score, and schedules the next spawn. `finishGame()` exposes the result panel.

The DOM HUD is the presentation boundary; the controller updates score, best score, and status text through stable element IDs. The renderer owns resize handling, shadows, camera follow, and animation.
