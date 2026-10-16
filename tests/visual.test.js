// Iteration 3 — visual upgrade (AC20–AC24). Runs in Node with a stub GL renderer.
import { describe, it, expect, vi } from 'vitest';
import { Renderer } from '../src/core/Renderer.js';
import { Game } from '../src/core/Game.js';
import { CONFIG, TAU } from '../src/config.js';
import { ballAngularHalfWidth, normalizeAngle } from '../src/systems/CollisionSystem.js';
import {
  BloomGovernor,
  dynamicFov,
  isPerfect,
  nextPerfectStreak,
  shouldEnableBloom,
} from '../src/systems/VisualFx.js';
import { HIGHLIGHT_TUBE, MAIN_TUBE } from '../src/entities/Obstacle.js';
import { MAX_SPEED_LINES } from '../src/entities/SpeedLines.js';
import { seededRng, stepGame } from './helpers.js';

function stubGL() {
  const calls = { render: 0 };
  return {
    calls,
    domElement: { tagName: 'CANVAS' },
    setPixelRatio() {},
    setSize() {},
    render() {
      calls.render++;
    },
    setAnimationLoop() {},
  };
}

const modTau = (a) => normalizeAngle(a);

describe('T16 — obstacle rings keep visual gap == collision gap (AC20)', () => {
  it('main and highlight rings share arc = TAU − gapSize and rotation gapCenter + gapSize/2', () => {
    const renderer = new Renderer({ glRenderer: stubGL() });
    const game = new Game({ rng: seededRng(11) });
    game.start();
    stepGame(game, 240);
    renderer.render(game, 1 / 60);
    const om = renderer.obstacleMeshes;
    expect(game.obstacles.length).toBeGreaterThan(0);
    game.obstacles.forEach((o, i) => {
      for (const mesh of [om.meshes[i], om.highlights[i]]) {
        expect(mesh.visible).toBe(true);
        expect(mesh.geometry.parameters.arc).toBeCloseTo(TAU - o.gapSize, 9);
        expect(modTau(mesh.rotation.z)).toBeCloseTo(modTau(o.gapCenter + o.gapSize / 2), 9);
      }
    });
  });

  it('thicker tube stays inside the tunnel wall; highlight is thinner', () => {
    expect(MAIN_TUBE).toBeGreaterThan(CONFIG.OBSTACLE_TUBE);
    expect(MAIN_TUBE).toBeLessThanOrEqual(0.45);
    expect(CONFIG.ORBIT_RADIUS + MAIN_TUBE).toBeLessThan(CONFIG.TUNNEL_RADIUS);
    expect(HIGHLIGHT_TUBE).toBeLessThan(MAIN_TUBE);
  });

  it('unused pooled rings (main + highlight) are hidden', () => {
    const renderer = new Renderer({ glRenderer: stubGL() });
    renderer.obstacleMeshes.sync([]);
    expect(renderer.obstacleMeshes.meshes.every((m) => !m.visible)).toBe(true);
    expect(renderer.obstacleMeshes.highlights.every((m) => !m.visible)).toBe(true);
  });
});

/** Force the next unchecked obstacle to be aligned at `offset` from θ until one pass happens. */
function passOnce(game, offset, gapSize = 1.7) {
  const start = game.score;
  for (let i = 0; i < 4000 && game.score === start && game.state === 'PLAYING'; i++) {
    for (const o of game.obstacles) {
      if (o.checked) continue;
      o.spin = 0;
      o.gapSize = gapSize;
      o.gapCenter = normalizeAngle(game.theta + offset);
    }
    game.update(CONFIG.SIM_STEP, { axis: 0, dragAngle: 0 });
  }
  return game.score - start;
}

describe('T17 — Perfect judgement and streak (AC21)', () => {
  it('boundaries: |Δ| ≤ gapSize/4 is perfect, just beyond is not', () => {
    const g = 1.6;
    expect(isPerfect(1, 1, g)).toBe(true);
    expect(isPerfect(1 + g / 4, 1, g)).toBe(true);
    expect(isPerfect(1 - g / 4, 1, g)).toBe(true);
    expect(isPerfect(1 + g / 4 + 1e-6, 1, g)).toBe(false);
  });

  it('wraps across the 0/2π seam and rejects invalid input', () => {
    expect(isPerfect(TAU - 0.02, 0.02, 0.4)).toBe(true); // Δ = 0.04 ≤ 0.1
    expect(isPerfect(TAU - 0.2, 0.02, 0.4)).toBe(false); // Δ = 0.22 > 0.1
    expect(isPerfect(Number.NaN, 0, 1)).toBe(false);
    expect(isPerfect(0, 0, 0)).toBe(false);
  });

  it('nextPerfectStreak counts up and resets', () => {
    expect(nextPerfectStreak(0, true)).toBe(1);
    expect(nextPerfectStreak(2, true)).toBe(3);
    expect(nextPerfectStreak(5, false)).toBe(0);
    expect(nextPerfectStreak(undefined, true)).toBe(1);
  });

  it('Game emits perfect + streak, resets on a non-perfect pass and on restart', () => {
    const game = new Game({ rng: seededRng(3) });
    const events = [];
    game.on('pass', (e) => events.push({ perfect: e.perfect, streak: e.perfectStreak, score: e.score }));
    game.start();
    expect(passOnce(game, 0)).toBe(1);
    expect(passOnce(game, 0.05)).toBe(1);
    // offset 0.6: passes (0.6 + α ≤ 0.85) but is not perfect (> 0.425)
    expect(0.6 + ballAngularHalfWidth()).toBeLessThanOrEqual(1.7 / 2);
    expect(passOnce(game, 0.6)).toBe(1);
    expect(events.map((e) => [e.perfect, e.streak])).toEqual([
      [true, 1],
      [true, 2],
      [false, 0],
    ]);
    expect(events.map((e) => e.score)).toEqual([1, 2, 3]); // scoring unchanged: +1 per pass
    passOnce(game, 0);
    expect(game.perfectStreak).toBe(1);
    game.pause();
    game.restart();
    expect(game.perfectStreak).toBe(0);
    expect(game.score).toBe(0);
  });
});

describe('T18 — speed-scaled FOV (AC22)', () => {
  it('is flat at start speed and monotonic with speed', () => {
    expect(dynamicFov(70, 14)).toBe(70);
    let prev = -Infinity;
    for (let s = 0; s <= 60; s += 2) {
      const f = dynamicFov(70, s);
      expect(f).toBeGreaterThanOrEqual(prev);
      prev = f;
    }
  });

  it('boost is capped at +8° and never exceeds MAX_VFOV', () => {
    expect(dynamicFov(70, 1000)).toBe(78);
    expect(dynamicFov(100, 1000)).toBe(CONFIG.MAX_VFOV_DEG);
    expect(dynamicFov(70, Number.NaN)).toBe(70);
  });

  it('Renderer applies it on top of the resize base FOV; resize only sets the base', () => {
    const renderer = new Renderer({ glRenderer: stubGL() });
    renderer.resize(812, 375, 2);
    const base = renderer.camera.fov;
    const game = new Game({ rng: seededRng(1) });
    game.start();
    game.difficulty = { ...game.difficulty, speed: 34 }; // view-only probe of a faster world
    renderer.render(game, 1 / 60);
    expect(renderer.camera.fov).toBeCloseTo(base + 8, 9);
    renderer.impact();
    renderer.render(game, 1 / 60);
    expect(renderer.camera.fov).toBeGreaterThan(base + 8);
    for (let i = 0; i < 120; i++) renderer.render(game, 1 / 60);
    expect(renderer.camera.fov).toBeCloseTo(base + 8, 1);
  });
});

describe('T19 — bloom decision and auto-disable (AC23)', () => {
  it('URL override wins, otherwise desktop on / touch off', () => {
    expect(shouldEnableBloom({ search: '?bloom=on', isTouch: true })).toBe(true);
    expect(shouldEnableBloom({ search: '?bloom=off', isTouch: false })).toBe(false);
    expect(shouldEnableBloom({ search: '', isTouch: false })).toBe(true);
    expect(shouldEnableBloom({ search: '', isTouch: true })).toBe(false);
    expect(shouldEnableBloom({ search: '?bloom=maybe&debug', isTouch: true })).toBe(false);
    expect(shouldEnableBloom()).toBe(true);
  });

  it('BloomGovernor returns disable exactly once after sustained slow frames', () => {
    const gov = new BloomGovernor({ slowMs: 20, holdS: 2 });
    const results = [];
    for (let i = 0; i < 300; i++) results.push(gov.sample(30, 0.03));
    expect(results.filter((r) => r === 'disable')).toHaveLength(1);
    expect(gov.enabled).toBe(false);
  });

  it('fast frames or brief spikes never disable', () => {
    const gov = new BloomGovernor({ slowMs: 20, holdS: 2 });
    for (let i = 0; i < 600; i++) expect(gov.sample(16, 0.016)).toBeNull();
    for (let i = 0; i < 20; i++) gov.sample(60, 0.06); // ~1.2 s spike
    for (let i = 0; i < 600; i++) gov.sample(16, 0.016);
    expect(gov.enabled).toBe(true);
    expect(gov.sample(Number.NaN, 0.016)).toBeNull();
  });

  it('Renderer never builds PostFx for an injected GL renderer', () => {
    const renderer = new Renderer({ glRenderer: stubGL(), bloom: true });
    expect(renderer.postFx).toBeNull();
    expect(renderer.bloomEnabled).toBe(false);
  });
});

describe('T20 — visuals never mutate the Game (AC24, NFR9)', () => {
  it('READY attract mode: camera orbits, mascot enlarged, world unchanged', () => {
    const renderer = new Renderer({ glRenderer: stubGL() });
    const game = new Game({ rng: seededRng(5) });
    const before = game.snapshot();
    const positions = [];
    for (let i = 0; i < 120; i++) {
      renderer.render(game, 1 / 60);
      positions.push(renderer.camera.position.x);
    }
    expect(new Set(positions.map((x) => x.toFixed(4))).size).toBeGreaterThan(10);
    expect(renderer.player.group.scale.x).toBeGreaterThan(1.4);
    expect(renderer.speedLines.lines.visible).toBe(false);
    expect(game.snapshot()).toEqual(before);
  });

  it('PLAYING with FOV kick, shake and shatter: world unchanged, mascot back to scale 1', () => {
    const renderer = new Renderer({ glRenderer: stubGL() });
    const game = new Game({ rng: seededRng(6) });
    game.start();
    stepGame(game, 120);
    for (let i = 0; i < 90; i++) renderer.render(game, 1 / 60);
    const before = game.snapshot();
    renderer.impact();
    renderer.shake();
    renderer.shatter(0, -3, 0);
    for (let i = 0; i < 30; i++) renderer.render(game, 1 / 60);
    expect(game.snapshot()).toEqual(before);
    expect(renderer.player.group.scale.x).toBeCloseTo(1, 6);
    expect(renderer.speedLines.lines.visible).toBe(true);
    expect(renderer.speedLines.active).toBeLessThanOrEqual(MAX_SPEED_LINES);
    expect(renderer.particles.capacity).toBe(CONFIG.MAX_PARTICLES);
  });

  it('bloom auto-disable (via an injected PostFx) happens once and leaves the world untouched', () => {
    const gl = stubGL();
    const renderer = new Renderer({ glRenderer: gl });
    const fake = {
      enabled: true,
      renders: 0,
      disables: 0,
      render() {
        this.renders++;
      },
      resize() {},
      disable() {
        this.disables++;
        this.enabled = false;
      },
    };
    renderer.postFx = fake;
    const game = new Game({ rng: seededRng(7) });
    const before = game.snapshot();
    expect(renderer.bloomEnabled).toBe(true);
    for (let i = 0; i < 200; i++) renderer.render(game, 0.03);
    expect(fake.disables).toBe(1);
    expect(renderer.bloomEnabled).toBe(false);
    expect(fake.renders).toBeGreaterThan(0);
    expect(gl.calls.render).toBeGreaterThan(0); // falls back to the plain renderer
    expect(game.snapshot()).toEqual(before);
  });
});

describe('Hit shatter particles', () => {
  it('caps the burst at 40 and reuses the 80-particle pool', () => {
    const renderer = new Renderer({ glRenderer: stubGL() });
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    renderer.shatter(0, 0, 0);
    renderer.shatter(0, 0, 0);
    renderer.shatter(0, 0, 0);
    spy.mockRestore();
    expect(renderer.particles._life.length).toBe(CONFIG.MAX_PARTICLES);
    expect(renderer.particles._life.filter((l) => l > 0).length).toBe(CONFIG.MAX_PARTICLES);
  });
});
