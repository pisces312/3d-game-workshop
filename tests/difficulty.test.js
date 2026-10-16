import { describe, it, expect } from 'vitest';
import { difficultyFor, DIFFICULTY_LIMITS } from '../src/systems/DifficultySystem.js';
import { SpawnSystem, maxShiftFor, crossingSpeedFor } from '../src/systems/SpawnSystem.js';
import {
  angleDiff,
  ballAngularHalfWidth,
  normalizeAngle,
  passesGap,
  quantizeGap,
} from '../src/systems/CollisionSystem.js';
import { Game } from '../src/core/Game.js';
import { State } from '../src/core/GameState.js';
import { CONFIG } from '../src/config.js';
import { seededRng } from './helpers.js';

const ALPHA = ballAngularHalfWidth();

describe('T10 — difficulty is monotonic and bounded (AC10)', () => {
  it('speed never decreases, gap and spacing never increase for s = 0..200', () => {
    let prev = difficultyFor(0);
    for (let s = 1; s <= 200; s++) {
      const d = difficultyFor(s);
      expect(d.speed).toBeGreaterThanOrEqual(prev.speed);
      expect(d.gapSize).toBeLessThanOrEqual(prev.gapSize);
      expect(d.spacing).toBeLessThanOrEqual(prev.spacing);
      expect(d.rotatingChance).toBeGreaterThanOrEqual(prev.rotatingChance);
      prev = d;
    }
  });

  it('stays inside its limits', () => {
    for (let s = 0; s <= 200; s++) {
      const d = difficultyFor(s);
      expect(d.speed).toBeGreaterThanOrEqual(14);
      expect(d.speed).toBeLessThanOrEqual(DIFFICULTY_LIMITS.MAX_SPEED);
      expect(d.gapSize).toBeGreaterThanOrEqual(DIFFICULTY_LIMITS.MIN_GAP);
      expect(d.gapSize).toBeLessThanOrEqual(1.7);
      expect(d.spacing).toBeGreaterThanOrEqual(DIFFICULTY_LIMITS.MIN_SPACING);
      expect(d.rotatingChance).toBeLessThanOrEqual(DIFFICULTY_LIMITS.MAX_ROTATING_CHANCE);
      expect(d.spinMax).toBeLessThanOrEqual(DIFFICULTY_LIMITS.MAX_SPIN);
      expect(d.spinMin).toBeLessThanOrEqual(d.spinMax);
    }
    expect(difficultyFor(200)).toMatchObject({ speed: 34, gapSize: 0.8, spacing: 11 });
  });

  it('the narrowest gap still exceeds the ball width by a safety margin', () => {
    expect(DIFFICULTY_LIMITS.MIN_GAP).toBeGreaterThan(2 * ALPHA + 0.5);
  });

  it('phases: no rotation below score 8, twist from score 15', () => {
    expect(difficultyFor(7).rotatingChance).toBe(0);
    expect(difficultyFor(8).rotatingChance).toBeGreaterThan(0);
    expect(difficultyFor(14).twist).toBe(false);
    expect(difficultyFor(15).twist).toBe(true);
  });

  it('treats invalid scores as 0', () => {
    expect(difficultyFor(-5)).toEqual(difficultyFor(0));
    expect(difficultyFor(Number.NaN)).toEqual(difficultyFor(0));
  });
});

describe('SpawnSystem — quantisation, reachability, rotating gaps', () => {
  it('spawned gap sizes equal their quantised value', () => {
    const spawner = new SpawnSystem();
    const rng = seededRng(11);
    for (let s = 0; s <= 40; s += 3) {
      spawner.reset();
      const d = difficultyFor(s);
      const o = spawner.spawn(-140, d, rng, s);
      expect(o.gapSize).toBe(quantizeGap(d.gapSize));
      expect(Math.abs(o.gapSize / CONFIG.GAP_QUANT - Math.round(o.gapSize / CONFIG.GAP_QUANT))).toBeLessThan(1e-9);
    }
  });

  it('consecutive fixed gap targets stay within the reachable maxShift', () => {
    const spawner = new SpawnSystem();
    const rng = seededRng(21);
    for (const s of [0, 5, 7]) {
      const d = difficultyFor(s);
      const limit = maxShiftFor(
        { ...d, gapSize: quantizeGap(d.gapSize) },
        CONFIG,
        crossingSpeedFor(-140, d, s),
      );
      spawner.reset();
      let prev = spawner.spawn(-140, d, rng, s).gapCenter;
      for (let i = 0; i < 10; i++) {
        spawner.recycle();
        if (spawner.active().length >= spawner.capacity) spawner.reset();
        const o = spawner.spawn(-140, d, rng, s);
        expect(Math.abs(angleDiff(o.gapCenter, prev))).toBeLessThanOrEqual(limit + 1e-9);
        prev = o.gapCenter;
      }
    }
  });

  it('never spawns rotating obstacles below score 8', () => {
    const spawner = new SpawnSystem();
    const always = () => 0; // would always pick "rotate" if allowed
    for (let i = 0; i < 8; i++) {
      const o = spawner.spawn(-140, difficultyFor(7), always, 7);
      expect(o.kind).toBe('fixed');
      expect(o.spin).toBe(0);
    }
  });

  it('a rotating gap is pre-rotated so it reaches its target at the plane', () => {
    const spawner = new SpawnSystem();
    const d = difficultyFor(20);
    const o = spawner.spawn(-100, d, () => 0.1, 20, { gapCenter: 1.0 });
    expect(o.kind).toBe('rotating');
    expect(Math.abs(o.spin)).toBeGreaterThanOrEqual(d.spinMin);
    expect(Math.abs(o.spin)).toBeLessThanOrEqual(d.spinMax);
    const crossSpeed = crossingSpeedFor(o.z, d, 20);
    expect(crossSpeed).toBeGreaterThanOrEqual(d.speed);
    const travelTime = (CONFIG.PLAYER_Z - o.z) / ((d.speed + crossSpeed) / 2);
    expect(angleDiff(normalizeAngle(o.gapCenter + o.spin * travelTime), 1.0)).toBeCloseTo(0, 9);
  });

  it('pool never allocates more than its capacity', () => {
    const spawner = new SpawnSystem({ capacity: 3 });
    const d = difficultyFor(0);
    expect(spawner.spawn(-10, d)).not.toBeNull();
    expect(spawner.spawn(-20, d)).not.toBeNull();
    expect(spawner.spawn(-30, d)).not.toBeNull();
    expect(spawner.spawn(-40, d)).toBeNull();
    expect(spawner.active()).toHaveLength(3);
  });
});

/** Isolate one obstacle in front of the player; push the rest far away. */
function isolate(game, { z, spin, gapCenter }) {
  const [o, ...rest] = game.obstacles;
  for (const other of rest) {
    other.z = CONFIG.SPAWN_Z;
    other.prevZ = other.z;
  }
  Object.assign(o, { z, prevZ: z, spin, gapCenter, kind: 'rotating', checked: false });
  return o;
}

describe('T10 — rotating obstacles use the same pass rule (AC10)', () => {
  it('passes when the rotated gap reaches the ball at the crossing', () => {
    const game = new Game({ rng: seededRng(3) });
    game.start();
    game.score = 20;
    const speed = difficultyFor(20).speed;
    const z = -16;
    const spin = 1.1;
    const t = (CONFIG.PLAYER_Z - z) / speed;
    const o = isolate(game, { z, spin, gapCenter: normalizeAngle(game.theta - spin * t) });
    const passes = [];
    game.on('pass', (e) => passes.push(normalizeAngle(e.obstacle.gapCenter)));
    for (let i = 0; i < 120 && !o.checked; i++) game.update(CONFIG.SIM_STEP);
    expect(game.state).toBe(State.PLAYING);
    expect(game.score).toBe(21);
    expect(passes).toHaveLength(1);
    expect(passesGap(game.theta, passes[0], o.gapSize)).toBe(true);
  });

  it('hits when the gap was aligned at spawn but rotated away by the crossing', () => {
    const game = new Game({ rng: seededRng(3) });
    game.start();
    game.score = 20;
    const o = isolate(game, { z: -20, spin: 1.2, gapCenter: game.theta });
    // A static check at spawn time would have passed:
    expect(passesGap(game.theta, o.gapCenter, o.gapSize)).toBe(true);
    let hitGap = null;
    game.on('hit', (e) => {
      hitGap = e.obstacle.gapCenter;
    });
    for (let i = 0; i < 240 && game.state === State.PLAYING; i++) game.update(CONFIG.SIM_STEP);
    expect(game.state).toBe(State.GAME_OVER);
    expect(passesGap(game.theta, hitGap, o.gapSize)).toBe(false);
    expect(Math.abs(angleDiff(hitGap, game.theta))).toBeGreaterThan(0.5);
  });
});

/** Keyboard-only autopilot: steer toward where the next gap will be at the plane. */
function botInput(game) {
  const next = game.obstacles.find((o) => !o.checked && o.z < CONFIG.PLAYER_Z);
  if (!next) return { axis: 0, dragAngle: 0 };
  const t = (CONFIG.PLAYER_Z - next.z) / game.difficulty.speed;
  const target = normalizeAngle(next.gapCenter + next.spin * t);
  const d = angleDiff(target, game.theta);
  const deadZone = CONFIG.KEY_ANGULAR_SPEED * CONFIG.SIM_STEP;
  return { axis: Math.abs(d) <= deadZone ? 0 : Math.sign(d), dragAngle: 0 };
}

describe('Playability — keyboard-only bot (FR6, FR14 reachability)', () => {
  it('reaches the twist phase with rotating gaps, then restart fully resets', () => {
    const game = new Game({ rng: seededRng(2024) });
    let twistEvents = 0;
    let sawRotating = false;
    game.on('twist', () => twistEvents++);
    game.start();
    for (let i = 0; i < 120 * 120 && game.state === State.PLAYING && game.score < 30; i++) {
      game.update(CONFIG.SIM_STEP, botInput(game));
      if (game.obstacles.some((o) => o.kind === 'rotating')) sawRotating = true;
    }
    expect(game.score).toBeGreaterThanOrEqual(30);
    expect(sawRotating).toBe(true);
    expect(game.twist).toBe(true);
    expect(twistEvents).toBe(1);

    game.pause();
    expect(game.restart()).toBe(true);
    expect(game.twist).toBe(false);
    expect(game.score).toBe(0);
    expect(game.difficulty).toEqual(difficultyFor(0));
    expect(game.obstacles.some((o) => o.kind === 'rotating')).toBe(false);
  });
});
