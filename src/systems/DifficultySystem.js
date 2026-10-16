// Score -> difficulty parameters (FR6, FR14). Pure and bounded.
import { CONFIG } from '../config.js';

export const DIFFICULTY_LIMITS = Object.freeze({
  MAX_SPEED: 34,
  MIN_GAP: 0.8,
  MIN_SPACING: 11,
  MAX_ROTATING_CHANCE: 0.6,
  SPIN_MIN: 0.5,
  MAX_SPIN: 1.2,
});

/**
 * @param {number} score non-negative score
 * @returns {{speed:number, gapSize:number, spacing:number, rotatingChance:number,
 *            spinMin:number, spinMax:number, twist:boolean}}
 */
export function difficultyFor(score) {
  const s = Number.isFinite(score) && score > 0 ? score : 0;
  const L = DIFFICULTY_LIMITS;
  return {
    speed: Math.min(L.MAX_SPEED, 14 + 0.9 * s),
    gapSize: Math.max(L.MIN_GAP, 1.7 - 0.035 * s),
    spacing: Math.max(L.MIN_SPACING, 20 - 0.35 * s),
    rotatingChance:
      s < CONFIG.ROTATING_FROM_SCORE ? 0 : Math.min(L.MAX_ROTATING_CHANCE, 0.05 * (s - 6)),
    spinMin: L.SPIN_MIN,
    spinMax: Math.min(L.MAX_SPIN, 0.5 + 0.03 * s),
    twist: s >= CONFIG.TWIST_FROM_SCORE,
  };
}
