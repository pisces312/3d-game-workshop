// Best score persistence (FR13): localStorage when available, in-memory fallback otherwise.
// Never throws — private mode, quota errors or a blocked storage must not affect the game.

/** localStorage, or null when even accessing it throws (some privacy modes / sandboxes). */
export function safeLocalStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export class BestScore {
  constructor({ storage = safeLocalStorage(), key = 'spacefold.best' } = {}) {
    this.storage = storage;
    this.key = key;
    this._memory = 0;
    this._warned = false;
    this._memory = this._readStored();
  }

  _warnOnce(op, err) {
    if (this._warned) return;
    this._warned = true;
    console.warn(`[BestScore] storage ${op} failed, keeping best score in memory only:`, err);
  }

  _readStored() {
    if (!this.storage) return this._memory;
    try {
      const raw = this.storage.getItem(this.key);
      const n = raw === null || raw === undefined ? 0 : Number.parseInt(raw, 10);
      return Number.isFinite(n) && n > this._memory ? n : this._memory;
    } catch (err) {
      this._warnOnce('read', err);
      return this._memory;
    }
  }

  /** Current best score (never negative). */
  get() {
    this._memory = this._readStored();
    return this._memory;
  }

  /** Record a finished run. Returns the best score and whether this run set it. */
  submit(score) {
    const best = this.get();
    if (!Number.isFinite(score) || score < 0) return { best, isNew: false };
    const s = Math.floor(score);
    if (s <= best) return { best, isNew: false };
    this._memory = s;
    if (this.storage) {
      try {
        this.storage.setItem(this.key, String(s));
      } catch (err) {
        this._warnOnce('write', err);
      }
    }
    return { best: s, isNew: true };
  }
}
