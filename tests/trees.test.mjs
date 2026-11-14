import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, MAX_GROVES, makeGrove, randomFromSeed, renderForest, sceneTrees, treeGeometry, validateScene } from '../src/trees.js';
const gesture = { x: 500, y: 500, ...DEFAULTS };

test('every tap plants between ten and twenty different trees reproducibly', () => {
  for (let seed = 0; seed < 200; seed++) {
    const trees = makeGrove(seed, 0, gesture);
    assert.ok(trees.length >= 10 && trees.length <= 20);
    assert.deepEqual(trees, makeGrove(seed, 0, gesture));
    assert.ok(new Set(trees.map(t => t.height)).size > 5);
    assert.ok(new Set(trees.map(t => t.hue)).size > 5);
  }
  assert.notDeepEqual(makeGrove(1, 0, gesture), makeGrove(2, 0, gesture));
  const values = Array.from({ length: 100 }, randomFromSeed(0));
  assert.ok(values.every(n => n >= 0 && n < 1));
});

test('fixed brush counts and palettes are respected, with bounded trees near canvas edges', () => {
  for (const count of ['10', '15', '20']) {
    for (const [x, y] of [[0, 0], [1000, 1000], [0, 1000], [1000, 0]]) {
      const trees = makeGrove(42, 4, { ...gesture, count, x, y, size: 110, spread: 160 });
      assert.equal(trees.length, Number(count));
      for (const t of trees) {
        assert.ok(t.x >= 0 && t.x <= 1000 && t.y >= 0 && t.y <= 1000);
        for (const face of treeGeometry(t)) for (const point of face.points) {
          assert.ok(point.every(Number.isFinite));
          assert.ok(point[0] >= 0 && point[0] <= 1000 && point[1] >= 0 && point[1] <= 1000);
        }
      }
    }
  }
});

test('mesh faces and lighting are deterministic and both species have real facets', () => {
  const trees = makeGrove(12345, 0, gesture);
  assert.deepEqual(new Set(trees.map(t => t.species)), new Set(['fir', 'broadleaf']));
  for (const tree of trees) {
    const mesh = treeGeometry(tree);
    assert.deepEqual(mesh, treeGeometry(tree));
    assert.ok(mesh.length >= 15);
    assert.ok(new Set(mesh.map(face => face.color)).size > 5);
  }
});

test('editable scenes validate before loading and undo preserves earlier groves exactly', () => {
  const scene = { version: 1, seed: 12345, groves: [gesture, { ...gesture, x: 700, y: 650 }] };
  assert.equal(validateScene(JSON.parse(JSON.stringify(scene))), true);
  const original = sceneTrees({ ...scene, groves: [gesture] });
  scene.groves.pop();
  assert.deepEqual(sceneTrees(scene), original);
  for (const bad of [null, {}, { ...scene, seed: -1 }, { ...scene, seed: 4294967296 }, { ...scene, groves: Array(MAX_GROVES + 1).fill(gesture) }, { ...scene, groves: [{ ...gesture, x: Infinity }] }, { ...scene, groves: [{ ...gesture, palette: '__proto__' }] }, { ...scene, groves: [{ ...gesture, count: '20000' }] }]) assert.equal(validateScene(bad), false);
});

test('export has a white background and draws the same scene at any output resolution', () => {
  const calls = [];
  const ctx = new Proxy({}, { get: (_, key) => (...args) => calls.push([key, ...args]), set: (_, key, value) => { calls.push([key, value]); return true; } });
  renderForest(ctx, makeGrove(3, 0, gesture), 2000);
  assert.deepEqual(calls.find(c => c[0] === 'setTransform'), ['setTransform', 2, 0, 0, 2, 0, 0]);
  assert.deepEqual(calls.find(c => c[0] === 'fillStyle'), ['fillStyle', '#ffffff']);
  assert.deepEqual(calls.find(c => c[0] === 'fillRect'), ['fillRect', 0, 0, 1000, 1000]);
  assert.ok(calls.filter(c => c[0] === 'fill').length > 100);
});
