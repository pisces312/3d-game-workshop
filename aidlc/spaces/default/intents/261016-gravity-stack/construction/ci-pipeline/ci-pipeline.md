# CI Pipeline

No CI provider is configured in the empty repository. The recommended static checks for a future pipeline are:

1. `node --check game.js`
2. `git diff --check`
3. Start a static server and request `/`
4. Run a browser smoke test when a browser runner is introduced

Production deployment is intentionally skipped by the MVP profile.
