import { describe, it, expect } from 'vitest';
import { FixedStepper } from '../src/core/FixedStepper.js';
import { Game } from '../src/core/Game.js';
import { State } from '../src/core/GameState.js';
import { CONFIG } from '../src/config.js';
import { seededRng } from './helpers.js';

/** One main-loop frame, as main.js runs it. */
function frame(stepper, game, nowMs) {
  stepper.frame(nowMs);
  const steps = stepper.consume();
  for (let i = 0; i < steps; i++) game.update(CONFIG.SIM_STEP);
  return steps;
}

describe('T8 — pause/resume after 10 s hidden gives no logic jump (AC8)', () => {
  it('first frame after resume advances at most MAX_FRAME_DT', () => {
    const stepper = new FixedStepper();
    const game = new Game({ rng: seededRng(17) });
    game.start();
    let t = 1000;
    let simulated = 0;
    for (let i = 0; i < 60; i++) {
      simulated += frame(stepper, game, t);
      t += 1000 / 60;
    }
    expect(simulated).toBeGreaterThanOrEqual(115);
    expect(simulated).toBeLessThanOrEqual(120);
    expect(game.state).toBe(State.PLAYING);

    // Page hidden: main.js pauses and resets the clock.
    game.pause();
    stepper.reset();
    const zBefore = game.obstacles.map((o) => o.z);
    t += 10_000;
    expect(frame(stepper, game, t)).toBe(0); // first frame after reset: no time
    expect(game.obstacles.map((o) => o.z)).toEqual(zBefore);

    // Player resumes; next frame is 16 ms later.
    game.resume();
    t += 16;
    frame(stepper, game, t);
    const maxAdvance = game.difficulty.speed * CONFIG.MAX_FRAME_DT;
    game.obstacles.forEach((o, i) => {
      const advanced = o.z - zBefore[i];
      expect(advanced).toBeGreaterThanOrEqual(0);
      expect(advanced).toBeLessThanOrEqual(maxAdvance + 1e-9);
    });
  });

  it('a raw 5 s gap without reset is clamped to ≤ 0.1 s / MAX_STEPS_PER_FRAME steps', () => {
    const stepper = new FixedStepper();
    expect(stepper.frame(0)).toBe(0);
    expect(stepper.frame(5000)).toBeCloseTo(CONFIG.MAX_FRAME_DT, 12);
    const steps = stepper.consume();
    expect(steps).toBeLessThanOrEqual(CONFIG.MAX_STEPS_PER_FRAME);
    expect(steps).toBeGreaterThanOrEqual(CONFIG.MAX_STEPS_PER_FRAME - 1);
    expect(stepper.consume()).toBe(0);
  });

  it('excess accumulation is dropped instead of spiralling', () => {
    const stepper = new FixedStepper({ step: 0.01, maxFrame: 1, maxSteps: 5 });
    stepper.frame(0);
    stepper.frame(500); // 0.5 s => 50 steps wanted
    expect(stepper.consume()).toBe(5);
    expect(stepper.consume()).toBe(0);
    expect(stepper.alpha).toBe(0);
  });

  it('ignores non-finite and backwards timestamps', () => {
    const stepper = new FixedStepper();
    stepper.frame(100);
    expect(stepper.frame(Number.NaN)).toBe(0);
    expect(stepper.frame(50)).toBe(0);
    expect(stepper.consume()).toBe(0);
    expect(() => new FixedStepper({ step: 0 })).toThrow(RangeError);
  });
});
