// DOM overlays, HUD and feedback (FR5, FR13, FR15, FR17).
// Emits intents through callbacks only — never changes the game state itself.

const GAME_OVER_PANEL_DELAY_MS = 450;
const TOAST_MS = 1400;
const PERFECT_MS = 900;
const HIT_SHAKE_MS = 300;

function noop() {}

export class UIManager {
  constructor({ root = globalThis.document, callbacks = {} } = {}) {
    if (!root || typeof root.getElementById !== 'function') {
      throw new TypeError('UIManager: root must be a Document');
    }
    const $ = (id) => {
      const el = root.getElementById(id);
      if (!el) throw new Error(`UIManager: missing #${id} in index.html`);
      return el;
    };
    this.el = {
      score: $('score'),
      hudBest: $('hud-best'),
      readyBest: $('ready-best'),
      pauseBtn: $('btn-pause'),
      muteBtn: $('btn-mute'),
      ready: $('overlay-ready'),
      paused: $('overlay-paused'),
      over: $('overlay-over'),
      startBtn: $('btn-start'),
      resumeBtn: $('btn-resume'),
      restartPausedBtn: $('btn-restart-paused'),
      restartBtn: $('btn-restart'),
      finalScore: $('final-score'),
      overBest: $('over-best'),
      newBadge: $('new-badge'),
      flash: $('flash'),
      toast: $('toast'),
      servicePop: $('service-pop'),
      hudRegion: $('hud-region'),
      overRegion: $('over-region'),
      perfect: $('perfect'),
    };
    this.cb = {
      onStart: callbacks.onStart || noop,
      onPause: callbacks.onPause || noop,
      onResume: callbacks.onResume || noop,
      onRestart: callbacks.onRestart || noop,
      onToggleMute: callbacks.onToggleMute || noop,
    };
    this._lastScore = null;
    this._lastBest = null;
    this._lastState = null;
    this._overData = { score: 0, best: 0, isNew: false, region: '' };
    this._lastRegion = null;
    this._restartReady = false;
    this._overTimer = null;
    this._toastTimer = null;
    this._perfectTimer = null;
    this._shakeTimer = null;
    this._body = root.body ?? null;
    this._bind();
  }

  _bind() {
    const { el, cb } = this;
    // Blur after click so a later Space press is not re-delivered to a focused button
    // (Space is the game's own primary key).
    const on = (node, fn) =>
      node.addEventListener('click', (e) => {
        e.currentTarget.blur?.();
        fn();
      });
    on(el.startBtn, () => cb.onStart());
    on(el.pauseBtn, () => cb.onPause());
    on(el.resumeBtn, () => cb.onResume());
    on(el.restartPausedBtn, () => cb.onRestart());
    on(el.restartBtn, () => {
      if (this._restartReady) cb.onRestart();
    });
    on(el.muteBtn, () => cb.onToggleMute());
  }

  /** True once the GAME_OVER panel is shown (guards against accidental instant restarts). */
  get restartReady() {
    return this._restartReady;
  }

  /** Per-frame sync: writes the DOM only when a value or the state changed. */
  sync(game) {
    if (game.score !== this._lastScore) {
      this._lastScore = game.score;
      this.el.score.textContent = String(game.score);
      if (game.score > 0) this._retrigger(this.el.score, 'bump');
    }
    if (game.state !== this._lastState) {
      this.showState(game.state);
    }
  }

  setBest(n) {
    if (n === this._lastBest) return;
    this._lastBest = n;
    this.el.hudBest.textContent = String(n);
    this.el.readyBest.textContent = String(n);
  }

  /** Final numbers for the GAME_OVER panel (set when the hit happens). */
  setGameOverData({ score, best, isNew, region = this._lastRegion ?? '' }) {
    this._overData = { score, best, isNew: Boolean(isNew), region: String(region) };
  }

  /** Current AWS Region label in the HUD (FR22). Writes only on change. */
  setRegion(region) {
    if (region === this._lastRegion) return;
    this._lastRegion = region;
    this.el.hudRegion.textContent = '🌐 ' + region;
  }

  /** Reusable "+1 <service>" pop near bottom-centre; restarts its CSS animation (FR21). */
  servicePop(text) {
    const p = this.el.servicePop;
    p.textContent = text;
    p.classList.remove('is-active');
    void p.offsetWidth; // restart the CSS animation
    p.classList.add('is-active');
  }

  /** Remove + reflow + add: restarts a CSS animation class. */
  _retrigger(node, cls) {
    node.classList.remove(cls);
    void node.offsetWidth;
    node.classList.add(cls);
  }

  /** "PERFECT" / "PERFECT xN" feedback for a centred pass (FR28). */
  perfect(streak = 1) {
    const n = Number.isInteger(streak) && streak > 0 ? streak : 1;
    const p = this.el.perfect;
    p.textContent = n >= 2 ? `PERFECT x${n}` : 'PERFECT';
    this._retrigger(p, 'is-active');
    clearTimeout(this._perfectTimer);
    this._perfectTimer = setTimeout(() => p.classList.remove('is-active'), PERFECT_MS);
  }

  setMuted(muted) {
    this.el.muteBtn.textContent = muted ? '🔇' : '🔊';
    this.el.muteBtn.setAttribute('aria-label', muted ? '取消静音' : '静音');
  }

  _setOverlay(node, visible) {
    node.classList.toggle('is-visible', visible);
  }

  showState(state) {
    this._lastState = state;
    clearTimeout(this._overTimer);
    this._overTimer = null;
    const { el } = this;
    this._setOverlay(el.ready, state === 'READY');
    this._setOverlay(el.paused, state === 'PAUSED');
    el.pauseBtn.hidden = state !== 'PLAYING';
    if (state !== 'GAME_OVER') {
      this._setOverlay(el.over, false);
      this._restartReady = false;
      el.restartBtn.disabled = true;
      return;
    }
    // GAME_OVER: let the flash play first, then show the result and enable restart.
    this._restartReady = false;
    el.restartBtn.disabled = true;
    this._overTimer = setTimeout(() => {
      const d = this._overData;
      el.finalScore.textContent = String(d.score);
      el.overBest.textContent = String(d.best);
      el.newBadge.hidden = !d.isNew;
      el.overRegion.textContent = d.region;
      this._setOverlay(el.over, true);
      el.restartBtn.disabled = false;
      this._restartReady = true;
    }, GAME_OVER_PANEL_DELAY_MS);
  }

  flash() {
    const f = this.el.flash;
    f.classList.remove('is-active');
    void f.offsetWidth; // restart the CSS animation
    f.classList.add('is-active');
    // Short whole-screen shake (FR29); visual only.
    const body = this._body;
    if (body?.classList) {
      this._retrigger(body, 'is-hit');
      clearTimeout(this._shakeTimer);
      this._shakeTimer = setTimeout(() => body.classList.remove('is-hit'), HIT_SHAKE_MS);
    }
  }

  toast(text) {
    const t = this.el.toast;
    t.textContent = text;
    t.classList.add('is-visible');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove('is-visible'), TOAST_MS);
  }
}
