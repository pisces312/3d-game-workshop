# External Dependency Map

| Dependency | Purpose | Version/Pin | Failure impact | Fallback |
|---|---|---|---|---|
| Three.js | WebGL scene and 3D primitives | `0.166.1` CDN URL | Game cannot initialize | Vendor or bundle in future |
| Google Fonts | Optional visual typography | CSS URL | Falls back to system fonts | Built-in system font stack |
| Browser `localStorage` | Best-score persistence | Platform API | Score resets if unavailable | Current score still works |
