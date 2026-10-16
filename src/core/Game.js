// Pure game logic (FR2–FR8, FR12, FR14). Imports NO three and touches NO DOM,
// so the whole world can be simulated and tested in Node.
import { CONFIG } from '../config.js';
import { State, GameStateMachine } from './GameState.js';
import {
  ballAngularHalfWidth,
  crossedPlane,
  normalizeAngle,
  passesGap,
} from '../systems/CollisionSystem.js';
import { difficultyFor } from '../systems/DifficultySystem.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';
import { isPerfect, nextPerfectStreak } from '../systems/VisualFx.js';

const NO_INPUT = Object.freeze({ axis: 0, dragAngle: 0 });

function clampAxis(a) {
  if (!Number.isFinite(a)) return 0;
  return a > 1 ? 1 : a < -1 ? -1 : a;
}

export class Game {
  constructor({ rng = Math.random, config = CONFIG } = {}) {
    if (typeof rng !== 'function') throw new TypeError('Game: rng must be a function');
    this.config = config;
    this.rng = rng;
    this.halfWidth = ballAngularHalfWidth(config.BALL_RADIUS, config.ORBIT_RADIUS);
    this._sm = new GameStateMachine();
    this._spawner = new SpawnSystem({ config });
    this._listeners = new Map();
    this.reset();
  }

  // ---- read-only state -------------------------------------------------------------
  get state() {
    return this._sm.state;
  }

  /** Active obstacles (live pool objects — treat as read-only outside Game). */
  get obstacles() {
    return this._spawner.active();
  }

  // ---- events ----------------------------------------------------------------------
  /** Subscribe to 'pass' | 'hit' | 'statechange' | 'twist'. Returns an unsubscribe fn. */
  on(evt, fn) {
    if (!this._listeners.has(evt)) this._listeners.set(evt, new Set());
    this._listeners.get(evt).add(fn);
    return () => this._listeners.get(evt)?.delete(fn);
  }

  _emit(evt, payload) {
    const set = this._listeners.get(evt);
    if (!set) return;
    for (const fn of set) {
      try {
        fn(payload);
      } catch (err) {
        // A broken listener (sound, UI) must never break the simulation.
        console.error(`[Game] listener for "${evt}" failed:`, err);
      }
    }
  }

  _transition(to) {
    const from = this._sm.state;
    if (!this._sm.transition(to)) return false;
    this._emit('statechange', { from, to });
    return true;
  }

  // ---- lifecycle -------------------------------------------------------------------
  /** Reset the world (not the state machine): score, θ, obstacles, difficulty, timers. */
  reset() {
    this.score = 0;
    this.theta = normalizeAngle(this.config.INITIAL_THETA);
    this.distance = 0;
    this.time = 0;
    this.difficulty = difficultyFor(0);
    this.twist = false;
    this.perfectStreak = 0; // visual-only derived value (FR28); never affects score
    this._spawner.reset();
    this._spawner.fillInitial(this.theta, this.difficulty, this.rng);
  }

  start() {
    if (this.state !== State.READY) return false;
    return this._transition(State.PLAYING);
  }

  pause() {
    if (this.state !== State.PLAYING) return false;
    return this._transition(State.PAUSED);
  }

  resume() {
    if (this.state !== State.PAUSED) return false;
    return this._transition(State.PLAYING);
  }

  /** Fresh run from GAME_OVER or PAUSED: full world reset, then PLAYING. */
  restart() {
    if (this.state !== State.GAME_OVER && this.state !== State.PAUSED) return false;
    this.reset();
    return this._transition(State.PLAYING);
  }

  // ---- simulation ------------------------------------------------------------------
  /**
   * Advance the world by one fixed step. No-op unless PLAYING.
   * @param {number} dt seconds
   * @param {{axis:number, dragAngle:number}} input dragAngle is consumed in this step
   */
  update(dt, input = NO_INPUT) {
    if (this.state !== State.PLAYING) return;
    if (!(dt > 0) || !Number.isFinite(dt)) return;
    const cfg = this.config;
    const axis = clampAxis(input?.axis);
    const drag = Number.isFinite(input?.dragAngle) ? input.dragAngle : 0;

    this.theta = normalizeAngle(this.theta + axis * cfg.KEY_ANGULAR_SPEED * dt + drag);
    this.time += dt;
    this.difficulty = difficultyFor(this.score);
    this._updateTwist();

    const speed = this.difficulty.speed;
    for (const o of this._spawner.active()) {
      o.prevZ = o.z;
      o.speed = speed; // uniform world speed keeps spacing exact
      o.z += speed * dt;
      if (o.spin !== 0) o.gapCenter = normalizeAngle(o.gapCenter + o.spin * dt);
      if (o.checked || !crossedPlane(o.prevZ, o.z, cfg.PLAYER_Z)) continue;
      o.checked = true;
      if (passesGap(this.theta, o.gapCenter, o.gapSize, this.halfWidth)) {
        this.score += 1;
        const perfect = isPerfect(this.theta, o.gapCenter, o.gapSize);
        this.perfectStreak = nextPerfectStreak(this.perfectStreak, perfect);
        this._emit('pass', { obstacle: o, score: this.score, perfect, perfectStreak: this.perfectStreak });
      } else {
        this._transition(State.GAME_OVER);
        this._emit('hit', { obstacle: o, score: this.score });
        return;
      }
    }

    const advanced = speed * dt;
    this.distance += advanced;
    this._spawner.update(advanced, this.difficulty, this.rng, this.score);
  }

  _updateTwist() {
    if (this.difficulty.twist && !this.twist) {
      this.twist = true;
      this._emit('twist', { score: this.score });
    }
  }

  // ---- helpers ---------------------------------------------------------------------
  /** Ball centre in world space: (R cos θ, R sin θ, PLAYER_Z). */
  playerPosition(out = {}) {
    const R = this.config.ORBIT_RADIUS;
    out.x = R * Math.cos(this.theta);
    out.y = R * Math.sin(this.theta);
    out.z = this.config.PLAYER_Z;
    return out;
  }

  /** Deep, JSON-able copy of the world (used by tests and debugging). */
  snapshot() {
    return {
      state: this.state,
      score: this.score,
      theta: this.theta,
      distance: this.distance,
      time: this.time,
      twist: this.twist,
      perfectStreak: this.perfectStreak,
      difficulty: { ...this.difficulty },
      obstacles: this.obstacles.map((o) => ({
        id: o.id,
        z: o.z,
        gapCenter: o.gapCenter,
        gapSize: o.gapSize,
        speed: o.speed,
        spin: o.spin,
        checked: o.checked,
        kind: o.kind,
      })),
    };
  }
}
