# Unit Test Instructions

No package test runner is configured for this dependency-free prototype. Run the available checks:

```bash
node --check game.js
git diff --check
python3 -m http.server 4173
curl -fsS http://localhost:4173/ | grep -m 1 '<title>'
```

Manual acceptance: start a round, release at least one block, confirm score changes after a valid landing, and intentionally miss to confirm the game-over panel.
