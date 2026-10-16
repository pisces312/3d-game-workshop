# Components

```yaml
components:
  - id: game-client
    kind: ui
    responsibilities:
      - compose HTML HUD and game canvas
      - own Three.js scene, camera, lights, and visual materials
      - run ready/playing/dropping/over state machine
      - calculate footprint overlap and persist best score
    depends_on:
      - three@0.166.1
    owned_entities:
      - ActiveBlock
      - StackBlock
      - GameSession
```

## Component summary

| Component | Behaviour | Dependencies |
|---|---|---|
| Page shell | HUD, panels, controls, accessibility labels | Browser DOM |
| Scene renderer | Camera, lights, shadows, geometry, stars | Three.js |
| Game controller | State transitions, input, spawning, scoring | DOM + scene renderer |
| Block model | Position, footprint, overlap clipping | Three.js groups |
| Local record | Read/write best score | `localStorage` |

## Rationale

A single UI unit is sufficient for this MVP because there is no backend, public API, or independent deployable service. [D-003]
