import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseHTML } from 'linkedom';

// DOM interaction test, not browser visual or mobile-device verification.
test('studio taps, scrolling, undo, clear, seed changes and PNG preparation work together', async () => {
  const { document, window } = parseHTML(await readFile(new URL('../site/trees/index.html', import.meta.url), 'utf8'));
  const $ = selector => document.querySelector(selector);
  globalThis.document = document;
  globalThis.devicePixelRatio = 2;
  const stored = new Map([['exbt:small-groves:v1', JSON.stringify({ version: 1, seed: 42, groves: [] })]]);
  globalThis.localStorage = { getItem: key => stored.get(key), setItem: (key, value) => stored.set(key, value) };
  const frames = new Map(); let frameId = 0;
  globalThis.requestAnimationFrame = callback => { frames.set(++frameId, callback); return frameId; };
  globalThis.ResizeObserver = class { constructor(fn) { this.fn = fn; } observe() { this.fn(); } };
  globalThis.confirm = () => true;
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { canShare: () => false } });
  const nativeTimeout = globalThis.setTimeout;
  globalThis.setTimeout = (callback, ms) => nativeTimeout(callback, ms).unref();
  for (const [id, initial] of [['#density', 'auto'], ['#palette', 'forest']]) {
    let value = initial;
    Object.defineProperty($(id), 'value', { get: () => value, set: next => { value = String(next); } });
  }
  const calls = [];
  window.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, {
    get: (_, name) => (...args) => calls.push([name, ...args]),
    set: () => true,
  });
  window.HTMLCanvasElement.prototype.toBlob = function (callback) {
    assert.equal(this.width, 2000); assert.equal(this.height, 2000);
    queueMicrotask(() => callback(new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' })));
  };
  $('#forest').getBoundingClientRect = () => ({ left: 0, top: 0, width: 350, height: 350 });
  $('#save-dialog').showModal = function () { this.setAttribute('open', ''); };
  $('#save-dialog').close = function () { this.removeAttribute('open'); };
  const fire = (element, type, details = {}) => {
    const event = new window.Event(type, { bubbles: true, cancelable: true });
    Object.assign(event, details); element.dispatchEvent(event);
  };
  const pointer = (type, x = 100, y = 100) => fire($('#forest'), type, { isPrimary: true, button: 0, pointerId: 1, clientX: x, clientY: y });
  const flush = () => { for (const fn of [...frames.values()]) fn(0); frames.clear(); };
  const scene = () => JSON.parse(stored.get('exbt:small-groves:v1'));
  await import('../src/tree-studio.js'); flush();
  assert.equal($('#tree-count').textContent, '0 trees');
  pointer('pointerdown'); pointer('pointerup'); flush();
  const count = Number($('#tree-count').textContent.split(' ')[0]);
  assert.ok(count >= 10 && count <= 20); assert.equal(scene().groves.length, 1);
  assert.equal($('#empty-hint').hidden, true);
  pointer('pointerdown'); pointer('pointercancel'); pointer('pointerup');
  pointer('pointerdown'); pointer('pointerup', 100, 200);
  assert.equal(scene().groves.length, 1, 'scroll cancellation and drags must not plant');
  fire($('#undo'), 'click'); flush();
  assert.equal(scene().groves.length, 0);
  fire($('#forest'), 'keydown', { key: 'Enter' }); flush();
  assert.equal(scene().groves.length, 1, 'keyboard planting should work');
  const planted = structuredClone(scene().groves);
  fire($('#next-seed'), 'click'); flush();
  assert.equal(scene().seed, 43); assert.deepEqual(scene().groves, planted);
  fire($('#save'), 'click');
  await new Promise(resolve => setImmediate(resolve));
  assert.ok($('#save-dialog').hasAttribute('open'));
  assert.match($('#download-image').href, /^blob:/);
  assert.match($('#saved-image').src, /^blob:/);
  assert.equal($('#share-image').hidden, true);
  fire($('#clear'), 'click'); assert.equal(scene().groves.length, 1, 'first clear asks for confirmation');
  fire($('#clear'), 'click'); flush();
  assert.equal(scene().groves.length, 0); assert.equal($('#empty-hint').hidden, false);
  assert.ok(calls.some(c => c[0] === 'fillRect'));
  assert.equal(frames.size, 0, 'no continuous render loop while idle');
  URL.revokeObjectURL($('#download-image').href);
});
