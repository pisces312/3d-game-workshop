// Procedural tunnel (rings + longitudinal lines) and a starfield (FR1, FR15).
// One LineSegments for the whole tunnel; scrolling only moves the group (zero allocation).
import * as THREE from 'three';
import { CONFIG, TAU } from '../config.js';
import { PALETTE } from '../theme.js';

const RING_COUNT = 24;
const RING_SEGMENTS = 48;
const RING_SPACING = 6;
const LONG_LINES = 16;
const STAR_COUNT = 400;

const BASE_COLOR = new THREE.Color(PALETTE.tunnel);
const TWIST_COLOR = new THREE.Color(PALETTE.twist);

function buildTunnelGeometry(config) {
  const R = config.TUNNEL_RADIUS;
  const zNear = 8;
  const zFar = zNear - RING_SPACING * (RING_COUNT - 1);
  const segs = RING_COUNT * RING_SEGMENTS + LONG_LINES;
  const pos = new Float32Array(segs * 2 * 3);
  let k = 0;
  const push = (x, y, z) => {
    pos[k++] = x;
    pos[k++] = y;
    pos[k++] = z;
  };
  for (let i = 0; i < RING_COUNT; i++) {
    const z = zNear - i * RING_SPACING;
    for (let s = 0; s < RING_SEGMENTS; s++) {
      const a0 = (s / RING_SEGMENTS) * TAU;
      const a1 = ((s + 1) / RING_SEGMENTS) * TAU;
      push(R * Math.cos(a0), R * Math.sin(a0), z);
      push(R * Math.cos(a1), R * Math.sin(a1), z);
    }
  }
  for (let l = 0; l < LONG_LINES; l++) {
    const a = (l / LONG_LINES) * TAU;
    push(R * Math.cos(a), R * Math.sin(a), zNear + RING_SPACING);
    push(R * Math.cos(a), R * Math.sin(a), zFar - RING_SPACING);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return geo;
}

function buildStarGeometry(rng = Math.random) {
  const pos = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; i++) {
    const a = rng() * TAU;
    const r = 20 + rng() * 40;
    pos[i * 3] = r * Math.cos(a);
    pos[i * 3 + 1] = r * Math.sin(a);
    pos[i * 3 + 2] = 10 - rng() * 220;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return geo;
}

export class Tunnel {
  constructor(config = CONFIG) {
    this.config = config;
    this.group = new THREE.Group();

    this.material = new THREE.LineBasicMaterial({
      color: BASE_COLOR.clone(),
      transparent: true,
      opacity: 0.55,
    });
    this.lines = new THREE.LineSegments(buildTunnelGeometry(config), this.material);
    this.lines.frustumCulled = false;
    this.group.add(this.lines);

    this.starMaterial = new THREE.PointsMaterial({
      color: 0xeef4ff,
      size: 0.45,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,
      fog: false,
      depthWrite: false,
    });
    this.stars = new THREE.Points(buildStarGeometry(), this.starMaterial);
    this.stars.frustumCulled = false;
    this.group.add(this.stars);

    this._twistMix = 0;
  }

  /**
   * @param {number} scroll world distance travelled (visual only)
   * @param {number} dt frame delta (s)
   * @param {boolean} twist whether the space-twist phase is active
   */
  update(scroll, dt, twist) {
    this.lines.position.z = scroll % RING_SPACING;
    this.stars.rotation.z += dt * 0.03;
    const target = twist ? 1 : 0;
    this._twistMix += (target - this._twistMix) * (1 - Math.exp(-2.5 * dt));
    this.material.color.copy(BASE_COLOR).lerp(TWIST_COLOR, this._twistMix);
  }
}
