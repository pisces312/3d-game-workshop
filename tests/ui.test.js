// Happy-path + edge tests for the DOM/audio components (UIManager, Sfx) using light fakes,
// so they run in the Node test environment without a browser.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UIManager } from '../src/ui/UIManager.js';
import { Sfx } from '../src/audio/Sfx.js';

class FakeElement extends EventTarget {
  constructor() {
    super();
    this.textContent = '';
    this.hidden = false;
    this.disabled = false;
    this.offsetWidth = 0;
    this.attrs = {};
    const classes = new Set();
    this.classList = {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c),
      toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)),
    };
  }
  setAttribute(k, v) {
    this.attrs[k] = v;
  }
  blur() {}
  click() {
    this.dispatchEvent(new Event('click'));
  }
}

const IDS = [
  'score', 'hud-best', 'ready-best', 'btn-pause', 'btn-mute', 'overlay-ready', 'overlay-paused',
  'overlay-over', 'btn-start', 'btn-resume', 'btn-restart-paused', 'btn-restart', 'final-score',
  'over-best', 'new-badge', 'flash', 'toast', 'service-pop', 'hud-region', 'over-region',
];

function fakeDocument() {
  const nodes = Object.fromEntries(IDS.map((id) => [id, new FakeElement()]));
  return { nodes, getElementById: (id) => nodes[id] ?? null };
}

describe('UIManager', () => {
  let doc;
  let calls;
  let ui;

  beforeEach(() => {
    vi.useFakeTimers();
    doc = fakeDocument();
    calls = [];
    const cb = (name) => () => calls.push(name);
    ui = new UIManager({
      root: doc,
      callbacks: {
        onStart: cb('start'),
        onPause: cb('pause'),
        onResume: cb('resume'),
        onRestart: cb('restart'),
        onToggleMute: cb('mute'),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('buttons emit intents through callbacks only', () => {
    doc.nodes['btn-start'].click();
    doc.nodes['btn-pause'].click();
    doc.nodes['btn-resume'].click();
    doc.nodes['btn-restart-paused'].click();
    doc.nodes['btn-mute'].click();
    expect(calls).toEqual(['start', 'pause', 'resume', 'restart', 'mute']);
  });

  it('sync shows the right overlay per state and writes the score', () => {
    ui.sync({ state: 'READY', score: 0 });
    expect(doc.nodes['overlay-ready'].classList.contains('is-visible')).toBe(true);
    ui.sync({ state: 'PLAYING', score: 3 });
    expect(doc.nodes.score.textContent).toBe('3');
    expect(doc.nodes['overlay-ready'].classList.contains('is-visible')).toBe(false);
    expect(doc.nodes['btn-pause'].hidden).toBe(false);
    ui.sync({ state: 'PAUSED', score: 3 });
    expect(doc.nodes['overlay-paused'].classList.contains('is-visible')).toBe(true);
    expect(doc.nodes['btn-pause'].hidden).toBe(true);
  });

  it('GAME_OVER panel appears after the flash delay and only then allows restart', () => {
    ui.setGameOverData({ score: 14, best: 14, isNew: true, region: 'us-west-2' });
    ui.sync({ state: 'GAME_OVER', score: 14 });
    expect(ui.restartReady).toBe(false);
    doc.nodes['btn-restart'].click();
    expect(calls).toEqual([]); // guarded: too early
    vi.advanceTimersByTime(460);
    expect(ui.restartReady).toBe(true);
    expect(doc.nodes['overlay-over'].classList.contains('is-visible')).toBe(true);
    expect(doc.nodes['final-score'].textContent).toBe('14');
    expect(doc.nodes['over-best'].textContent).toBe('14');
    expect(doc.nodes['new-badge'].hidden).toBe(false);
    expect(doc.nodes['over-region'].textContent).toBe('us-west-2');
    doc.nodes['btn-restart'].click();
    expect(calls).toEqual(['restart']);
  });

  it('leaving GAME_OVER before the delay cancels the panel', () => {
    ui.sync({ state: 'GAME_OVER', score: 1 });
    ui.sync({ state: 'PLAYING', score: 0 });
    vi.advanceTimersByTime(1000);
    expect(doc.nodes['overlay-over'].classList.contains('is-visible')).toBe(false);
    expect(ui.restartReady).toBe(false);
  });

  it('setBest, toast and flash update the DOM', () => {
    ui.setBest(21);
    expect(doc.nodes['hud-best'].textContent).toBe('21');
    expect(doc.nodes['ready-best'].textContent).toBe('21');
    ui.toast('空间扭曲！');
    expect(doc.nodes.toast.classList.contains('is-visible')).toBe(true);
    vi.advanceTimersByTime(2000);
    expect(doc.nodes.toast.classList.contains('is-visible')).toBe(false);
    ui.flash();
    expect(doc.nodes.flash.classList.contains('is-active')).toBe(true);
  });

  it('servicePop shows the service text and restarts its animation', () => {
    ui.servicePop('+1 Lambda');
    expect(doc.nodes['service-pop'].textContent).toBe('+1 Lambda');
    expect(doc.nodes['service-pop'].classList.contains('is-active')).toBe(true);
    ui.servicePop('+1 S3');
    expect(doc.nodes['service-pop'].textContent).toBe('+1 S3');
    expect(doc.nodes['service-pop'].classList.contains('is-active')).toBe(true);
  });

  it('setRegion updates the HUD and is the default for the GAME_OVER region', () => {
    ui.setRegion('us-east-1');
    expect(doc.nodes['hud-region'].textContent).toBe('🌐 us-east-1');
    ui.setRegion('eu-west-1');
    expect(doc.nodes['hud-region'].textContent).toBe('🌐 eu-west-1');
    ui.setGameOverData({ score: 10, best: 12, isNew: false });
    ui.sync({ state: 'GAME_OVER', score: 10 });
    vi.advanceTimersByTime(460);
    expect(doc.nodes['over-region'].textContent).toBe('eu-west-1');
  });

  it('index.html carries the AWS Edition copy and AI-DLC credit', async () => {
    const { readFileSync } = await import('node:fs');
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    expect(html).toContain('AWS Edition · Built with AI-DLC');
    expect(html).toContain('Bolt 小橙');
    expect(html).toContain('Built with AI-DLC · 可部署到 Amazon S3 + CloudFront');
    for (const id of ['service-pop', 'hud-region', 'over-region']) expect(html).toContain(`id="${id}"`);
  });

  it('fails fast when index.html is missing an element', () => {
    const broken = { getElementById: () => null };
    expect(() => new UIManager({ root: broken })).toThrow(/missing #score/);
    expect(() => new UIManager({ root: null })).toThrow(TypeError);
  });
});

function fakeAudioContextClass(log) {
  const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} });
  return class FakeAudioContext {
    constructor() {
      this.state = 'suspended';
      this.currentTime = 0;
      this.destination = {};
      log.contexts++;
    }
    resume() {
      this.state = 'running';
      return Promise.resolve();
    }
    createGain() {
      return { gain: param(), connect() {} };
    }
    createOscillator() {
      log.oscillators++;
      return { type: '', frequency: param(), connect() {}, start() {}, stop() {} };
    }
  };
}

describe('Sfx', () => {
  it('creates the AudioContext lazily on unlock and plays tones', () => {
    const log = { contexts: 0, oscillators: 0 };
    const sfx = new Sfx({ AudioContextClass: fakeAudioContextClass(log) });
    sfx.pass(); // before unlock: silent no-op
    expect(log).toEqual({ contexts: 0, oscillators: 0 });
    sfx.unlock();
    sfx.unlock();
    expect(log.contexts).toBe(1);
    sfx.pass();
    sfx.hit();
    sfx.start();
    expect(log.oscillators).toBe(5);
  });

  it('muted produces no sound', () => {
    const log = { contexts: 0, oscillators: 0 };
    const sfx = new Sfx({ AudioContextClass: fakeAudioContextClass(log) });
    sfx.unlock();
    sfx.setMuted(true);
    expect(sfx.muted).toBe(true);
    sfx.pass();
    expect(log.oscillators).toBe(0);
  });

  it('missing or broken Web Audio never throws', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const none = new Sfx({ AudioContextClass: undefined });
    expect(() => {
      none.unlock();
      none.pass();
    }).not.toThrow();
    const broken = new Sfx({
      AudioContextClass: class {
        constructor() {
          throw new Error('NotAllowedError');
        }
      },
    });
    expect(() => {
      broken.unlock();
      broken.hit();
    }).not.toThrow();
    expect(broken.available).toBe(false);
    warn.mockRestore();
  });
});
