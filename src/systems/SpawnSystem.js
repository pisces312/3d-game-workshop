// Obstacle generation and recycling with a fixed-size object pool (FR3, FR14).
// No per-frame allocation: obstacles are plain objects reused from the pool.
import { CONFIG } from '../config.js';
import { ballAngularHalfWidth, normalizeAngle, quantizeGap } from './CollisionSystem.js';
import { difficultyFor } from './DifficultySystem.js';

function createSlot(slot) {
  return {
    id: -1,
    slot,
    active: false,
    z: 0,
    prevZ: 0,
    gapCenter: 0,
    gapSize: 0,
    speed: 0,
    spin: 0,
    checked: false,
    kind: 'fixed',
  };
}

function uniform(rng, min, max) {
  return min + (max - min) * rng();
}

/**
 * Largest angular offset between two consecutive gap targets that a player using only
 * the keyboard can still cover: 80 % of the key travel during the gap-to-gap time, plus
 * the slack the gap itself gives around the ball.
 */
export function maxShiftFor(difficulty, config = CONFIG, crossSpeed = difficulty.speed) {
  const halfWidth = ballAngularHalfWidth(config.BALL_RADIUS, config.ORBIT_RADIUS);
  const speed = Math.max(difficulty.speed, crossSpeed);
  const travel = 0.8 * config.KEY_ANGULAR_SPEED * (difficulty.spacing / speed);
  return Math.min(Math.PI, travel + Math.max(0, difficulty.gapSize / 2 - halfWidth));
}

/**
 * Pessimistic world speed when an obstacle spawned at z reaches the plane: every obstacle
 * already ahead of it may add a point (and speed) first.
 */
export function crossingSpeedFor(z, difficulty, score, config = CONFIG) {
  const ahead = Math.max(0, Math.ceil((config.PLAYER_Z - z) / difficulty.spacing));
  return Math.max(difficulty.speed, difficultyFor(score + ahead).speed);
}

export class SpawnSystem {
  constructor({ config = CONFIG, capacity = config.MAX_OBSTACLES } = {}) {
    this.config = config;
    this.capacity = capacity;
    this.pool = Array.from({ length: capacity }, (_, i) => createSlot(i));
    this.list = []; // active obstacles, ordered oldest (nearest) first
    this.reset();
  }

  /** Deactivate everything and reset the gap chain and spawn distance counter. */
  reset() {
    for (const o of this.pool) {
      o.active = false;
      o.checked = false;
    }
    this.list.length = 0;
    this._nextId = 0;
    this._lastTarget = this.config.INITIAL_THETA;
    this._sinceSpawn = 0;
  }

  /** Read-only view of the active obstacles. */
  active() {
    return this.list;
  }

  _acquire() {
    for (const o of this.pool) {
      if (!o.active) return o;
    }
    return null; // pool exhausted: skip this spawn rather than allocate
  }

  /**
   * Spawn one obstacle at depth z. The gap target chains from the previous one and
   * stays within the reachable shift. Returns the obstacle or null if the pool is full.
   */
  spawn(z, difficulty, rng = Math.random, score = 0, options = {}) {
    const o = this._acquire();
    if (!o) return null;
    const cfg = this.config;
    const gapSize = quantizeGap(options.gapSize ?? difficulty.gapSize, cfg.GAP_QUANT);
    const crossSpeed = crossingSpeedFor(z, difficulty, score, cfg);
    let target;
    if (options.gapCenter !== undefined) {
      target = options.gapCenter;
    } else {
      const shift = maxShiftFor({ ...difficulty, gapSize }, cfg, crossSpeed);
      target = this._lastTarget + uniform(rng, -shift, shift);
    }
    target = normalizeAngle(target);
    this._lastTarget = target;

    o.id = this._nextId++;
    o.active = true;
    o.z = z;
    o.prevZ = z;
    o.gapSize = gapSize;
    o.speed = difficulty.speed;
    o.checked = false;
    o.spin = 0;
    o.kind = 'fixed';
    o.gapCenter = target;
    this._applyRotation(o, target, difficulty, rng, score, crossSpeed);
    this.list.push(o);
    return o;
  }

  /**
   * With probability difficulty.rotatingChance the obstacle spins. Its initial gapCenter is
   * pre-rotated backwards by spin * travelTime so that the gap sits (approximately) on the
   * reachable target when it reaches the judgement plane. travelTime uses the mean of the
   * spawn speed and the estimated crossing speed. Rotation only changes gapCenter; the pass
   * rule is the same passesGap() used for fixed gaps.
   */
  _applyRotation(o, target, difficulty, rng, score, crossSpeed = difficulty.speed) {
    if (score < this.config.ROTATING_FROM_SCORE) return;
    if (!(difficulty.rotatingChance > 0) || rng() >= difficulty.rotatingChance) return;
    const sign = rng() < 0.5 ? -1 : 1;
    const spin = sign * uniform(rng, difficulty.spinMin, difficulty.spinMax);
    const meanSpeed = (difficulty.speed + crossSpeed) / 2;
    const travelTime = Math.max(0, (this.config.PLAYER_Z - o.z) / meanSpeed);
    o.kind = 'rotating';
    o.spin = spin;
    o.gapCenter = normalizeAngle(target - spin * travelTime);
  }

  /**
   * Populate a fresh run: the first obstacle sits at FIRST_OBSTACLE_Z with its gap on the
   * player and the widest gap, then the tunnel is filled back toward SPAWN_Z.
   */
  fillInitial(theta, difficulty, rng = Math.random) {
    const cfg = this.config;
    const widest = difficultyFor(0).gapSize;
    this._lastTarget = normalizeAngle(theta);
    let z = cfg.FIRST_OBSTACLE_Z;
    let lastZ = z;
    this.spawn(z, difficulty, rng, 0, { gapCenter: theta, gapSize: Math.max(widest, difficulty.gapSize) });
    z -= difficulty.spacing;
    while (z >= cfg.SPAWN_Z) {
      if (!this.spawn(z, difficulty, rng, 0)) break;
      lastZ = z;
      z -= difficulty.spacing;
    }
    // Next spawn happens once the last obstacle has moved `spacing` past SPAWN_Z.
    this._sinceSpawn = Math.max(0, lastZ - cfg.SPAWN_Z);
  }

  /** Advance the spawn distance counter; spawns at SPAWN_Z keeping exact spacing. */
  update(distanceAdvanced, difficulty, rng = Math.random, score = 0) {
    this._sinceSpawn += distanceAdvanced;
    let guard = this.capacity;
    while (this._sinceSpawn >= difficulty.spacing && guard-- > 0) {
      this._sinceSpawn -= difficulty.spacing;
      this.spawn(this.config.SPAWN_Z + this._sinceSpawn, difficulty, rng, score);
    }
    this.recycle();
  }

  /** Return obstacles past DESPAWN_Z to the pool (in-place compaction, no allocation). */
  recycle() {
    const limit = this.config.DESPAWN_Z;
    let w = 0;
    for (let r = 0; r < this.list.length; r++) {
      const o = this.list[r];
      if (o.z > limit) {
        o.active = false;
      } else {
        this.list[w++] = o;
      }
    }
    this.list.length = w;
  }
}
