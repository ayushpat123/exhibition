import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initPhotos } from '../src/photos.js';
import { backColor, contrastRatio, noteColor } from '../src/photo-colors.js';
import { renderGallery, serializeCatalog, validateCatalog } from '../scripts/render-gallery.mjs';

const catalog = JSON.parse(await readFile(new URL('../site/gallery.json', import.meta.url), 'utf8'));

test('backs use exact frame colours, falling back to the image base when frameless', () => {
  assert.equal(backColor({ frame: '#000000', base: '#456789' }), '#000000');
  assert.equal(backColor({ frame: null, base: '#456789' }), '#456789');
  for (const item of Object.values(catalog.items).filter(item => item.type === 'photo')) {
    const surface = backColor(item.colors);
    assert.ok(contrastRatio(surface, noteColor(surface)) >= 4.5, item.id);
  }
  for (let grey = 0; grey <= 255; grey++) {
    const hex = '#' + grey.toString(16).padStart(2, '0').repeat(3);
    assert.ok(contrastRatio(hex, noteColor(hex)) >= 4.5, hex);
  }
});

test('catalog separates stable IDs, layout groups, notes, and sortable colours', () => {
  validateCatalog(catalog);
  assert.deepEqual(catalog.groups['blue-pair'].members, ['tiles', 'blue-seascape']);
  const reordered = structuredClone(catalog);
  reordered.order.reverse();
  validateCatalog(reordered);
  assert.deepEqual(reordered.items, catalog.items, 'reordering must not rewrite notes or photo metadata');
  assert.match(renderGallery(reordered), /data-group-id="blue-pair"/);
});

test('layout validation catches duplicate or omitted cards', () => {
  const duplicate = structuredClone(catalog);
  duplicate.order.push('blue-seascape');
  assert.throws(() => validateCatalog(duplicate), /Duplicate layout item/);
  const missing = structuredClone(catalog);
  missing.order = missing.order.filter(id => id !== 'red-fish');
  assert.throws(() => validateCatalog(missing), /Item missing from layout/);
});

test('published notes are escaped and metadata cannot close the JSON script', () => {
  const edited = structuredClone(catalog);
  edited.items['red-fish'].notes = '<script>alert("x")</script>\nA quiet red wall.';
  const html = renderGallery(edited);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(serializeCatalog(edited), /</);
  assert.equal(JSON.parse(serializeCatalog(edited)).items['red-fish'].notes, edited.items['red-fish'].notes);
});

function attributes(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getAttribute: name => values.get(name), setAttribute: (name, value) => values.set(name, value) };
}
function photo() {
  const faces = { '.photo-front': attributes({ 'aria-hidden': 'false' }), '.photo-back': attributes({ 'aria-hidden': 'true' }), '.photo-copy': { textContent: 'Blue sea. Across the water.' } };
  const listeners = new Map();
  return Object.assign(attributes({ 'aria-pressed': 'false' }), {
    disabled: true, dataset: { title: 'Blue sea' }, faces, listeners,
    querySelector: name => faces[name],
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: name => listeners.delete(name),
    fire(name, extra = {}) { listeners.get(name)?.({ currentTarget: this, ...extra }); },
  });
}

test('tap flips a photo, reveals notes accessibly, and taps back without moving focus', () => {
  const button = photo(); const cleanup = initPhotos({ querySelectorAll: () => [button] });
  assert.equal(button.disabled, false);
  button.fire('click');
  assert.equal(button.getAttribute('aria-pressed'), 'true');
  assert.equal(button.faces['.photo-front'].getAttribute('aria-hidden'), 'true');
  assert.equal(button.faces['.photo-back'].getAttribute('aria-hidden'), 'false');
  assert.match(button.getAttribute('aria-label'), /Across the water/);
  button.fire('click');
  assert.equal(button.getAttribute('aria-pressed'), 'false');
  assert.equal(button.getAttribute('aria-label'), 'Show notes for Blue sea');
  cleanup(); assert.equal(button.disabled, true); assert.equal(button.listeners.size, 0);
});

test('Escape restores the image and flipping one card leaves another alone', () => {
  const a = photo(), b = photo();
  const cleanup = initPhotos({ querySelectorAll: () => [a, b] });
  a.fire('click');
  assert.equal(b.getAttribute('aria-pressed'), 'false');
  a.fire('keydown', { key: 'Escape' });
  assert.equal(a.getAttribute('aria-pressed'), 'false');
  cleanup();
});
