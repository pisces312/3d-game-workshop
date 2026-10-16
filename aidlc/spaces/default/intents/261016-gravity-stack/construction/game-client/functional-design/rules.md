# Gameplay Rules

1. The first block targets `blockHeight / 2`.
2. Each later block targets the previous block center plus `blockHeight`.
3. X and Z movement axes alternate by stack index.
4. A landing succeeds only when both footprint intersections are at least `0.42` units.
5. On success, the block center becomes the intersection center and its footprint is clipped.
6. On failure, the round transitions to `over` and no next block is spawned.
7. Input is ignored while a block is dropping.
