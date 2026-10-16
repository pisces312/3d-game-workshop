// Game state enum and the explicit transition table (FR7).

export const State = Object.freeze({
  READY: 'READY',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
});

// from -> allowed targets. Every other transition is rejected.
//   READY     -> PLAYING   (start)
//   PLAYING   -> PAUSED    (pause)
//   PAUSED    -> PLAYING   (resume / restart)
//   PLAYING   -> GAME_OVER (hit)
//   GAME_OVER -> PLAYING   (restart)
const TRANSITIONS = Object.freeze({
  [State.READY]: Object.freeze([State.PLAYING]),
  [State.PLAYING]: Object.freeze([State.PAUSED, State.GAME_OVER]),
  [State.PAUSED]: Object.freeze([State.PLAYING]),
  [State.GAME_OVER]: Object.freeze([State.PLAYING]),
});

export class GameStateMachine {
  constructor() {
    this._state = State.READY;
  }

  get state() {
    return this._state;
  }

  /** Whether moving to `to` from the current state is a defined transition. */
  can(to) {
    const allowed = TRANSITIONS[this._state];
    return Boolean(allowed && allowed.includes(to));
  }

  /** Apply the transition; returns false and leaves the state unchanged when illegal. */
  transition(to) {
    if (!this.can(to)) return false;
    this._state = to;
    return true;
  }

  reset() {
    this._state = State.READY;
    return this._state;
  }
}
