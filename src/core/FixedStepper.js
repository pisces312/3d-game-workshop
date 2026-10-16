// Fixed-timestep accumulator (NFR1, FR12).
// frame() clamps the real frame delta; consume() hands out whole simulation steps,
// never more than maxSteps per frame, so a long stall can never spiral or teleport.
import { CONFIG } from '../config.js';

export class FixedStepper {
  constructor({
    step = CONFIG.SIM_STEP,
    maxFrame = CONFIG.MAX_FRAME_DT,
    maxSteps = CONFIG.MAX_STEPS_PER_FRAME,
  } = {}) {
    if (!(step > 0)) throw new RangeError(`step must be positive, got ${step}`);
    this.step = step;
    this.maxFrame = maxFrame;
    this.maxSteps = maxSteps;
    this.reset();
  }

  /** Forget the last timestamp and any accumulated time (call on resume / visibility change). */
  reset() {
    this._last = null;
    this._acc = 0;
  }

  /**
   * Register a frame timestamp (ms, e.g. from requestAnimationFrame).
   * Returns the clamped frame delta in seconds; 0 for the first frame after reset.
   */
  frame(nowMs) {
    if (!Number.isFinite(nowMs)) return 0;
    if (this._last === null) {
      this._last = nowMs;
      return 0;
    }
    let dt = (nowMs - this._last) / 1000;
    this._last = nowMs;
    if (!(dt > 0)) dt = 0;
    if (dt > this.maxFrame) dt = this.maxFrame;
    this._acc += dt;
    return dt;
  }

  /** Number of fixed steps to simulate now; removes them from the accumulator. */
  consume() {
    let steps = Math.floor(this._acc / this.step + 1e-6);
    if (steps > this.maxSteps) {
      steps = this.maxSteps;
      this._acc = 0; // drop the excess instead of spiralling
      return steps;
    }
    this._acc = Math.max(0, this._acc - steps * this.step);
    return steps;
  }

  /** Interpolation factor of the leftover time inside the next step, in [0, 1). */
  get alpha() {
    return Math.min(1, this._acc / this.step);
  }
}
