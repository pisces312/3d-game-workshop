import { defineConfig } from 'vitest/config';

// Only the game's own tests: sibling folders (three-ts-game/, 3d-game-workshop/)
// carry their own code and must not be picked up.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
