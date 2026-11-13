import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { applyBorder, borderSettings, initBorderEditor, publishUrl, validBorderSettings } from '../src/borders.js';
import { backColor } from '../src/photo-colors.js';

const catalog = JSON.parse(await readFile(new URL('../site/gallery.json', import.meta.url), 'utf8'));

test('border width and colour preview update front and back without modifying photo records', () => {
  const item = structuredClone(catalog.items['blue-seascape']);
  const original = JSON.stringify(item);
  const properties = new Map();
  const tile = { style: { setProperty: (key, value) => properties.set(key, value) } };
  assert.equal(applyBorder(tile, item, { insetPercent: 12, frameColor: '#f5f5f0' }), '#f5f5f0');
  assert.equal(properties.get('--inset'), '12%');
  assert.equal(properties.get('--card-color'), '#f5f5f0');
  assert.equal(applyBorder(tile, item, { insetPercent: 0, frameColor: '#ff0000' }), item.colors.edge);
  assert.equal(JSON.stringify(item), original, 'preview must not rewrite saved metadata');
});

test('frameless backs use edge colour while whole-photo palette remains available', () => {
  for (const item of Object.values(catalog.items).filter(item => item.type === 'photo')) {
    assert.match(item.colors.edge, /^#[0-9a-f]{6}$/);
    assert.equal(item.colors.edgeBandPercent, 5);
    assert.ok(item.colors.edgePalette.length > 0);
    assert.ok(item.colors.palette.length > 0);
    assert.equal(backColor({ ...item.colors, frame: null }), item.colors.edge);
  }
  const canopy = catalog.items.canopy;
  assert.equal(borderSettings(canopy).frameColor, canopy.colors.edge);
});

test('publish link contains only a scoped border update and opens GitHub confirmation', () => {
  const item = catalog.items['red-fish'];
  const url = new URL(publishUrl(item, { insetPercent: 3, frameColor: '#000000' }));
  assert.equal(url.origin, 'https://github.com');
  assert.equal(url.pathname, '/ayushpat123/exhibition/issues/new');
  assert.equal(url.searchParams.get('title'), `EXBT borders: ${item.title}`);
  const payload = JSON.parse(url.searchParams.get('body').match(/```json\n([\s\S]*?)\n```/)[1]);
  assert.deepEqual(payload, { schemaVersion: 1, itemId: 'red-fish', insetPercent: 3, frameColor: '#000000' });
  assert.equal(url.searchParams.get('body').includes('14:28'), false, 'capture metadata should not be resubmitted');
});

test('invalid widths and colours cannot be previewed or published', () => {
  for (const settings of [null, {}, { insetPercent: -1, frameColor: '#000000' }, { insetPercent: 31, frameColor: '#000000' }, { insetPercent: NaN, frameColor: '#000000' }, { insetPercent: 6, frameColor: 'red' }, { insetPercent: 6, frameColor: '#000000;display:none' }]) {
    assert.ok(!validBorderSettings(settings));
    assert.throws(() => publishUrl(catalog.items['red-fish'], settings));
  }
});

test('unsupported native dialogs leave the gallery usable without editing controls', () => {
  assert.equal(initBorderEditor({ querySelector: () => ({}) }), undefined);
});
