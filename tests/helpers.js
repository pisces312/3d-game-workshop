// Shared test helpers (not a test file: vitest only collects *.test.js).

/** Deterministic PRNG (mulberry32) so spawned gaps are reproducible. */
export function seededRng(seed = 12345) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Run n fixed steps of the game with an optional constant input. */
export function stepGame(game, n, dt = 1 / 120, input = { axis: 0, dragAngle: 0 }) {
  for (let i = 0; i < n; i++) game.update(dt, input);
}
