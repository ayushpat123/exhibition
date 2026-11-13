import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { applyBorderRequest, authorizeBorderEvent, borderRequestFromEvent, validateBorderRequest } from '../scripts/apply-border-update.mjs';

const catalog = JSON.parse(await readFile(new URL('../site/gallery.json', import.meta.url), 'utf8'));
const request = { schemaVersion: 1, itemId: 'blue-seascape', insetPercent: 6, frameColor: '#000000' };
function fixture() {
  const environment = {
    GITHUB_REPOSITORY: 'ayushpat123/exhibition', GITHUB_REPOSITORY_OWNER: 'ayushpat123',
    GITHUB_ACTOR: 'ayushpat123', GITHUB_TRIGGERING_ACTOR: 'ayushpat123',
    GITHUB_REF: 'refs/heads/master', GITHUB_EVENT_NAME: 'workflow_dispatch',
  };
  const event = {
    repository: { full_name: 'ayushpat123/exhibition', owner: { login: 'ayushpat123' } },
    sender: { login: 'ayushpat123' },
    inputs: { photo: 'Blue boat — Reinebringen', width: 'Medium', colour: 'Black' },
  };
  return { event, environment };
}

test('only the signed-in owner may use the settings form on master', () => {
  const { event, environment } = fixture();
  assert.deepEqual(borderRequestFromEvent(event, environment, catalog), request);
  for (const key of ['GITHUB_REPOSITORY', 'GITHUB_REPOSITORY_OWNER', 'GITHUB_ACTOR', 'GITHUB_TRIGGERING_ACTOR', 'GITHUB_REF']) {
    assert.throws(() => authorizeBorderEvent(event, { ...environment, [key]: 'visitor' }), key);
  }
  const outsider = structuredClone(event); outsider.sender.login = 'visitor';
  assert.throws(() => authorizeBorderEvent(outsider, environment));
  const wrongOwner = structuredClone(event); wrongOwner.repository.owner.login = 'visitor';
  assert.throws(() => authorizeBorderEvent(wrongOwner, environment));
  for (const type of ['issues', 'pull_request', 'push']) {
    assert.throws(() => borderRequestFromEvent(event, { ...environment, GITHUB_EVENT_NAME: type }, catalog));
  }
});

test('owner form presets, custom values and keep-current settings resolve correctly', () => {
  const { event, environment } = fixture();
  for (const [width, expected] of [['None', 0], ['Thin', 3], ['Medium', 6], ['Wide', 12], ['Narrow — 3% (9 px)', 3], ['Medium — 6% (18 px)', 6], ['Wide — 12% (36 px)', 12], ['Extra wide — 20% (60 px)', 20], ['Very wide — 30% (90 px)', 30]]) {
    const next = borderRequestFromEvent({ ...event, inputs: { ...event.inputs, width } }, environment, catalog);
    assert.equal(next.insetPercent, expected);
  }
  const edge = borderRequestFromEvent({ ...event, inputs: { ...event.inputs, colour: 'From edges' } }, environment, catalog);
  assert.equal(edge.frameColor, catalog.items['blue-seascape'].colors.edge);
  const current = borderRequestFromEvent({ ...event, inputs: { ...event.inputs, width: 'Keep current', colour: 'Keep current' } }, environment, catalog);
  assert.deepEqual(applyBorderRequest(catalog, current), catalog);
  const custom = borderRequestFromEvent({ ...event, inputs: { ...event.inputs, width: 'Custom', custom_width: '9.5', colour: 'Custom', custom_colour: '#AABBCC' } }, environment, catalog);
  assert.equal(custom.insetPercent, 9.5); assert.equal(custom.frameColor, '#aabbcc');
  const largest = borderRequestFromEvent({ ...event, inputs: { ...event.inputs, width: 'Custom', custom_width: '45' } }, environment, catalog);
  assert.equal(applyBorderRequest(catalog, largest).items['blue-seascape'].layout.insetPercent, 45);
  for (const inputs of [
    { ...event.inputs, photo: 'Unknown' }, { ...event.inputs, width: 'Huge' },
    { ...event.inputs, colour: 'Unknown' }, { ...event.inputs, extra: true },
    { ...event.inputs, width: 'Custom', custom_width: '' },
    { ...event.inputs, width: 'Custom', custom_width: '45.01' },
    { ...event.inputs, width: 'Custom', custom_width: '$(echo unsafe)' },
    { ...event.inputs, colour: 'Custom', custom_colour: 'red;display:none' },
  ]) assert.throws(() => borderRequestFromEvent({ ...event, inputs }, environment, catalog));
});

test('border JSON accepts only the precise safe shape and bounded values', () => {
  for (const invalid of [
    null, [], { ...request, schemaVersion: 2 }, { ...request, extra: true },
    { ...request, itemId: '__proto__' }, { ...request, itemId: '$(echo unsafe)' },
    { ...request, insetPercent: -1 }, { ...request, insetPercent: 45.01 },
    { ...request, insetPercent: Infinity }, { ...request, insetPercent: '6' },
    { ...request, frameColor: '#000' }, { ...request, frameColor: 'red; color: white' },
  ]) assert.throws(() => validateBorderRequest(invalid));
  for (const insetPercent of [0, 6.25, 30, 40, 45]) assert.equal(validateBorderRequest({ ...request, insetPercent }).insetPercent, insetPercent);
  assert.equal(validateBorderRequest({ ...request, frameColor: '#AABBCC' }).frameColor, '#aabbcc');
});

test('publishing changes exactly the selected inset/frame and preserves capture, notes, colours, images and grouping', () => {
  const originalInset = catalog.items['blue-seascape'].layout.insetPercent;
  const next = applyBorderRequest(catalog, { ...request, insetPercent: 12, frameColor: '#ABCDEF' });
  const expected = structuredClone(catalog);
  expected.items['blue-seascape'].layout.insetPercent = 12;
  expected.items['blue-seascape'].colors.frame = '#abcdef';
  assert.deepEqual(next, expected);
  assert.equal(catalog.items['blue-seascape'].layout.insetPercent, originalInset, 'source catalogue is immutable');
  assert.deepEqual(next.groups['blue-pair'].members, ['tiles', 'blue-seascape']);
});

test('zero inset removes frame colour, no-op requests are stable, and non-photo IDs cannot publish', () => {
  const next = applyBorderRequest(catalog, { ...request, insetPercent: 0, frameColor: '#123456' });
  assert.equal(next.items['blue-seascape'].colors.frame, null);
  assert.equal(next.items['blue-seascape'].layout.insetPercent, 0);
  const current = catalog.items['blue-seascape'];
  const noop = { ...request, insetPercent: current.layout.insetPercent, frameColor: current.colors.frame ?? current.colors.base };
  assert.deepEqual(applyBorderRequest(catalog, noop), catalog);
  for (const itemId of ['missing-photo', 'waves', 'particles', 'archive', 'blue-pair']) {
    assert.throws(() => applyBorderRequest(catalog, { ...request, itemId }));
  }
});


test('CLI rejects an outsider without modifying the catalogue and writes only validated owner changes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'exbt-border-publish-'));
  try {
    await mkdir(join(directory, 'site'));
    const path = join(directory, 'site/gallery.json');
    const before = JSON.stringify(catalog, null, 2) + '\n';
    await writeFile(path, before);
    const { event, environment } = fixture();
    event.inputs = { photo: 'Blue boat — Reinebringen', width: 'Custom', custom_width: '9.5', colour: 'Custom', custom_colour: '#AABBCC' };
    const eventPath = join(directory, 'event.json');
    const outputPath = join(directory, 'output');
    await writeFile(eventPath, JSON.stringify(event));
    const script = fileURLToPath(new URL('../scripts/apply-border-update.mjs', import.meta.url));
    const options = { cwd: directory, env: { ...process.env, ...environment, GITHUB_EVENT_PATH: eventPath, GITHUB_OUTPUT: outputPath }, encoding: 'utf8' };
    const rejected = spawnSync(process.execPath, [script], { ...options, env: { ...options.env, GITHUB_ACTOR: 'visitor' } });
    assert.equal(rejected.status, 1);
    assert.equal(await readFile(path, 'utf8'), before);
    const accepted = spawnSync(process.execPath, [script], options);
    assert.equal(accepted.status, 0, accepted.stderr);
    const updated = JSON.parse(await readFile(path, 'utf8'));
    const expected = structuredClone(catalog);
    expected.items['blue-seascape'].layout.insetPercent = 9.5;
    expected.items['blue-seascape'].colors.frame = '#aabbcc';
    assert.deepEqual(updated, expected);
    assert.match(await readFile(outputPath, 'utf8'), /^changed=true\nitem_id=blue-seascape\n$/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
