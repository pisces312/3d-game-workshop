# Requirements Analysis

## Functional requirements

### FR-01 — 3D stage

The system shall render a perspective 3D scene with a base, lighting, shadows, moving blocks, and a visible tower. [desc]

### FR-02 — Airborne movement

The system shall move the active block continuously along one horizontal axis. Consecutive blocks shall alternate between X and Z axes. [desc]

### FR-03 — Release input

The system shall release the active block when the player clicks/taps the scene or presses Space. [Q3]

### FR-04 — Drop and overlap

The system shall apply downward motion to the released block and compare its X and Z footprint with the previous block when it reaches tower height.

### FR-05 — Successful stack

If overlap on both axes is at least `0.42`, the system shall center the block on the intersection, clip its width/depth to that intersection, increment the score, and spawn the next block.

### FR-06 — Failed stack

If either axis has less than `0.42` overlap, the system shall end the round and show the result and restart action.

### FR-07 — Local best

The system shall persist and display the highest score using browser-local storage.

## Non-functional requirements

### NFR-01 — Responsive input

The page shall support pointer input on touch devices and shall prevent accidental page scroll/zoom during gameplay.

### NFR-02 — Local startup

The project shall run from a static HTTP server without a build step or package installation.

### NFR-03 — Feedback clarity

The active state, score, best score, and game-over outcome shall be visible without inspecting developer tools.

## Constraints and assumptions

- Three.js and fonts are loaded from public CDNs at runtime. [assumption]
- No backend is required for the MVP. [Q2]
