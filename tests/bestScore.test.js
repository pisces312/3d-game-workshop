import { describe, it, expect, vi, afterEach } from 'vitest';
import { BestScore, safeLocalStorage } from '../src/storage/BestScore.js';

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = String(v);
    },
  };
}

function throwingStorage() {
  return {
    getItem() {
      throw new Error('SecurityError: storage disabled');
    },
    setItem() {
      throw new Error('QuotaExceededError');
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('T11 — best score persistence with fallback (AC11)', () => {
  it('persists to a working storage and reads it back in a new instance', () => {
    const storage = memoryStorage();
    const best = new BestScore({ storage });
    expect(best.get()).toBe(0);
    expect(best.submit(12)).toEqual({ best: 12, isNew: true });
    expect(best.submit(7)).toEqual({ best: 12, isNew: false });
    expect(storage.data['spacefold.best']).toBe('12');
    expect(new BestScore({ storage }).get()).toBe(12);
  });

  it('storage whose getItem/setItem throw never throws and keeps the best in memory', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const best = new BestScore({ storage: throwingStorage() });
    expect(best.get()).toBe(0);
    expect(() => best.submit(5)).not.toThrow();
    expect(best.submit(9)).toEqual({ best: 9, isNew: true });
    expect(best.get()).toBe(9);
    expect(best.submit(3)).toEqual({ best: 9, isNew: false });
    expect(warn).toHaveBeenCalledTimes(1); // surfaced once, not spammed
  });

  it('null storage works purely in memory', () => {
    const best = new BestScore({ storage: null });
    expect(best.submit(4)).toEqual({ best: 4, isNew: true });
    expect(best.get()).toBe(4);
  });

  it('ignores negative, NaN and non-finite scores; corrupt stored values read as 0', () => {
    const best = new BestScore({ storage: memoryStorage({ 'spacefold.best': 'garbage' }) });
    expect(best.get()).toBe(0);
    expect(best.submit(-3)).toEqual({ best: 0, isNew: false });
    expect(best.submit(Number.NaN)).toEqual({ best: 0, isNew: false });
    expect(best.submit(Infinity)).toEqual({ best: 0, isNew: false });
    expect(best.submit(0)).toEqual({ best: 0, isNew: false });
  });

  it('safeLocalStorage returns null when accessing localStorage throws', () => {
    const desc = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('SecurityError');
      },
    });
    try {
      expect(safeLocalStorage()).toBe(null);
      expect(new BestScore().submit(2)).toEqual({ best: 2, isNew: true });
    } finally {
      if (desc) Object.defineProperty(globalThis, 'localStorage', desc);
      else delete globalThis.localStorage;
    }
  });
});
