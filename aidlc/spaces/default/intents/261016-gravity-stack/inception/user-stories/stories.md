# User Stories

## US-01 — Start a round

As a casual browser player, I want a clear start action so that I can enter the game without learning the interface first.

**Acceptance:** Start panel is visible on load; start action hides it and creates the first moving block. [FR-01]

## US-02 — Release a moving block

As a player, I want to click, tap, or press Space so that I can choose when the block falls. [FR-02, FR-03]

**Acceptance:** One release action transitions the game from moving to dropping; repeated input during the drop has no effect.

## US-03 — Build a taller tower

As a player, I want successful overlap to create a new tower layer so that I can chase a higher score. [FR-04, FR-05]

**Acceptance:** The resulting block is clipped to its overlap and the score increments by one.

## US-04 — Understand failure

As a player, I want a visible result and restart action so that a missed block does not leave me stuck. [FR-06]

**Acceptance:** Game-over panel displays current and best scores and starts a fresh round on restart.

## US-05 — Play on mobile

As a mobile player, I want the scene and HUD to fit my viewport so that touch gameplay remains usable. [NFR-01, NFR-03]

**Acceptance:** Responsive CSS adapts the panel and pointer input is accepted without page scrolling. 
