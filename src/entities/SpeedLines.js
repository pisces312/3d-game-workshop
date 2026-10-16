// Speed lines (FR26): pooled radial streaks near the tunnel wall moving toward the camera.
// One LineSegments with a fixed buffer (≤ 120 segments); per-frame updates are in place (NFR8).
import * as THREE from 'three';
import { CONFIG, TAU } from '../config.js';

export const MAX_SPEED_LINES = 120;
const NEAR = 8;
const FAR = -120;

export class SpeedLines {
  constructor(config = CONFIG, count = MAX_SPEED_LINES, rng = Math.random) {
    this.count = Math.min(MAX_SPEED_LINES, Math.max(0, count | 0));
    this._rng = rng;
    this._ang = new Float32Array(this.count);
    this._rad = new Float32Array(this.count);
    this._z = new Float32Array(this.count);
    this._pos = new Float32Array(this.count * 6);
    const col = new Float32Array(this.count * 6);
    for (let i = 0; i < this.count; i++) {
      this._ang[i] = rng() * TAU;
      this._rad[i] = config.TUNNEL_RADIUS - 0.25 - rng() * 0.6;
      this._z[i] = FAR + rng() * (NEAR - FAR);
      // head bright, tail dark (additive -> fades out)
      col[i * 6] = 1;
      col[i * 6 + 1] = 0.85;
      col[i * 6 + 2] = 0.6;
      col[i * 6 + 3] = 0;
      col[i * 6 + 4] = 0;
      col[i * 6 + 5] = 0;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this._pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setDrawRange(0, 0);
    this.material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.lines = new THREE.LineSegments(geo, this.material);
    this.lines.frustumCulled = false;
    this.lines.visible = false;
    this.active = 0;
  }

  /**
   * @param {number} dt frame delta (s)
   * @param {number} speed world speed (units/s)
   * @param {boolean} visible hidden in menus
   */
  update(dt, speed, visible) {
    this.lines.visible = Boolean(visible);
    if (!visible || !(dt > 0)) return;
    const k = Math.min(1, Math.max(0, (speed - 12) / 22)); // 0 at start speed, 1 at max
    const n = Math.round(this.count * (0.35 + 0.65 * k));
    const len = 1.5 + 6 * k;
    const vz = speed * 1.6;
    const p = this._pos;
    for (let i = 0; i < n; i++) {
      let z = this._z[i] + vz * dt;
      if (z > NEAR) {
        z = FAR + this._rng() * 20;
        this._ang[i] = this._rng() * TAU;
      }
      this._z[i] = z;
      const c = Math.cos(this._ang[i]) * this._rad[i];
      const s = Math.sin(this._ang[i]) * this._rad[i];
      const o = i * 6;
      p[o] = c;
      p[o + 1] = s;
      p[o + 2] = z;
      p[o + 3] = c;
      p[o + 4] = s;
      p[o + 5] = z - len;
    }
    this.active = n;
    this.lines.geometry.setDrawRange(0, n * 2);
    this.lines.geometry.attributes.position.needsUpdate = true;
  }
}
