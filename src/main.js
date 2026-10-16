// Wiring: the ONLY module that touches window/document lifecycle.
// Exactly one Game, Renderer, InputManager, UIManager, Sfx and BestScore for desktop
// and phone alike (NFR2).
import { CONFIG } from './config.js';
import { Game } from './core/Game.js';
import { State } from './core/GameState.js';
import { FixedStepper } from './core/FixedStepper.js';
import { Renderer } from './core/Renderer.js';
import { InputManager } from './core/InputManager.js';
import { readViewportSize } from './core/Viewport.js';
import { UIManager } from './ui/UIManager.js';
import { Sfx } from './audio/Sfx.js';
import { BestScore } from './storage/BestScore.js';
import { OBSTACLE_COLORS } from './entities/Obstacle.js';
import { PALETTE, REGIONS, serviceForScore, regionForScore, regionChanged } from './theme.js';

const container = document.getElementById('app');

function showFatal(message, err) {
  console.error('[SpaceFold]', message, err);
  const box = document.getElementById('fatal');
  box.textContent = message;
  box.hidden = false;
}

let renderer;
try {
  renderer = new Renderer({ container });
} catch (err) {
  showFatal('无法初始化 WebGL，请使用较新的 Chrome / Safari / Edge 浏览器打开。', err);
  throw err;
}

const game = new Game();
const stepper = new FixedStepper();
const sfx = new Sfx();
const bestScore = new BestScore();

// ---- actions (one place decides what each intent does in each state) -----------------
function startRun() {
  if (game.state !== State.READY) return;
  input.reset();
  stepper.reset();
  if (game.start()) {
    resetRegion();
    sfx.start();
  }
}

function restartRun() {
  if (game.state === State.GAME_OVER && !ui.restartReady) return; // 400 ms+ guard
  input.reset();
  stepper.reset();
  if (game.restart()) {
    renderer.resetView(game);
    resetRegion();
    sfx.start();
  }
}

function togglePause() {
  if (game.state === State.PLAYING) game.pause();
  else if (game.state === State.PAUSED) resumeRun();
}

function resumeRun() {
  if (game.state !== State.PAUSED) return;
  input.reset();
  stepper.reset();
  game.resume();
}

function handleAction(name) {
  if (name === 'primary') {
    if (game.state === State.READY) startRun();
    else if (game.state === State.PAUSED) resumeRun();
    else if (game.state === State.GAME_OVER) restartRun();
  } else if (name === 'pause') {
    togglePause();
  }
}

const ui = new UIManager({
  root: document,
  callbacks: {
    onStart: () => {
      sfx.unlock();
      startRun();
    },
    onPause: togglePause,
    onResume: resumeRun,
    onRestart: () => {
      sfx.unlock();
      restartRun();
    },
    onToggleMute: () => {
      sfx.unlock();
      sfx.setMuted(!sfx.muted);
      ui.setMuted(sfx.muted);
    },
  },
});
ui.setBest(bestScore.get());
ui.setMuted(sfx.muted);
ui.showState(game.state);

const input = new InputManager({
  element: renderer.domElement,
  keyTarget: window,
  getViewport: () => readViewportSize(container),
  onAction: handleAction,
}).attach();

// Web Audio may only start from a user gesture.
const unlockAudio = () => sfx.unlock();
window.addEventListener('pointerdown', unlockAudio, { passive: true });
window.addEventListener('keydown', unlockAudio);

// ---- AWS Edition: services + Regions (FR21, FR22) --------------------------------------
let lastScore = 0;
function resetRegion() {
  lastScore = 0;
  ui.setRegion(REGIONS[0]);
}
resetRegion();

// ---- game events -> feedback -------------------------------------------------------------
const tmpPos = { x: 0, y: 0, z: 0 };
game.on('pass', ({ obstacle }) => {
  sfx.pass();
  const p = game.playerPosition(tmpPos);
  renderer.burst(p.x, p.y, p.z, obstacle.kind === 'rotating' ? OBSTACLE_COLORS.rotating : PALETTE.orange);
  const score = game.score;
  ui.servicePop('+1 ' + serviceForScore(score));
  if (regionChanged(lastScore, score)) {
    const region = regionForScore(score);
    ui.setRegion(region);
    ui.toast('进入 Region ' + region);
  }
  lastScore = score;
});
game.on('hit', ({ score }) => {
  sfx.hit();
  renderer.shake();
  ui.flash();
  const result = bestScore.submit(score);
  ui.setGameOverData({ score, best: result.best, isNew: result.isNew, region: regionForScore(score) });
  ui.setBest(result.best);
  input.reset();
});
game.on('twist', () => ui.toast('空间扭曲！'));

// ---- resize pipeline (FR11): many sources, one coalesced rAF, rendering only ----------
let resizeQueued = false;
function applyResize() {
  resizeQueued = false;
  const { width, height } = readViewportSize(container);
  renderer.resize(width, height, window.devicePixelRatio || 1);
}
function scheduleResize() {
  if (resizeQueued) return;
  resizeQueued = true;
  requestAnimationFrame(applyResize);
}
if ('ResizeObserver' in window) new ResizeObserver(scheduleResize).observe(container);
window.addEventListener('resize', scheduleResize);
window.addEventListener('orientationchange', scheduleResize);
window.visualViewport?.addEventListener('resize', scheduleResize);
applyResize();

// ---- visibility / focus (FR12) ---------------------------------------------------------
function onHidden() {
  if (game.state === State.PLAYING) game.pause();
  input.reset();
  stepper.reset();
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') onHidden();
  else stepper.reset(); // stays PAUSED until the player resumes
});
window.addEventListener('pagehide', onHidden);
window.addEventListener('blur', () => input.reset());

// ---- optional FPS readout (?debug) -------------------------------------------------------
const debug = new URLSearchParams(window.location.search).has('debug');
const fpsEl = document.getElementById('fps');
fpsEl.hidden = !debug;
let fpsTimer = 0;
function updateFps(frameDt) {
  fpsTimer += frameDt;
  if (fpsTimer < 0.5) return;
  fpsTimer = 0;
  const ms = renderer.averageFrameMs;
  const fps = ms > 0 ? (1000 / ms).toFixed(0) : '–';
  const ratio = Math.min(window.devicePixelRatio || 1, renderer.dprCap).toFixed(2);
  fpsEl.textContent = `FPS ${fps} · ${ms.toFixed(1)} ms · DPR ${ratio}${renderer.degraded ? ' (降级)' : ''}`;
}

// ---- main loop -------------------------------------------------------------------------
let carriedDrag = 0;
renderer.setAnimationLoop((t) => {
  const frameDt = stepper.frame(t);
  const steps = stepper.consume();
  const s = input.sample();
  const drag = s.dragAngle + carriedDrag;
  carriedDrag = 0;
  if (steps === 0) {
    if (game.state === State.PLAYING) carriedDrag = drag; // keep it for the next simulated frame
  } else {
    for (let i = 0; i < steps; i++) {
      game.update(CONFIG.SIM_STEP, { axis: s.axis, dragAngle: i === 0 ? drag : 0 });
    }
  }
  renderer.render(game, frameDt);
  ui.sync(game);
  if (debug) updateFps(frameDt);
});

window.__spaceFold = { game, renderer, input };
