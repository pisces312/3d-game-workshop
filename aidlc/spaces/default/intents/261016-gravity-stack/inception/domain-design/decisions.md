# Architecture Decisions

## ADR-001 — Browser WebGL

- **Decision:** Use a native browser page with Three.js.
- **Context:** The repository has no engine scaffold or dependency manifest.
- **Consequence:** Fast local preview and broad reach; runtime CDN access is required.

## ADR-002 — Deterministic overlap instead of physics engine

- **Decision:** Resolve each landing by interval intersection on X/Z.
- **Context:** The challenge needs predictable timing and visible clipping, not rigid-body simulation.
- **Consequence:** Small implementation and deterministic scoring; no realistic tumbling physics.

## ADR-003 — Local score persistence

- **Decision:** Store only the best score in `localStorage`.
- **Context:** MVP has no identity or backend.
- **Consequence:** Score survives browser refresh on one device only.
