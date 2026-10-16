// AWS Edition tests: T12 palette scan, T13 mascot width, T14 services, T15 Regions.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { CONFIG } from '../src/config.js';
import {
  PALETTE, CSS_PALETTE, SERVICES, REGIONS, REGION_EVERY,
  serviceForScore, regionForScore, regionChanged,
} from '../src/theme.js';
import { Mascot, mascotHorizontalExtent } from '../src/entities/Mascot.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function listFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? listFiles(p) : [p];
  });
}

describe('T12 palette', () => {
  it('no source file or index.html still contains the v1 magenta / cyan', () => {
    const files = [...listFiles(join(ROOT, 'src')), join(ROOT, 'index.html')];
    expect(files.length).toBeGreaterThan(10);
    for (const f of files) {
      const text = readFileSync(f, 'utf8').toLowerCase();
      expect(text.includes('ff2bd6'), f).toBe(false);
      expect(text.includes('7ffcff'), f).toBe(false);
    }
  });

  it('primary colour is AWS orange and CSS palette mirrors it', () => {
    expect(PALETTE.orange).toBe(0xff9900);
    expect(PALETTE.ink).toBe(0x232f3e);
    expect(CSS_PALETTE.orange).toBe('#FF9900');
    expect(CSS_PALETTE.bg).toBe('#0B1320');
    expect(readFileSync(join(ROOT, 'src/styles/main.css'), 'utf8')).toMatch(/--orange:\s*#ff9900/i);
  });
});

describe('T13 mascot', () => {
  const mascot = new Mascot(CONFIG);
  mascot.group.updateMatrixWorld(true);

  it('body radius equals BALL_RADIUS', () => {
    mascot.body.geometry.computeBoundingSphere();
    expect(mascot.body.geometry.parameters.radius).toBe(CONFIG.BALL_RADIUS);
    expect(mascot.body.geometry.boundingSphere.radius).toBeCloseTo(CONFIG.BALL_RADIUS, 6) // Float32 vertex buffer;
  });

  it('every decoration stays within the collision width (|x| ≤ BALL_RADIUS)', () => {
    const box = new THREE.Box3();
    let checked = 0;
    mascot.group.traverse((obj) => {
      if (!obj.isMesh || obj === mascot.glow) return;
      box.setFromObject(obj, true);
      expect(Math.max(Math.abs(box.min.x), Math.abs(box.max.x)), obj.name).toBeLessThanOrEqual(
        CONFIG.BALL_RADIUS + 1e-6, // Float32 vertex precision
      );
      checked++;
    });
    expect(checked).toBeGreaterThanOrEqual(7); // body, 2 eyes, 2 pupils, antenna, tip
    expect(mascotHorizontalExtent()).toBeLessThanOrEqual(CONFIG.BALL_RADIUS);
  });

  it('update sets position and the camera-matching roll without throwing', () => {
    mascot.update({ x: 1, y: 2, z: 0 }, 0.5, 1.23);
    expect(mascot.group.position.toArray()).toEqual([1, 2, 0]);
    expect(mascot.group.rotation.z).toBeCloseTo(0.5 + Math.PI / 2, 12);
    expect(mascot.antenna.position.y).toBeGreaterThan(CONFIG.BALL_RADIUS * 0.5); // points to axis
  });
});

describe('T14 serviceForScore', () => {
  it('rotates deterministically from Lambda', () => {
    expect(serviceForScore(1)).toBe('Lambda');
    expect(serviceForScore(2)).toBe('S3');
    expect(serviceForScore(SERVICES.length)).toBe('Route 53');
    expect(serviceForScore(SERVICES.length + 1)).toBe('Lambda');
    expect(serviceForScore(7)).toBe(serviceForScore(7));
  });

  it('invalid or non-positive scores fall back to the first service', () => {
    for (const s of [0, -3, NaN, 1.5, undefined, '3']) expect(serviceForScore(s)).toBe(SERVICES[0]);
  });
});

describe('T15 regions', () => {
  it('boundaries 0,4,5,9,10', () => {
    expect(REGION_EVERY).toBe(5);
    expect(regionForScore(0)).toBe('us-east-1');
    expect(regionForScore(4)).toBe('us-east-1');
    expect(regionForScore(5)).toBe('us-west-2');
    expect(regionForScore(9)).toBe('us-west-2');
    expect(regionForScore(10)).toBe('eu-west-1');
  });

  it('wraps after 8 regions and handles invalid input', () => {
    const n = REGIONS.length;
    expect(n).toBe(8);
    expect(regionForScore(REGION_EVERY * n)).toBe('us-east-1');
    expect(regionForScore(REGION_EVERY * (n - 1))).toBe('sa-east-1');
    expect(regionForScore(-1)).toBe('us-east-1');
    expect(regionForScore(NaN)).toBe('us-east-1');
  });

  it('regionChanged only when crossing a multiple of 5 upwards', () => {
    expect(regionChanged(4, 5)).toBe(true);
    expect(regionChanged(9, 10)).toBe(true);
    expect(regionChanged(5, 6)).toBe(false);
    expect(regionChanged(6, 4)).toBe(false);
    expect(regionChanged(0, 0)).toBe(false);
    expect(regionChanged(NaN, 5)).toBe(false);
  });
});
