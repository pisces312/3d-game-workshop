# Risk and Sequencing Rationale

| Risk | Mitigation |
|---|---|
| CDN unavailable | Keep dependency pinned and document local static-server usage; future release can vendor/build assets |
| Touch viewport behaves differently | Use pointer events, `touch-action: none`, and responsive CSS; real-device check remains open |
| Overlap feels too strict | Centralize `minimumOverlap` in `game.js` for tuning |
| No visual browser automation in this workspace | Validate syntax and HTTP delivery now; perform manual browser/device playtest next |

The single UI unit is delivered in one bolt because all gameplay behavior is tightly coupled and there are no independent integration boundaries.
