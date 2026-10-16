// Pure viewport -> camera helpers (FR11). No three, no DOM side effects.
import { CONFIG } from '../config.js';

const DEG = Math.PI / 180;

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

/**
 * Vertical FOV (degrees) for an aspect ratio. Landscape keeps the base FOV; portrait
 * widens it so the horizontal FOV never drops below MIN_HFOV (the whole tunnel
 * cross-section stays visible), capped at MAX_VFOV.
 */
export function computeVerticalFov(aspect, config = CONFIG) {
  const a = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
  const halfH = (config.MIN_HFOV_DEG / 2) * DEG;
  const needed = (2 * Math.atan(Math.tan(halfH) / a)) / DEG;
  return clamp(Math.max(config.BASE_VFOV_DEG, needed), config.BASE_VFOV_DEG, config.MAX_VFOV_DEG);
}

/**
 * CSS pixel size of the game container; falls back to the window inner size.
 * Never returns 0 (a 0-size canvas would produce NaN aspect).
 */
export function readViewportSize(container, win = globalThis.window) {
  let width = container?.clientWidth || 0;
  let height = container?.clientHeight || 0;
  if (!width || !height) {
    width = win?.innerWidth || width || 1;
    height = win?.innerHeight || height || 1;
  }
  return { width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(height)) };
}
