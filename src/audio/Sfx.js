// Synthesised sound effects with Web Audio (FR16). No audio files.
// The AudioContext is created lazily on the first user gesture (autoplay policies);
// every method is a silent no-op when Web Audio is unavailable or muted.

const MASTER_GAIN = 0.15;

export class Sfx {
  constructor({
    AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext,
    muted = false,
  } = {}) {
    this.AudioContextClass = AudioContextClass;
    this.ctx = null;
    this.master = null;
    this._muted = Boolean(muted);
    this._failed = false;
  }

  get muted() {
    return this._muted;
  }

  get available() {
    return Boolean(this.ctx) && !this._failed;
  }

  setMuted(muted) {
    this._muted = Boolean(muted);
    if (this.master) this.master.gain.value = this._muted ? 0 : MASTER_GAIN;
  }

  /** Create / resume the AudioContext. Call from a user gesture handler. */
  unlock() {
    if (this._failed || !this.AudioContextClass) return;
    try {
      if (!this.ctx) {
        this.ctx = new this.AudioContextClass();
        this.master = this.ctx.createGain();
        this.master.gain.value = this._muted ? 0 : MASTER_GAIN;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch((err) => console.warn('[Sfx] resume failed:', err));
      }
    } catch (err) {
      this._failed = true;
      console.warn('[Sfx] Web Audio unavailable, continuing without sound:', err);
    }
  }

  _tone({ type = 'sine', from, to, duration, gain = 1, delay = 0 }) {
    if (this._muted || !this.ctx || this._failed) return;
    try {
      const t0 = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(from, t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + duration);
      env.gain.setValueAtTime(0.0001, t0);
      env.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
      osc.connect(env);
      env.connect(this.master);
      osc.start(t0);
      osc.stop(t0 + duration + 0.02);
    } catch (err) {
      console.warn('[Sfx] tone failed:', err);
    }
  }

  pass() {
    this._tone({ type: 'sine', from: 660, to: 1320, duration: 0.08, gain: 0.8 });
  }

  hit() {
    this._tone({ type: 'sawtooth', from: 320, to: 50, duration: 0.15, gain: 1 });
    this._tone({ type: 'square', from: 120, to: 40, duration: 0.15, gain: 0.5 });
  }

  start() {
    this._tone({ type: 'triangle', from: 440, to: 520, duration: 0.09, gain: 0.8 });
    this._tone({ type: 'triangle', from: 880, to: 1040, duration: 0.11, gain: 0.8, delay: 0.09 });
  }
}
