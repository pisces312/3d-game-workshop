// Three.js view of the game (FR1, FR11, FR15, NFR1).
// Reads the Game, never mutates it. resize() only touches renderer + camera (ADR-2).
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { angleDiff } from '../systems/CollisionSystem.js';
import { computeVerticalFov } from './Viewport.js';
import { Tunnel } from '../entities/Tunnel.js';
import { Player } from '../entities/Player.js';
import { ObstacleMeshes } from '../entities/Obstacle.js';
import { Particles } from '../entities/Particles.js';
import { PALETTE } from '../theme.js';

const PERF_WINDOW = 120;
const SLOW_HOLD_S = 2;

function createWebGLRenderer(container) {
  const gl = new THREE.WebGLRenderer({
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
  });
  if (container) container.appendChild(gl.domElement);
  return gl;
}

export class Renderer {
  constructor({ container = null, glRenderer = null, config = CONFIG } = {}) {
    this.config = config;
    this.gl = glRenderer ?? createWebGLRenderer(container);
    this.dprCap = config.DPR_CAP;
    this.degraded = false;
    this._size = { width: 1, height: 1, dpr: 1 };

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(PALETTE.bg);
    this.scene.fog = new THREE.FogExp2(PALETTE.bg, 0.012);

    this.camera = new THREE.PerspectiveCamera(config.BASE_VFOV_DEG, 1, 0.1, 400);
    this.camera.position.set(0, 0, config.CAMERA_Z);

    this.tunnel = new Tunnel(config);
    this.player = new Player(config);
    this.obstacleMeshes = new ObstacleMeshes(config);
    this.particles = new Particles(config.MAX_PARTICLES);
    this.scene.add(
      this.tunnel.group,
      this.obstacleMeshes.group,
      this.player.group,
      this.player.trail,
      this.particles.points,
    );

    this._roll = null;
    this._idleScroll = 0;
    this._shake = 0;
    this._pos = { x: 0, y: 0, z: 0 };
    this._frameMs = new Float32Array(PERF_WINDOW);
    this._frameIdx = 0;
    this._frameCount = 0;
    this._frameSum = 0;
    this._slowFor = 0;
  }

  get domElement() {
    return this.gl.domElement;
  }

  setAnimationLoop(fn) {
    this.gl.setAnimationLoop(fn);
  }

  /** Apply a new viewport size. Touches ONLY the GL renderer and the camera. */
  resize(width, height, dpr = globalThis.devicePixelRatio || 1) {
    const w = Math.max(1, Math.round(width) || 1);
    const h = Math.max(1, Math.round(height) || 1);
    const ratio = Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
    this._size = { width: w, height: h, dpr: ratio };
    this.gl.setPixelRatio(Math.min(ratio, this.dprCap));
    this.gl.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = computeVerticalFov(this.camera.aspect, this.config);
    this.camera.updateProjectionMatrix();
  }

  /** Snap visual-only state (trail, particles, camera roll) after a restart. */
  resetView(game) {
    const p = game.playerPosition(this._pos);
    this.player.resetTrail(p.x, p.y);
    this.particles.clear();
    this._roll = null;
    this._shake = 0;
  }

  /** Short pass burst at a world position. */
  burst(x, y, z, color) {
    this.particles.burst(x, y, z, color);
  }

  /** Camera shake on hit. */
  shake() {
    this._shake = 0.35;
  }

  /** Average real frame time (ms) over the rolling window; 0 before any frame. */
  get averageFrameMs() {
    return this._frameCount ? this._frameSum / this._frameCount : 0;
  }

  _trackPerformance(frameDt) {
    if (!(frameDt > 0)) return;
    const ms = frameDt * 1000;
    if (this._frameCount === PERF_WINDOW) this._frameSum -= this._frameMs[this._frameIdx];
    else this._frameCount++;
    this._frameMs[this._frameIdx] = ms;
    this._frameSum += ms;
    this._frameIdx = (this._frameIdx + 1) % PERF_WINDOW;

    if (this.degraded || this._frameCount < 30) return;
    if (this.averageFrameMs > this.config.SLOW_FRAME_MS) this._slowFor += frameDt;
    else this._slowFor = 0;
    if (this._slowFor >= SLOW_HOLD_S && this.dprCap > this.config.DPR_LOW) {
      this.dprCap = this.config.DPR_LOW;
      this.degraded = true; // only once
      this.resize(this._size.width, this._size.height, this._size.dpr);
    }
  }

  _updateCamera(game, dt) {
    const target = game.theta + Math.PI / 2; // ADR-1: ball always at the bottom
    if (this._roll === null || !(dt > 0)) {
      if (this._roll === null) this._roll = target;
    } else {
      this._roll += angleDiff(target, this._roll) * (1 - Math.exp(-14 * dt));
    }
    let roll = this._roll;
    if (game.twist) roll += 0.12 * Math.sin(game.time * 1.3);
    this.camera.rotation.set(0, 0, roll);

    let sx = 0;
    let sy = 0;
    if (this._shake > 0) {
      const k = this._shake / 0.35;
      sx = (Math.random() - 0.5) * 0.3 * k;
      sy = (Math.random() - 0.5) * 0.3 * k;
      this._shake = Math.max(0, this._shake - dt);
    }
    this.camera.position.set(sx, sy, this.config.CAMERA_Z);
  }

  /** Draw one frame of `game`. frameDt is the clamped real frame delta (s). */
  render(game, frameDt = 0) {
    const dt = Number.isFinite(frameDt) && frameDt > 0 ? frameDt : 0;
    this._trackPerformance(dt);

    if (game.state === 'READY') this._idleScroll += dt * 3;
    this.tunnel.update(game.distance + this._idleScroll, dt, game.twist);
    this.player.update(game.playerPosition(this._pos), game.time + this._idleScroll, game.theta);
    this.obstacleMeshes.sync(game.obstacles);
    this.particles.update(dt);
    this._updateCamera(game, dt);
    this.gl.render(this.scene, this.camera);
  }
}
