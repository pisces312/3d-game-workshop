// Pure helpers for the visual upgrade (FR26, FR28, FR30). No three, no DOM.
// Nothing here feeds back into collision, scoring or difficulty (NFR9).
import { CONFIG } from '../config.js';
import { angleDiff } from './CollisionSystem.js';

/** A "perfect" pass: the ball centre is within a quarter of the gap width of the gap centre. */
export function isPerfect(theta, gapCenter, gapSize) {
  if (![theta, gapCenter, gapSize].every(Number.isFinite) || gapSize <= 0) return false;
  return Math.abs(angleDiff(theta, gapCenter)) <= gapSize / 4 + 1e-9;
}

/** Consecutive perfect passes: +1 on perfect, back to 0 otherwise. */
export function nextPerfectStreak(prev, perfect) {
  const p = Number.isInteger(prev) && prev > 0 ? prev : 0;
  return perfect ? p + 1 : 0;
}

/** Speed-scaled vertical FOV (degrees), capped by maxBoost and maxFov. */
export function dynamicFov(
  baseFov,
  speed,
  { minSpeed = 14, maxBoost = 8, k = 0.4, maxFov = CONFIG.MAX_VFOV_DEG } = {},
) {
  const base = Number.isFinite(baseFov) ? baseFov : CONFIG.BASE_VFOV_DEG;
  const s = Number.isFinite(speed) ? speed : minSpeed;
  const boost = Math.min(maxBoost, Math.max(0, k * (s - minSpeed)));
  return Math.min(maxFov, base + boost);
}

/** Bloom default: URL override wins, otherwise desktop on / touch devices off. */
export function shouldEnableBloom({ search = '', isTouch = false } = {}) {
  let v = null;
  try {
    v = new URLSearchParams(search || '').get('bloom');
  } catch {
    v = null;
  }
  if (v === 'on') return true;
  if (v === 'off') return false;
  return !isTouch;
}

/** Turns bloom off once when the average frame time stays above slowMs for holdS seconds. */
export class BloomGovernor {
  constructor({ slowMs = 20, holdS = 2, window = 60 } = {}) {
    this.slowMs = slowMs;
    this.holdS = holdS;
    this._buf = new Float32Array(window);
    this._idx = 0;
    this._count = 0;
    this._sum = 0;
    this._slowFor = 0;
    this._enabled = true;
  }

  get enabled() {
    return this._enabled;
  }

  /** @returns {'disable'|null} 'disable' exactly once. */
  sample(frameMs, dt) {
    if (!this._enabled || !(frameMs > 0) || !(dt > 0)) return null;
    const n = this._buf.length;
    if (this._count === n) this._sum -= this._buf[this._idx];
    else this._count++;
    this._buf[this._idx] = frameMs;
    this._sum += frameMs;
    this._idx = (this._idx + 1) % n;
    const avg = this._sum / this._count;
    this._slowFor = avg > this.slowMs ? this._slowFor + dt : 0;
    if (this._slowFor >= this.holdS) {
      this._enabled = false;
      return 'disable';
    }
    return null;
  }
}
