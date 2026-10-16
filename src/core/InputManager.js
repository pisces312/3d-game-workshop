// Unified desktop + touch input (FR9, FR10, FR12).
// Pointer Events only (no touch*/mouse* listeners => no emulated-mouse duplicates),
// one tracked pointerId, relative drag deltas normalised by the viewport's short side.
import { CONFIG } from '../config.js';

const LEFT_KEYS = new Set(['KeyA', 'ArrowLeft']);
const RIGHT_KEYS = new Set(['KeyD', 'ArrowRight']);
const PAUSE_KEYS = new Set(['KeyP', 'Escape']);
const HANDLED_KEYS = new Set([...LEFT_KEYS, ...RIGHT_KEYS, ...PAUSE_KEYS, 'Space']);

// Some keyboards, IMEs and synthetic events leave `code` empty; fall back to `key`.
const KEY_FALLBACK = {
  ' ': 'Space', Spacebar: 'Space', a: 'KeyA', A: 'KeyA', d: 'KeyD', D: 'KeyD',
  p: 'KeyP', P: 'KeyP', Escape: 'Escape', Esc: 'Escape',
  ArrowLeft: 'ArrowLeft', Left: 'ArrowLeft', ArrowRight: 'ArrowRight', Right: 'ArrowRight',
};

export function keyCodeOf(e) {
  if (e.code && HANDLED_KEYS.has(e.code)) return e.code;
  return KEY_FALLBACK[e.key] || e.code || '';
}

function defaultViewport() {
  return { width: globalThis.innerWidth || 1, height: globalThis.innerHeight || 1 };
}

export class InputManager {
  constructor({
    element,
    keyTarget = globalThis.window,
    getViewport = defaultViewport,
    onAction = () => {},
    config = CONFIG,
  } = {}) {
    if (!element || typeof element.addEventListener !== 'function') {
      throw new TypeError('InputManager: element must be an EventTarget');
    }
    this.element = element;
    this.keyTarget = keyTarget;
    this.getViewport = getViewport;
    this.onAction = onAction;
    this.config = config;
    this._keys = new Set();
    this._activePointer = null;
    this._lastX = 0;
    this._drag = 0;
    this._attached = false;

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._onPointerCancel = this._onPointerCancel.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onBlur = this.reset.bind(this);
  }

  attach() {
    if (this._attached) return this;
    const el = this.element;
    el.addEventListener('pointerdown', this._onPointerDown);
    el.addEventListener('pointermove', this._onPointerMove);
    el.addEventListener('pointerup', this._onPointerUp);
    el.addEventListener('pointercancel', this._onPointerCancel);
    el.addEventListener('lostpointercapture', this._onPointerCancel);
    const kt = this.keyTarget;
    if (kt) {
      kt.addEventListener('keydown', this._onKeyDown);
      kt.addEventListener('keyup', this._onKeyUp);
      kt.addEventListener('blur', this._onBlur);
    }
    this._attached = true;
    return this;
  }

  detach() {
    if (!this._attached) return this;
    const el = this.element;
    el.removeEventListener('pointerdown', this._onPointerDown);
    el.removeEventListener('pointermove', this._onPointerMove);
    el.removeEventListener('pointerup', this._onPointerUp);
    el.removeEventListener('pointercancel', this._onPointerCancel);
    el.removeEventListener('lostpointercapture', this._onPointerCancel);
    const kt = this.keyTarget;
    if (kt) {
      kt.removeEventListener('keydown', this._onKeyDown);
      kt.removeEventListener('keyup', this._onKeyUp);
      kt.removeEventListener('blur', this._onBlur);
    }
    this._attached = false;
    this.reset();
    return this;
  }

  get isDragging() {
    return this._activePointer !== null;
  }

  get activePointerId() {
    return this._activePointer;
  }

  /** Current keyboard axis in {-1, 0, 1}. */
  get axis() {
    let right = 0;
    let left = 0;
    for (const k of this._keys) {
      if (RIGHT_KEYS.has(k)) right = 1;
      else if (LEFT_KEYS.has(k)) left = 1;
    }
    return right - left;
  }

  /** Read the input for this frame; the accumulated drag angle is consumed. */
  sample() {
    const out = { axis: this.axis, dragAngle: this._drag };
    this._drag = 0;
    return out;
  }

  /** Clear every pressed key, the tracked pointer and the pending drag. */
  reset() {
    const id = this._activePointer;
    this._keys.clear();
    this._activePointer = null; // cleared first so a re-entrant lostpointercapture is ignored
    this._drag = 0;
    this._releaseCapture(id);
  }

  // ---- pointer ---------------------------------------------------------------------
  _onPointerDown(e) {
    if (this._activePointer !== null) return; // only the first finger steers
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (!Number.isFinite(e.clientX)) return;
    this._activePointer = e.pointerId;
    this._lastX = e.clientX;
    try {
      this.element.setPointerCapture?.(e.pointerId);
    } catch (err) {
      // Capture is a nicety (keeps tracking outside the canvas); input still works without it.
      console.warn('[InputManager] setPointerCapture failed:', err);
    }
    e.preventDefault?.();
  }

  _onPointerMove(e) {
    if (this._activePointer === null || e.pointerId !== this._activePointer) return;
    if (!Number.isFinite(e.clientX)) return;
    const dx = e.clientX - this._lastX;
    this._lastX = e.clientX;
    const vp = this.getViewport() || {};
    const shortSide = Math.max(1, Math.min(vp.width || 1, vp.height || 1));
    this._drag += (dx / shortSide) * this.config.DRAG_GAIN;
    e.preventDefault?.();
  }

  _onPointerUp(e) {
    if (this._activePointer === null || e.pointerId !== this._activePointer) return;
    const id = this._activePointer;
    this._activePointer = null; // keep the pending drag: it happened before the release
    this._releaseCapture(id);
  }

  _onPointerCancel(e) {
    if (this._activePointer === null || e.pointerId !== this._activePointer) return;
    this.reset();
  }

  _releaseCapture(id) {
    if (id === null || id === undefined) return;
    try {
      if (this.element.hasPointerCapture?.(id)) {
        this.element.releasePointerCapture?.(id);
      }
    } catch (err) {
      console.warn('[InputManager] releasePointerCapture failed:', err);
    }
  }

  // ---- keyboard --------------------------------------------------------------------
  _onKeyDown(e) {
    const code = keyCodeOf(e);
    if (!HANDLED_KEYS.has(code)) return;
    e.preventDefault?.();
    if (code === 'Space') {
      if (!e.repeat) this._emitAction('primary');
      return;
    }
    if (PAUSE_KEYS.has(code)) {
      if (!e.repeat) this._emitAction('pause');
      return;
    }
    this._keys.add(code);
  }

  _onKeyUp(e) {
    const code = keyCodeOf(e);
    if (!HANDLED_KEYS.has(code)) return;
    e.preventDefault?.();
    this._keys.delete(code);
  }

  _emitAction(name) {
    try {
      this.onAction(name);
    } catch (err) {
      console.error(`[InputManager] action "${name}" handler failed:`, err);
    }
  }
}
