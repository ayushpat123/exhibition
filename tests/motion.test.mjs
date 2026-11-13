import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGallery, drawWaves, drawParticles } from '../src/motion.js';

function context() {
  const calls = [];
  return new Proxy({ calls }, {
    get(target, key) {
      if (key in target) return target[key];
      return (...args) => {
        for (const arg of args) if (typeof arg === 'number') assert.ok(Number.isFinite(arg), `${key} received ${arg}`);
        calls.push([key, ...args]);
      };
    },
  });
}
function eventTarget(extra = {}) {
  const listeners = new Map();
  return Object.assign({
    addEventListener(name, fn) { listeners.set(name, fn); },
    removeEventListener(name) { listeners.delete(name); },
    fire(name, event = {}) { listeners.get(name)?.(event); },
    listeners,
  }, extra);
}
function environment(reducedMotion = false) {
  const frames = new Map();
  let id = 0;
  const preference = eventTarget({ matches: reducedMotion });
  globalThis.window = eventTarget({
    devicePixelRatio: 3,
    matchMedia: () => preference,
    requestAnimationFrame(fn) { frames.set(++id, fn); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
  });
  globalThis.document = eventTarget({ hidden: false, createElement: () => canvas('particles') });
  const observers = [];
  globalThis.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  };
  globalThis.ResizeObserver = class extends IntersectionObserver {};
  return {
    frames, preference, observers,
    visible(canvases, value = true) { observers[0].callback(canvases.map(target => ({ target, isIntersecting: value }))); },
    step(now) { const callbacks = [...frames.values()]; frames.clear(); for (const fn of callbacks) fn(now); },
  };
}
function canvas(kind) {
  const ctx = context();
  const bounds = { width: 300, height: 300, left: 10, top: 20 };
  return eventTarget({ dataset: { art: kind }, width: 0, height: 0, ctx, bounds,
    getContext: () => ctx, getBoundingClientRect: () => bounds,
  });
}

test('waves draw a valid first frame without pointer input', () => {
  const ctx = context();
  drawWaves(ctx, 650, 650, 0, { x: 0.5, y: 0.5 }, () => 0.2);
  assert.equal(ctx.calls.filter(c => c[0] === 'moveTo').length, 10);
  assert.equal(ctx.calls.filter(c => c[0] === 'stroke').length, 1);
});

test('only visible animations run, using a single shared frame loop', () => {
  const env = environment();
  const canvases = [canvas('waves'), canvas('particles')];
  const gallery = createGallery(canvases);
  assert.equal(env.frames.size, 0);
  env.visible(canvases);
  assert.equal(env.frames.size, 1);
  env.step(0);
  assert.equal(env.frames.size, 1);
  env.visible(canvases, false);
  assert.equal(env.frames.size, 0);
  env.visible([canvases[0]]);
  assert.equal(env.frames.size, 1);
  const before = canvases[1].ctx.calls.length;
  env.step(100);
  assert.equal(canvases[1].ctx.calls.length, before);
  gallery.destroy();
  assert.equal(env.frames.size, 0);
  assert.ok(env.observers.every(o => o.disconnected));
  assert.equal(canvases[0].listeners.size, 0);
});

test('hidden tabs cancel animation and resume without a catch-up burst', () => {
  const env = environment();
  const c = canvas('particles');
  const gallery = createGallery([c]);
  env.visible([c]); env.step(0);
  document.hidden = true; document.fire('visibilitychange');
  assert.equal(env.frames.size, 0);
  document.hidden = false; document.fire('visibilitychange');
  const before = c.ctx.calls.filter(x => x[0] === 'arc').length;
  env.step(60000);
  assert.ok(c.ctx.calls.filter(x => x[0] === 'arc').length - before <= 2);
  gallery.destroy();
});

test('reduced motion paints both artworks but does not schedule animation', () => {
  const env = environment(true);
  const canvases = [canvas('waves'), canvas('particles')];
  const gallery = createGallery(canvases);
  env.visible(canvases);
  assert.equal(gallery.paused, true);
  assert.equal(env.frames.size, 0);
  assert.ok(canvases[0].ctx.calls.some(x => x[0] === 'stroke'));
  assert.ok(canvases[1].ctx.calls.some(x => x[0] === 'arc'));
  gallery.setPaused(false);
  assert.equal(env.frames.size, 1);
  gallery.setPaused(true);
  assert.equal(env.frames.size, 0);
  env.preference.matches = false; env.preference.fire('change');
  assert.equal(gallery.paused, true, 'OS changes must not override an explicit pause');
  gallery.destroy();
});

test('live OS motion preferences update the gallery until the user overrides them', () => {
  const env = environment();
  const c = canvas('waves'); const gallery = createGallery([c]);
  let updates = 0; gallery.onPauseChange = () => updates++;
  env.visible([c]);
  env.preference.matches = true; env.preference.fire('change');
  assert.equal(env.frames.size, 0); assert.equal(gallery.paused, true); assert.equal(updates, 1);
  env.preference.matches = false; env.preference.fire('change');
  assert.equal(env.frames.size, 1); assert.equal(updates, 2);
  gallery.destroy();
});

test('resize caps resolution and preserves accumulated particles', () => {
  const env = environment(); const c = canvas('particles');
  const gallery = createGallery([c]);
  assert.equal(c.width, 600); assert.equal(c.height, 600);
  const calls = c.ctx.calls.length;
  env.observers[1].callback([{ target: c }]);
  assert.equal(c.ctx.calls.length, calls, 'unchanged sizes should not redraw');
  c.bounds.width = 500;
  env.observers[1].callback([{ target: c }]);
  assert.equal(c.width, 1000);
  assert.ok(c.ctx.calls.some(x => x[0] === 'drawImage'));
  gallery.destroy();
});

test('touch and pointer interaction updates a paused wave without starting a loop', () => {
  const env = environment(true); const c = canvas('waves');
  const gallery = createGallery([c]);
  const before = c.ctx.calls.length;
  c.fire('pointerdown', { currentTarget: c, clientX: 310, clientY: 320 });
  assert.ok(c.ctx.calls.length > before); assert.equal(env.frames.size, 0);
  gallery.destroy();
});

test('particle generation scales with elapsed time rather than screen refresh rate', () => {
  const random = () => 0.5;
  const a = context(); const b = context();
  for (let i = 0; i < 60; i++) drawParticles(a, 300, 300, 1 / 60, random);
  for (let i = 0; i < 30; i++) drawParticles(b, 300, 300, 1 / 30, random);
  assert.equal(a.calls.filter(x => x[0] === 'arc').length, 120);
  assert.equal(b.calls.filter(x => x[0] === 'arc').length, 120);
});

test('high-refresh displays do not multiply drawing work', () => {
  const env = environment(); const c = canvas('waves');
  const gallery = createGallery([c]); env.visible([c]);
  const before = c.ctx.calls.filter(x => x[0] === 'stroke').length;
  for (let i = 0; i < 120; i++) env.step(i * 1000 / 120);
  const rendered = c.ctx.calls.filter(x => x[0] === 'stroke').length - before;
  assert.equal(rendered, 60);
  gallery.destroy();
});

test('vertical pointer limits wave displacement to 5–25 percent without changing horizontal frequency', () => {
  const height = 600;
  for (const y of [0, 0.5, 1]) {
    const ctx = context();
    drawWaves(ctx, 600, height, 0, { x: 0.5, y }, () => 1);
    const firstPoint = ctx.calls.find(call => call[0] === 'moveTo');
    const expected = y === 0 ? 30 : y === 0.5 ? 90 : 150;
    assert.ok(Math.abs(firstPoint[2] - expected) < 1e-9);
  }
  const samples = [];
  for (const x of [0, 1]) {
    let lastX;
    drawWaves(context(), 600, height, 0, { x, y: 0.5 }, inputX => { lastX = inputX; return 0; });
    samples.push(lastX);
  }
  assert.deepEqual(samples, [0.5, 2]);
});
