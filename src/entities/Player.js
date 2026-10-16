// Player view: the "幽灵巫师 Boo" mascot + short fading orange trail (FR1, FR15, FR20).
// Reads positions, never game state.
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { PALETTE } from '../theme.js';
import { Mascot } from './Mascot.js';

const TRAIL_HEAD = new THREE.Color(PALETTE.orangeLight);
const TRAIL_TAIL = new THREE.Color(PALETTE.orange);
// Small z step keeps the trail near the ball's plane: a large step pushed points
// toward the camera (z=7) where perspective blew them up into a pillar.
const TRAIL_STEP_Z = 0.06;

export class Player {
  constructor(config = CONFIG) {
    this.config = config;
    this.mascot = new Mascot(config);
    this.group = this.mascot.group;

    // Trail: ring buffer of recent (x, y); point i sits i*TRAIL_STEP_Z behind the ball.
    const n = config.TRAIL_POINTS;
    this._trailXY = new Float32Array(n * 2);
    this._trailPos = new Float32Array(n * 3);
    const colors = new Float32Array(n * 3);
    const base = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const f = Math.pow(1 - i / n, 1.6);
      base.copy(TRAIL_HEAD).lerp(TRAIL_TAIL, i / Math.max(1, n - 1));
      colors[i * 3] = base.r * f;
      colors[i * 3 + 1] = base.g * f;
      colors[i * 3 + 2] = base.b * f;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this._trailPos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.trail = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        size: config.BALL_RADIUS * 0.9,
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.trail.frustumCulled = false;
    this._trailPrimed = false;
  }

  /** Snap the trail to the current position (used on reset / first frame). */
  resetTrail(x, y) {
    const n = this.config.TRAIL_POINTS;
    for (let i = 0; i < n; i++) {
      this._trailXY[i * 2] = x;
      this._trailXY[i * 2 + 1] = y;
    }
    this._trailPrimed = true;
  }

  update(pos, time, theta = Math.atan2(pos.y, pos.x)) {
    this.mascot.update(pos, theta, time);
    if (!this._trailPrimed) this.resetTrail(pos.x, pos.y);

    const n = this.config.TRAIL_POINTS;
    const xy = this._trailXY;
    for (let i = n - 1; i > 0; i--) {
      xy[i * 2] = xy[(i - 1) * 2];
      xy[i * 2 + 1] = xy[(i - 1) * 2 + 1];
    }
    xy[0] = pos.x;
    xy[1] = pos.y;
    const p = this._trailPos;
    for (let i = 0; i < n; i++) {
      p[i * 3] = xy[i * 2];
      p[i * 3 + 1] = xy[i * 2 + 1];
      p[i * 3 + 2] = pos.z + i * TRAIL_STEP_Z;
    }
    this.trail.geometry.attributes.position.needsUpdate = true;
  }
}
