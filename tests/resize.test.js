import { describe, it, expect } from 'vitest';
import { Renderer } from '../src/core/Renderer.js';
import { Game } from '../src/core/Game.js';
import { computeVerticalFov, readViewportSize } from '../src/core/Viewport.js';
import { CONFIG } from '../src/config.js';
import { seededRng, stepGame } from './helpers.js';

function stubGL() {
  const calls = { setSize: [], setPixelRatio: [], render: 0, loop: null };
  return {
    calls,
    domElement: { tagName: 'CANVAS' },
    setPixelRatio(r) {
      calls.setPixelRatio.push(r);
    },
    setSize(w, h, updateStyle) {
      calls.setSize.push([w, h, updateStyle]);
    },
    render() {
      calls.render++;
    },
    setAnimationLoop(fn) {
      calls.loop = fn;
    },
  };
}

describe('T6 — resize never changes the world (AC6)', () => {
  it('portrait ↔ landscape ↔ desktop keeps the snapshot identical', () => {
    const gl = stubGL();
    const renderer = new Renderer({ glRenderer: gl, container: null });
    const game = new Game({ rng: seededRng(8) });
    game.start();
    stepGame(game, 90, CONFIG.SIM_STEP, { axis: 1, dragAngle: 0 });
    renderer.render(game, 1 / 60);
    const before = game.snapshot();

    renderer.resize(375, 812, 3);
    const portraitFov = renderer.camera.fov;
    expect(renderer.camera.aspect).toBeCloseTo(375 / 812, 12);
    renderer.render(game, 1 / 60);

    renderer.resize(812, 375, 3);
    const landscapeFov = renderer.camera.fov;
    expect(renderer.camera.aspect).toBeCloseTo(812 / 375, 12);
    renderer.render(game, 1 / 60);

    renderer.resize(1280, 720, 1);
    expect(renderer.camera.aspect).toBeCloseTo(1280 / 720, 12);
    renderer.render(game, 1 / 60);

    expect(game.snapshot()).toEqual(before);
    expect(gl.calls.setSize).toEqual([
      [375, 812, false],
      [812, 375, false],
      [1280, 720, false],
    ]);
    expect(gl.calls.setPixelRatio).toEqual([1.5, 1.5, 1]);
    expect(portraitFov).toBeGreaterThan(landscapeFov);
    expect(gl.calls.render).toBe(4);
  });

  it('portrait FOV keeps ≥ MIN_HFOV horizontally and stays within limits', () => {
    for (const aspect of [0.3, 375 / 812, 0.75, 1, 16 / 9, 3]) {
      const vfov = computeVerticalFov(aspect);
      expect(vfov).toBeGreaterThanOrEqual(CONFIG.BASE_VFOV_DEG);
      expect(vfov).toBeLessThanOrEqual(CONFIG.MAX_VFOV_DEG);
      const hfov = (2 * Math.atan(Math.tan((vfov * Math.PI) / 360) * aspect) * 180) / Math.PI;
      if (vfov < CONFIG.MAX_VFOV_DEG) expect(hfov).toBeGreaterThanOrEqual(CONFIG.MIN_HFOV_DEG - 1e-6);
    }
    expect(computeVerticalFov(16 / 9)).toBe(CONFIG.BASE_VFOV_DEG);
  });

  it('degenerate sizes never produce a zero or NaN aspect', () => {
    const renderer = new Renderer({ glRenderer: stubGL() });
    renderer.resize(0, 0, Number.NaN);
    expect(renderer.camera.aspect).toBe(1);
    expect(Number.isFinite(renderer.camera.fov)).toBe(true);
    expect(readViewportSize({ clientWidth: 0, clientHeight: 0 }, { innerWidth: 0, innerHeight: 0 })).toEqual({
      width: 1,
      height: 1,
    });
    expect(readViewportSize({ clientWidth: 390, clientHeight: 844 }, {})).toEqual({ width: 390, height: 844 });
    expect(readViewportSize(null, { innerWidth: 1024, innerHeight: 768 })).toEqual({ width: 1024, height: 768 });
  });

  it('renders each obstacle with a mesh whose arc gap matches the collision gap', () => {
    const renderer = new Renderer({ glRenderer: stubGL() });
    const game = new Game({ rng: seededRng(4) });
    renderer.render(game, 1 / 60);
    const visible = renderer.obstacleMeshes.meshes.filter((m) => m.visible);
    expect(visible).toHaveLength(game.obstacles.length);
    game.obstacles.forEach((o, i) => {
      const mesh = renderer.obstacleMeshes.meshes[i];
      expect(mesh.geometry.parameters.arc).toBeCloseTo(Math.PI * 2 - o.gapSize, 9);
      expect(mesh.rotation.z).toBeCloseTo(o.gapCenter + o.gapSize / 2, 9);
      expect(mesh.position.z).toBe(o.z);
    });
  });

  it('degrades the pixel ratio once after 2 s of slow frames', () => {
    const gl = stubGL();
    const renderer = new Renderer({ glRenderer: gl });
    const game = new Game({ rng: seededRng(4) });
    renderer.resize(800, 600, 2);
    for (let i = 0; i < 200; i++) renderer.render(game, 0.03); // 30 ms frames for 6 s
    expect(renderer.degraded).toBe(true);
    expect(renderer.dprCap).toBe(CONFIG.DPR_LOW);
    expect(gl.calls.setPixelRatio).toEqual([1.5, 1]);
    expect(game.snapshot().state).toBe('READY');
  });
});
