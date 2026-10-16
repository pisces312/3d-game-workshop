# Initiative Brief

## Product intent

Create a short-session 3D timing game in which players build a tower by releasing moving blocks. [desc]

## Approved MVP boundary

The MVP is a single browser page with local scoring and no server-side account or deployment requirement. [Q2]

## Delivery slice

One UI unit, `game-client`, containing the page shell, visual styling, Three.js scene, gameplay state machine, overlap algorithm, score persistence, and local verification instructions.

## Handoff criteria

- Requirements are numbered and traceable.
- The interaction flow is defined for ready, active, dropping, and game-over states.
- The implementation already exists on branch `gravity-stack` and is checked by local syntax/static-server validation.
