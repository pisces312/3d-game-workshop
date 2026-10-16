import { describe, it, expect } from 'vitest';
import {
  normalizeAngle,
  angleDiff,
  ballAngularHalfWidth,
  passesGap,
  quantizeGap,
  crossedPlane,
} from '../src/systems/CollisionSystem.js';
import { TAU } from '../src/config.js';

const R = 3;
const r = 0.34;
const ALPHA = Math.asin(r / R);

describe('T1 — gap centre passes (AC1)', () => {
  it('ball exactly on the gap centre passes', () => {
    expect(passesGap(1.2, 1.2, 1.0, ALPHA)).toBe(true);
  });

  it('ball opposite the gap fails', () => {
    expect(passesGap(1.2 + Math.PI, 1.2, 1.0, ALPHA)).toBe(false);
  });

  it('a gap narrower than the ball can never be passed', () => {
    expect(passesGap(0, 0, 2 * ALPHA - 0.01, ALPHA)).toBe(false);
  });
});

describe('T2 — edge uses the ball angular half-width (AC2)', () => {
  const gapCenter = 0.8;
  const gapSize = 1.2;

  it('alpha = asin(r/R) by default', () => {
    expect(ballAngularHalfWidth()).toBeCloseTo(ALPHA, 12);
    expect(ballAngularHalfWidth(r, R)).toBeCloseTo(ALPHA, 12);
  });

  it('distance exactly gapSize/2 − α passes on both sides', () => {
    const d = gapSize / 2 - ALPHA;
    expect(passesGap(gapCenter + d, gapCenter, gapSize, ALPHA)).toBe(true);
    expect(passesGap(gapCenter - d, gapCenter, gapSize, ALPHA)).toBe(true);
  });

  it('distance gapSize/2 − α + 1e-3 fails although a centre-only rule would pass', () => {
    const d = gapSize / 2 - ALPHA + 1e-3;
    const centreOnly = (theta) => Math.abs(angleDiff(theta, gapCenter)) <= gapSize / 2;
    for (const theta of [gapCenter + d, gapCenter - d]) {
      expect(centreOnly(theta)).toBe(true);
      expect(passesGap(theta, gapCenter, gapSize, ALPHA)).toBe(false);
    }
  });

  it('rejects a non-positive orbit radius', () => {
    expect(() => ballAngularHalfWidth(0.3, 0)).toThrow(RangeError);
  });
});

describe('T3 — wrap across 0/2π, negative and >2π angles (AC3)', () => {
  it('gapCenter 0.05 vs θ = 2π − 0.05 has a 0.1 difference and passes', () => {
    expect(Math.abs(angleDiff(TAU - 0.05, 0.05))).toBeCloseTo(0.1, 12);
    expect(passesGap(TAU - 0.05, 0.05, 1.0, ALPHA)).toBe(true);
  });

  it('negative angle −0.05 behaves the same', () => {
    expect(angleDiff(-0.05, 0.05)).toBeCloseTo(-0.1, 12);
    expect(passesGap(-0.05, 0.05, 1.0, ALPHA)).toBe(true);
  });

  it('angle beyond 2π (4π + 0.05) behaves the same', () => {
    expect(angleDiff(4 * Math.PI + 0.05, 0.05)).toBeCloseTo(0, 12);
    expect(passesGap(4 * Math.PI + 0.05, 0.05, 1.0, ALPHA)).toBe(true);
  });

  it('normalizeAngle lands in [0, 2π) and angleDiff in (−π, π]', () => {
    for (const a of [-10, -TAU, -0.001, 0, 1, Math.PI, TAU, TAU + 0.5, 37.3]) {
      const n = normalizeAngle(a);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(TAU);
      for (const b of [-3, 0, 2, 9]) {
        const d = angleDiff(a, b);
        expect(d).toBeGreaterThan(-Math.PI - 1e-12);
        expect(d).toBeLessThanOrEqual(Math.PI + 1e-12);
      }
    }
    expect(angleDiff(Math.PI, 0)).toBeCloseTo(Math.PI, 12);
  });
});

describe('crossedPlane and quantizeGap', () => {
  it('detects a crossing from before to at/after the plane', () => {
    expect(crossedPlane(-0.1, 0.05, 0)).toBe(true);
    expect(crossedPlane(-0.1, 0, 0)).toBe(true); // landing exactly on the plane counts
  });

  it('does not detect when both before, both after, or starting on the plane', () => {
    expect(crossedPlane(-2, -1, 0)).toBe(false);
    expect(crossedPlane(0.1, 0.3, 0)).toBe(false);
    expect(crossedPlane(0, 0.2, 0)).toBe(false); // already judged in the previous step
  });

  it('quantizes gap sizes to 0.01 rad', () => {
    expect(quantizeGap(1.234)).toBeCloseTo(1.23, 12);
    expect(quantizeGap(0.8049)).toBeCloseTo(0.8, 12);
  });
});
