import { describe, it, expect } from 'vitest';
// multiplayer.js 是浏览器脚本（UMD）：CommonJS 下走 module.exports，
// ESM 环境（上层 package.json 为 "type":"module"）下挂到 globalThis.MP
import * as mod from './multiplayer.js';

const MP = (mod && mod.default && mod.default.mulberry32) ? mod.default : globalThis.MP;

describe('multiplayer pure logic', () => {
  it('seeded PRNG is deterministic per seed and differs across seeds', () => {
    const a = MP.mulberry32(12345), b = MP.mulberry32(12345), c = MP.mulberry32(54321);
    const sa = Array.from({ length: 20 }, () => a());
    const sb = Array.from({ length: 20 }, () => b());
    const sc = Array.from({ length: 20 }, () => c());
    expect(sa).toEqual(sb);
    expect(sa).not.toEqual(sc);
    sa.forEach(v => { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1); });
    expect(MP.levelSeed(7, 0)).not.toBe(MP.levelSeed(7, 1));
    expect(() => MP.mulberry32(NaN)).toThrow();
  });

  it('generated room codes validate and map to a peer id', () => {
    const rnd = MP.mulberry32(1);
    for (let i = 0; i < 50; i++) {
      const code = MP.generateRoomCode(rnd);
      expect(MP.isValidRoomCode(code)).toBe(true);
    }
    expect(MP.normalizeRoomCode(' ab c3 ')).toBe('ABC3');
    expect(MP.peerIdFor('abc3')).toBe('sheepriver-abc3');
  });

  it('rejects invalid room codes', () => {
    ['', 'ABC', 'ABCDE', 'AB-C', 'ABI0', 'OOOO', null, undefined, 1234].forEach(c => {
      expect(MP.isValidRoomCode(c)).toBe(false);
    });
    expect(() => MP.peerIdFor('xx')).toThrow();
  });

  it('round-trips valid messages', () => {
    const state = { x: 1.5, y: 0, z: -3, dir: 'left', vis: true, row: 3 };
    expect(MP.decodeMessage(MP.encodeMessage('state', state))).toEqual({ v: 1, type: 'state', ...state });
    expect(MP.decodeMessage(MP.encodeMessage('start', { seed: 4294967295, level: 0 }))).toMatchObject({ type: 'start', seed: 4294967295, level: 0 });
    expect(MP.decodeMessage(MP.encodeMessage('win', { time: 12.3 }))).toMatchObject({ type: 'win', time: 12.3 });
    expect(MP.decodeMessage(MP.encodeMessage('hello'))).toEqual({ v: 1, type: 'hello' });
  });

  it('rejects malformed, incomplete or wrongly typed messages', () => {
    expect(MP.decodeMessage('not json{')).toBeNull();
    expect(MP.decodeMessage('[]')).toBeNull();
    expect(MP.decodeMessage(JSON.stringify({ v: 1, type: 'nope' }))).toBeNull();
    expect(MP.decodeMessage(JSON.stringify({ v: 2, type: 'hello' }))).toBeNull();
    expect(MP.decodeMessage(JSON.stringify({ v: 1, type: 'state', x: 1, y: 0, z: 0, dir: 'up', vis: true, row: 0 }))).toBeNull();
    expect(MP.decodeMessage(JSON.stringify({ v: 1, type: 'state', x: '1', y: 0, z: 0, dir: 'fwd', vis: true, row: 0 }))).toBeNull();
    expect(MP.decodeMessage(JSON.stringify({ v: 1, type: 'start', seed: -1, level: 0 }))).toBeNull();
    expect(MP.decodeMessage(JSON.stringify({ v: 1, type: 'start', level: 0 }))).toBeNull();
    expect(MP.decodeMessage('x'.repeat(5000))).toBeNull();
    expect(() => MP.encodeMessage('state', { x: 1 })).toThrow();
  });

  it('interpolation is exact at the ends and clamped outside [0,1]', () => {
    const a = { x: 0, y: 0, z: 0 }, b = { x: 10, y: 2, z: -4 };
    expect(MP.interpolatePose(a, b, 0)).toEqual(a);
    expect(MP.interpolatePose(a, b, 1)).toEqual(b);
    expect(MP.interpolatePose(a, b, 0.5)).toEqual({ x: 5, y: 1, z: -2 });
    expect(MP.interpolatePose(a, b, -3)).toEqual(a);
    expect(MP.interpolatePose(a, b, 7)).toEqual(b);
    expect(MP.lerp(0, 10, NaN)).toBe(0);
  });
});
