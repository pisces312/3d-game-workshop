// Pure angle maths and the single gap-pass rule (FR4). No three, no DOM.
import { CONFIG, TAU } from '../config.js';

const EPSILON = 1e-9;

/** Normalise any finite angle into [0, 2π). */
export function normalizeAngle(a) {
  return ((a % TAU) + TAU) % TAU;
}

/** Signed shortest difference a − b in (−π, π]; handles the 0/2π seam. */
export function angleDiff(a, b) {
  const d = normalizeAngle(a - b);
  return d > Math.PI ? d - TAU : d;
}

/**
 * Angular half-width α of the ball seen from the tunnel axis.
 * The two tangents from the axis to a circle of radius r at distance R
 * make an angle α with the centre line where sin α = r / R.
 */
export function ballAngularHalfWidth(r = CONFIG.BALL_RADIUS, R = CONFIG.ORBIT_RADIUS) {
  if (!(R > 0)) throw new RangeError(`ORBIT_RADIUS must be positive, got ${R}`);
  return Math.asin(Math.min(1, Math.max(0, r) / R));
}

/**
 * True when the whole ball's angular interval [θ−α, θ+α] lies inside the gap
 * centred on gapCenter with total width gapSize.
 */
export function passesGap(theta, gapCenter, gapSize, halfWidth = ballAngularHalfWidth()) {
  return Math.abs(angleDiff(theta, gapCenter)) + halfWidth <= gapSize / 2 + EPSILON;
}

/** Quantise a gap size so the cached mesh geometry and the rule use one value. */
export function quantizeGap(g, quant = CONFIG.GAP_QUANT) {
  return Math.round(g / quant) * quant;
}

/** Frame-rate independent crossing test: previous step before the plane, current at/after it. */
export function crossedPlane(prevZ, z, planeZ = CONFIG.PLAYER_Z) {
  return prevZ < planeZ && z >= planeZ;
}
