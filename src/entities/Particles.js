// Pass-burst particles (FR15): one Points object, fixed capacity, ring buffer.
// Purely visual — driven by the render frame delta, never by the simulation.
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { PALETTE } from '../theme.js';

const LIFE = 0.5;

export class Particles {
  constructor(capacity = CONFIG.MAX_PARTICLES) {
    this.capacity = capacity;
    this._pos = new Float32Array(capacity * 3);
    this._col = new Float32Array(capacity * 3);
    this._vel = new Float32Array(capacity * 3);
    this._base = new Float32Array(capacity * 3);
    this._life = new Float32Array(capacity);
    this._next = 0;
    this._alive = 0;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this._pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this._col, 3));
    this.points = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        size: 0.22,
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.points.frustumCulled = false;
    this._tmp = new THREE.Color();
  }

  burst(x, y, z, color = PALETTE.orange, count = 20) {
    const c = this._tmp.set(color);
    const n = Math.min(count, this.capacity);
    for (let k = 0; k < n; k++) {
      const i = this._next;
      this._next = (this._next + 1) % this.capacity;
      const a = Math.random() * Math.PI * 2;
      const s = 2 + Math.random() * 4;
      this._pos[i * 3] = x;
      this._pos[i * 3 + 1] = y;
      this._pos[i * 3 + 2] = z;
      this._vel[i * 3] = Math.cos(a) * s;
      this._vel[i * 3 + 1] = Math.sin(a) * s;
      this._vel[i * 3 + 2] = 2 + Math.random() * 4;
      this._base[i * 3] = c.r;
      this._base[i * 3 + 1] = c.g;
      this._base[i * 3 + 2] = c.b;
      this._life[i] = LIFE;
    }
    this._alive = this.capacity;
  }

  /** Hit "shatter" (FR29): ≤ 40 fast orange/white shards flying outward in 3D. */
  shatter(x, y, z, count = 40) {
    const n = Math.min(count, 40, this.capacity);
    const orange = this._tmp.set(PALETTE.orange);
    const or = orange.r;
    const og = orange.g;
    const ob = orange.b;
    for (let k = 0; k < n; k++) {
      const i = this._next;
      this._next = (this._next + 1) % this.capacity;
      const a = Math.random() * Math.PI * 2;
      const b = Math.acos(2 * Math.random() - 1);
      const s = 6 + Math.random() * 8;
      this._pos[i * 3] = x;
      this._pos[i * 3 + 1] = y;
      this._pos[i * 3 + 2] = z;
      this._vel[i * 3] = Math.sin(b) * Math.cos(a) * s;
      this._vel[i * 3 + 1] = Math.sin(b) * Math.sin(a) * s;
      this._vel[i * 3 + 2] = Math.cos(b) * s;
      const white = k % 3 === 0;
      this._base[i * 3] = white ? 1 : or;
      this._base[i * 3 + 1] = white ? 1 : og;
      this._base[i * 3 + 2] = white ? 1 : ob;
      this._life[i] = LIFE;
    }
    this._alive = this.capacity;
  }

  update(dt) {
    if (this._alive === 0) return;
    let alive = 0;
    for (let i = 0; i < this.capacity; i++) {
      if (this._life[i] <= 0) continue;
      this._life[i] = Math.max(0, this._life[i] - dt);
      const f = this._life[i] / LIFE;
      for (let a = 0; a < 3; a++) {
        this._pos[i * 3 + a] += this._vel[i * 3 + a] * dt;
        this._col[i * 3 + a] = this._base[i * 3 + a] * f;
      }
      if (this._life[i] > 0) alive++;
    }
    this._alive = alive;
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
  }

  clear() {
    this._life.fill(0);
    this._col.fill(0);
    this._alive = 0;
    this.points.geometry.attributes.color.needsUpdate = true;
  }
}
