import { describe, it, expect } from 'vitest';
import { Game } from '../src/core/Game.js';
import { State, GameStateMachine } from '../src/core/GameState.js';
import { CONFIG } from '../src/config.js';
import { normalizeAngle } from '../src/systems/CollisionSystem.js';
import { difficultyFor } from '../src/systems/DifficultySystem.js';
import { seededRng, stepGame } from './helpers.js';

function playingGame(seed = 7) {
  const game = new Game({ rng: seededRng(seed) });
  game.start();
  return game;
}

/** Put the nearest obstacle just before the plane with its gap aligned (or not) to θ. */
function primeNearest(game, { aligned }) {
  const o = game.obstacles.find((ob) => !ob.checked);
  o.z = CONFIG.PLAYER_Z - 0.5;
  o.prevZ = o.z;
  o.spin = 0;
  o.gapCenter = aligned ? game.theta : normalizeAngle(game.theta + Math.PI);
  return o;
}

describe('Game basics', () => {
  it('starts in READY with a filled world and the ball at the initial angle', () => {
    const game = new Game({ rng: seededRng(1) });
    expect(game.state).toBe(State.READY);
    expect(game.obstacles.length).toBeGreaterThan(0);
    expect(game.obstacles[0].z).toBe(CONFIG.FIRST_OBSTACLE_Z);
    const p = game.playerPosition();
    expect(p.x).toBeCloseTo(0, 9);
    expect(p.y).toBeCloseTo(-CONFIG.ORBIT_RADIUS, 9);
    expect(p.z).toBe(CONFIG.PLAYER_Z);
  });

  it('first obstacle gap is centred on the player so the opening is fair', () => {
    const game = playingGame();
    stepGame(game, Math.ceil((-CONFIG.FIRST_OBSTACLE_Z / 14) * 120) + 2);
    expect(game.score).toBe(1);
    expect(game.state).toBe(State.PLAYING);
  });

  it('rejects a non-function rng', () => {
    expect(() => new Game({ rng: 42 })).toThrow(TypeError);
  });
});

describe('T4 — one obstacle scores exactly once (AC4)', () => {
  it('score goes to 1 and stays 1 while simulating on', () => {
    const game = playingGame();
    const o = primeNearest(game, { aligned: true });
    const passes = [];
    game.on('pass', (e) => passes.push(e.score));
    stepGame(game, 60);
    expect(game.score).toBe(1);
    expect(o.checked).toBe(true);
    stepGame(game, 60);
    expect(game.score).toBe(1);
    expect(passes).toEqual([1]);
  });

  it('a large single step still detects the crossing (no tunnelling)', () => {
    const game = playingGame();
    primeNearest(game, { aligned: true });
    game.update(0.1); // 1.4 units in one step jumps right over the plane
    expect(game.score).toBe(1);
  });
});

describe('hit → GAME_OVER', () => {
  it('a misaligned obstacle ends the run and further updates stop', () => {
    const game = playingGame();
    primeNearest(game, { aligned: false });
    const hits = [];
    game.on('hit', (e) => hits.push(e));
    stepGame(game, 60);
    expect(game.state).toBe(State.GAME_OVER);
    expect(hits).toHaveLength(1);
    const frozen = game.snapshot();
    stepGame(game, 120);
    expect(game.snapshot()).toEqual(frozen);
  });
});

describe('T5 — restart after game over fully resets (AC5)', () => {
  it('score, θ, obstacles, distance, time, difficulty and state are fresh', () => {
    const game = playingGame(99);
    // Earn some score first, move the ball, then crash.
    primeNearest(game, { aligned: true });
    stepGame(game, 60);
    game.score = 9; // pretend a longer run so difficulty is non-trivial
    stepGame(game, 30, 1 / 120, { axis: 1, dragAngle: 0 });
    primeNearest(game, { aligned: false });
    stepGame(game, 60);
    expect(game.state).toBe(State.GAME_OVER);
    expect(game.distance).toBeGreaterThan(0);

    expect(game.restart()).toBe(true);

    expect(game.state).toBe(State.PLAYING);
    expect(game.score).toBe(0);
    expect(game.theta).toBeCloseTo(normalizeAngle(CONFIG.INITIAL_THETA), 12);
    expect(game.distance).toBe(0);
    expect(game.time).toBe(0);
    expect(game.twist).toBe(false);
    expect(game.difficulty).toEqual(difficultyFor(0));
    expect(game.obstacles.length).toBeGreaterThan(0);
    expect(game.obstacles.every((o) => !o.checked)).toBe(true);
    expect(game.obstacles[0].z).toBe(CONFIG.FIRST_OBSTACLE_Z);
    expect(game.obstacles[0].id).toBe(0);
    expect(game.obstacles.every((o) => o.kind === 'fixed' && o.spin === 0)).toBe(true);
  });

  it('restart is refused from READY and PLAYING', () => {
    const game = new Game({ rng: seededRng(3) });
    expect(game.restart()).toBe(false);
    game.start();
    expect(game.restart()).toBe(false);
    expect(game.state).toBe(State.PLAYING);
  });

  it('restart from PAUSED is allowed and resets', () => {
    const game = playingGame();
    stepGame(game, 100);
    game.pause();
    expect(game.restart()).toBe(true);
    expect(game.distance).toBe(0);
    expect(game.state).toBe(State.PLAYING);
  });
});

describe('T9 — illegal transitions are rejected (AC9)', () => {
  it('state machine table rejects READY→PAUSED and GAME_OVER→PAUSED', () => {
    const sm = new GameStateMachine();
    expect(sm.transition(State.PAUSED)).toBe(false);
    expect(sm.state).toBe(State.READY);
    expect(sm.transition(State.GAME_OVER)).toBe(false);
    expect(sm.transition(State.PLAYING)).toBe(true);
    expect(sm.transition(State.GAME_OVER)).toBe(true);
    expect(sm.transition(State.PAUSED)).toBe(false);
    expect(sm.state).toBe(State.GAME_OVER);
    expect(sm.reset()).toBe(State.READY);
  });

  it('Game.pause() from READY is refused and emits nothing', () => {
    const game = new Game({ rng: seededRng(5) });
    const changes = [];
    game.on('statechange', (e) => changes.push(e));
    expect(game.pause()).toBe(false);
    expect(game.resume()).toBe(false);
    expect(game.state).toBe(State.READY);
    expect(changes).toEqual([]);
  });

  it('update() does not move the world while READY or PAUSED', () => {
    const game = new Game({ rng: seededRng(5) });
    const ready = game.snapshot();
    stepGame(game, 120);
    expect(game.snapshot()).toEqual(ready);

    game.start();
    stepGame(game, 10);
    game.pause();
    const paused = game.snapshot();
    stepGame(game, 240, 1 / 120, { axis: 1, dragAngle: 0.5 });
    expect(game.snapshot()).toEqual(paused);
    expect(game.resume()).toBe(true);
  });

  it('emits statechange with from/to for legal transitions', () => {
    const game = new Game({ rng: seededRng(5) });
    const changes = [];
    const off = game.on('statechange', (e) => changes.push(`${e.from}>${e.to}`));
    game.start();
    game.pause();
    game.resume();
    off();
    game.pause();
    expect(changes).toEqual(['READY>PLAYING', 'PLAYING>PAUSED', 'PAUSED>PLAYING']);
  });
});
