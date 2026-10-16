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
import { SpeedLines } from '../entities/SpeedLines.js';
import { PALETTE } from '../theme.js';
import { BloomGovernor, dynamicFov } from '../systems/VisualFx.js';
import { PostFx } from './PostFx.js';

const PERF_WINDOW = 120;
const SLOW_HOLD_S = 2;
const SHAKE_S = 0.35;
const KICK_DEG = 3;
const KICK_DECAY = 1 / 0.25; // ~0.25 s
const ATTRACT_SCALE = 1.6;

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
  constructor({ container = null, glRenderer = null, config = CONFIG, bloom = false } = {}) {
    this.config = config;
    const injected = Boolean(glRenderer);
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
    this.speedLines = new SpeedLines(config);
    this.scene.add(
      this.tunnel.group,
      this.speedLines.lines,
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

    // Visual-only camera state (FR26, FR27, FR29). Never written back to the Game (NFR9).
    this._baseFov = this.camera.fov;
    this._kick = 0;
    this._nudge = 0;
    this._attract = 1;
    this._viewTime = 0;

    // Bloom (FR30): never constructed for an injected (test) GL renderer.
    this.postFx = !injected && bloom ? new PostFx(this.gl, this.scene, this.camera, { enabled: true }) : null;
    this.bloomGovernor = new BloomGovernor();
  }

  /** True while bloom post-processing is active. */
  get bloomEnabled() {
    return Boolean(this.postFx?.enabled);
  }

  /** Turn bloom off for good (auto-degrade or manual). */
  disableBloom() {
    this.postFx?.disable();
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
    this._baseFov = this.camera.fov;
    this.camera.updateProjectionMatrix();
    this.postFx?.resize(w, h, Math.min(ratio, this.dprCap));
  }

  /** Snap visual-only state (trail, particles, camera roll) after a restart. */
  resetView(game) {
    const p = game.playerPosition(this._pos);
    this.player.resetTrail(p.x, p.y);
    this.particles.clear();
    this._roll = null;
    this._shake = 0;
    this._kick = 0;
    this._nudge = 0;
  }

  /** Short pass burst at a world position. */
  burst(x, y, z, color) {
    this.particles.burst(x, y, z, color);
  }

  /** Pass impact: brief FOV kick and a small camera push (visual only). */
  impact() {
    this._kick = KICK_DEG;
    this._nudge = 0.25;
  }

  /** Hit: strong camera shake plus a shard burst at a world position. */
  shake() {
    this._shake = SHAKE_S;
  }

  /** Hit shard burst (FR29). */
  shatter(x, y, z) {
    this.particles.shatter(x, y, z);
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

    // Bloom is the first thing dropped on slow devices (before the DPR degrade).
    if (this.postFx?.enabled && this.bloomGovernor.sample(ms, frameDt) === 'disable') this.disableBloom();
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

    // Attract mode (menus): slow time-based orbit / roll, blended out when playing.
    const a = this._attract;
    const t = this._viewTime;
    roll += a * 0.22 * Math.sin(t * 0.35);
    let px = a * 0.7 * Math.cos(t * 0.4);
    let py = a * 0.45 * Math.sin(t * 0.53);

    if (this._shake > 0) {
      const k = this._shake / SHAKE_S;
      px += (Math.random() - 0.5) * 0.6 * k;
      py += (Math.random() - 0.5) * 0.6 * k;
      roll += (Math.random() - 0.5) * 0.06 * k;
      this._shake = Math.max(0, this._shake - dt);
    }
    this.camera.rotation.set(0, 0, roll);
    this.camera.position.set(px, py, this.config.CAMERA_Z - this._nudge);

    // Speed-scaled FOV + pass kick, on top of the resize-computed base FOV.
    const fov = dynamicFov(this._baseFov, game.difficulty?.speed, { maxFov: this.config.MAX_VFOV_DEG }) + this._kick;
    if (fov !== this.camera.fov) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
    if (dt > 0) {
      const decay = Math.exp(-KICK_DECAY * dt);
      this._kick = this._kick > 0.01 ? this._kick * decay : 0;
      this._nudge = this._nudge > 0.001 ? this._nudge * decay : 0;
    }
  }

  _updateAttract(game, dt) {
    const menu = game.state === 'READY' || game.state === 'GAME_OVER';
    if (dt > 0) {
      this._viewTime += dt;
      const target = menu ? 1 : 0;
      this._attract += (target - this._attract) * (1 - Math.exp(-(menu ? 1.5 : 6) * dt));
      if (!menu && this._attract < 0.002) this._attract = 0;
    }
    const g = this.player.group;
    g.scale.setScalar(1 + (ATTRACT_SCALE - 1) * this._attract);
    g.rotation.y = this._attract * 0.5 * Math.sin(this._viewTime * 1.2);
  }

  /** Draw one frame of `game`. frameDt is the clamped real frame delta (s). */
  render(game, frameDt = 0) {
    const dt = Number.isFinite(frameDt) && frameDt > 0 ? frameDt : 0;
    this._trackPerformance(dt);

    if (game.state === 'READY') this._idleScroll += dt * 3;
    const speed = game.difficulty?.speed ?? 14;
    this.tunnel.update(game.distance + this._idleScroll, dt, game.twist, speed);
    this.player.update(game.playerPosition(this._pos), game.time + this._idleScroll, game.theta);
    this._updateAttract(game, dt);
    this.obstacleMeshes.sync(game.obstacles);
    this.speedLines.update(dt, speed, game.state === 'PLAYING');
    this.particles.update(dt);
    this._updateCamera(game, dt);
    if (this.postFx?.enabled) this.postFx.render();
    else this.gl.render(this.scene, this.camera);
  }
}
