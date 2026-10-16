import { describe, it, expect, beforeEach } from 'vitest';
import { InputManager } from '../src/core/InputManager.js';
import { CONFIG } from '../src/config.js';

function pointer(type, props) {
  return Object.assign(new Event(type, { cancelable: true }), {
    pointerType: 'touch',
    button: 0,
    clientY: 0,
    ...props,
  });
}

function key(type, code, extra = {}) {
  return Object.assign(new Event(type, { cancelable: true }), { code, repeat: false, ...extra });
}

describe('T7 — input cancel leaves no residual key/drag (AC7)', () => {
  let element;
  let keyTarget;
  let actions;
  let input;

  beforeEach(() => {
    element = new EventTarget();
    keyTarget = new EventTarget();
    actions = [];
    input = new InputManager({
      element,
      keyTarget,
      getViewport: () => ({ width: 400, height: 800 }),
      onAction: (a) => actions.push(a),
    }).attach();
  });

  it('pointerdown + move produces a relative drag angle scaled by the short side', () => {
    element.dispatchEvent(pointer('pointerdown', { pointerId: 1, clientX: 100 }));
    element.dispatchEvent(pointer('pointermove', { pointerId: 1, clientX: 140 }));
    expect(input.isDragging).toBe(true);
    expect(input.activePointerId).toBe(1);
    const s = input.sample();
    expect(s.dragAngle).toBeCloseTo((40 / 400) * CONFIG.DRAG_GAIN, 12);
    expect(s.axis).toBe(0);
    expect(input.sample().dragAngle).toBe(0); // consumed
  });

  it('pointercancel clears everything and later moves for that id are ignored', () => {
    element.dispatchEvent(pointer('pointerdown', { pointerId: 1, clientX: 100 }));
    element.dispatchEvent(pointer('pointermove', { pointerId: 1, clientX: 180 }));
    keyTarget.dispatchEvent(key('keydown', 'KeyD'));
    element.dispatchEvent(pointer('pointercancel', { pointerId: 1, clientX: 180 }));
    expect(input.sample()).toEqual({ axis: 0, dragAngle: 0 });
    expect(input.isDragging).toBe(false);
    element.dispatchEvent(pointer('pointermove', { pointerId: 1, clientX: 300 }));
    expect(input.sample()).toEqual({ axis: 0, dragAngle: 0 });
  });

  it('lostpointercapture of the active pointer also resets', () => {
    element.dispatchEvent(pointer('pointerdown', { pointerId: 4, clientX: 0 }));
    element.dispatchEvent(pointer('pointermove', { pointerId: 4, clientX: 50 }));
    element.dispatchEvent(pointer('lostpointercapture', { pointerId: 4 }));
    expect(input.sample().dragAngle).toBe(0);
    expect(input.activePointerId).toBe(null);
  });

  it('a second pointerId is ignored while the first is active', () => {
    element.dispatchEvent(pointer('pointerdown', { pointerId: 1, clientX: 100 }));
    element.dispatchEvent(pointer('pointerdown', { pointerId: 2, clientX: 300 }));
    element.dispatchEvent(pointer('pointermove', { pointerId: 2, clientX: 0 }));
    element.dispatchEvent(pointer('pointercancel', { pointerId: 2 }));
    expect(input.activePointerId).toBe(1);
    element.dispatchEvent(pointer('pointermove', { pointerId: 1, clientX: 120 }));
    expect(input.sample().dragAngle).toBeCloseTo((20 / 400) * CONFIG.DRAG_GAIN, 12);
  });

  it('pointerup keeps the pending drag but stops tracking', () => {
    element.dispatchEvent(pointer('pointerdown', { pointerId: 1, clientX: 100 }));
    element.dispatchEvent(pointer('pointermove', { pointerId: 1, clientX: 60 }));
    element.dispatchEvent(pointer('pointerup', { pointerId: 1, clientX: 60 }));
    expect(input.isDragging).toBe(false);
    expect(input.sample().dragAngle).toBeCloseTo((-40 / 400) * CONFIG.DRAG_GAIN, 12);
    element.dispatchEvent(pointer('pointermove', { pointerId: 1, clientX: 0 }));
    expect(input.sample().dragAngle).toBe(0);
  });

  it('key D then keyTarget blur leaves axis 0', () => {
    keyTarget.dispatchEvent(key('keydown', 'KeyD'));
    expect(input.sample().axis).toBe(1);
    keyTarget.dispatchEvent(key('keydown', 'ArrowLeft'));
    expect(input.sample().axis).toBe(0);
    keyTarget.dispatchEvent(key('keyup', 'KeyD'));
    expect(input.sample().axis).toBe(-1);
    keyTarget.dispatchEvent(new Event('blur'));
    expect(input.sample().axis).toBe(0);
  });

  it('ignores a non-primary mouse button', () => {
    element.dispatchEvent(pointer('pointerdown', { pointerId: 9, clientX: 10, pointerType: 'mouse', button: 2 }));
    expect(input.isDragging).toBe(false);
    element.dispatchEvent(pointer('pointermove', { pointerId: 9, clientX: 90, pointerType: 'mouse' }));
    expect(input.sample().dragAngle).toBe(0);
  });

  it('falls back to e.key when e.code is empty (synthetic / IME key events)', () => {
    const down = key('keydown', '', { key: ' ' });
    keyTarget.dispatchEvent(down);
    expect(actions).toEqual(['primary']);
    expect(down.defaultPrevented).toBe(true);
    keyTarget.dispatchEvent(key('keydown', '', { key: 'd' }));
    expect(input.sample().axis).toBe(1);
    keyTarget.dispatchEvent(key('keyup', '', { key: 'd' }));
    expect(input.sample().axis).toBe(0);
    keyTarget.dispatchEvent(key('keydown', '', { key: 'x' }));
    expect(actions).toEqual(['primary']);
  });

  it('Space fires primary once even with auto-repeat; P/Escape fire pause', () => {
    const down = key('keydown', 'Space');
    keyTarget.dispatchEvent(down);
    keyTarget.dispatchEvent(key('keydown', 'Space', { repeat: true }));
    keyTarget.dispatchEvent(key('keydown', 'Space', { repeat: true }));
    keyTarget.dispatchEvent(key('keydown', 'KeyP'));
    keyTarget.dispatchEvent(key('keydown', 'Escape'));
    expect(actions).toEqual(['primary', 'pause', 'pause']);
    expect(down.defaultPrevented).toBe(true);
  });

  it('detach removes listeners', () => {
    input.detach();
    keyTarget.dispatchEvent(key('keydown', 'KeyD'));
    element.dispatchEvent(pointer('pointerdown', { pointerId: 1, clientX: 0 }));
    expect(input.sample()).toEqual({ axis: 0, dragAngle: 0 });
    expect(input.isDragging).toBe(false);
  });

  it('rejects a missing element', () => {
    expect(() => new InputManager({ element: null })).toThrow(TypeError);
  });
});
