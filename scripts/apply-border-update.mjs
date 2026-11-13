import assert from 'node:assert/strict';
import { appendFile, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { validateCatalog } from './render-gallery.mjs';

const OWNER = 'ayushpat123';
const REPOSITORY = `${OWNER}/exhibition`;
const REQUEST_KEYS = ['frameColor', 'insetPercent', 'itemId', 'schemaVersion'];

export function authorizeBorderEvent(event, environment) {
  assert.equal(environment.GITHUB_REPOSITORY, REPOSITORY, 'Wrong publishing repository');
  assert.equal(environment.GITHUB_REPOSITORY_OWNER, OWNER, 'Wrong repository owner');
  assert.equal(event.repository?.full_name, REPOSITORY, 'Wrong event repository');
  assert.equal(event.repository?.owner?.login, OWNER, 'Wrong event owner');
  assert.equal(environment.GITHUB_ACTOR, OWNER, 'Only the owner may publish');
  assert.equal(environment.GITHUB_TRIGGERING_ACTOR ?? environment.GITHUB_ACTOR, OWNER, 'Only the owner may rerun publishing');
  assert.equal(event.sender?.login, OWNER, 'Only an owner event may publish');
  assert.equal(environment.GITHUB_REF, 'refs/heads/master', 'Publishing must use master');
  assert.equal(environment.GITHUB_EVENT_NAME, 'workflow_dispatch', 'Only the owner settings form may publish');
}

export function validateBorderRequest(request) {
  assert.ok(request && typeof request === 'object' && !Array.isArray(request), 'Border request must be an object');
  assert.deepEqual(Object.keys(request).sort(), REQUEST_KEYS, 'Unexpected or missing border request fields');
  assert.equal(request.schemaVersion, 1, 'Unsupported border request version');
  assert.equal(typeof request.itemId, 'string', 'Invalid photo ID');
  assert.match(request.itemId, /^[a-z][a-z0-9-]*$/, 'Invalid photo ID');
  assert.equal(typeof request.insetPercent, 'number', 'Border inset must be a number');
  assert.ok(Number.isFinite(request.insetPercent) && request.insetPercent >= 0 && request.insetPercent <= 30, 'Border inset must be between 0 and 30');
  assert.equal(typeof request.frameColor, 'string', 'Invalid frame colour');
  assert.match(request.frameColor, /^#[0-9a-f]{6}$/i, 'Frame colour must be a six-digit hex colour');
  return { ...request, frameColor: request.frameColor.toLowerCase() };
}

const PHOTOS = {
  'Blue boat — Reinebringen': 'blue-seascape', 'Red wall — Reine': 'red-fish',
  'Blue patterned tiles': 'tiles', Riverfront: 'riverfront', 'Yellow stamps': 'stamps',
  Mountains: 'mountains', Canopy: 'canopy', Dome: 'dome', Stairwell: 'stairs',
};
const WIDTHS = { None: 0, Thin: 3, Medium: 6, Wide: 12 };
const COLOURS = { Black: '#000000', Charcoal: '#111214', Ivory: '#f5f5f0' };

export function borderRequestFromEvent(event, environment, catalog) {
  authorizeBorderEvent(event, environment);
  const inputs = event.inputs;
  assert.ok(inputs && typeof inputs === 'object' && !Array.isArray(inputs), 'Missing owner settings');
  const allowed = ['photo', 'width', 'colour', 'custom_width', 'custom_colour'];
  for (const key of Object.keys(inputs)) assert.ok(allowed.includes(key), 'Unknown form field');
  assert.ok(Object.hasOwn(PHOTOS, inputs.photo), 'Unknown photo');
  const itemId = PHOTOS[inputs.photo];
  assert.ok(Object.hasOwn(catalog.items, itemId), 'Photo is missing');
  const item = catalog.items[itemId];
  let insetPercent;
  if (inputs.width === 'Keep current') insetPercent = item.layout.insetPercent;
  else if (inputs.width === 'Custom') {
    assert.equal(typeof inputs.custom_width, 'string');
    assert.match(inputs.custom_width, /^\d{1,2}(?:\.\d{1,2})?$/, 'Enter a custom width from 0 to 30');
    insetPercent = Number(inputs.custom_width);
  } else {
    assert.ok(Object.hasOwn(WIDTHS, inputs.width), 'Unknown border width');
    insetPercent = WIDTHS[inputs.width];
  }
  let frameColor;
  if (inputs.colour === 'Keep current') frameColor = item.colors.frame ?? item.colors.edge ?? item.colors.base;
  else if (inputs.colour === 'From edges') frameColor = item.colors.edge;
  else if (inputs.colour === 'Custom') frameColor = inputs.custom_colour;
  else {
    assert.ok(Object.hasOwn(COLOURS, inputs.colour), 'Unknown border colour');
    frameColor = COLOURS[inputs.colour];
  }
  return validateBorderRequest({ schemaVersion: 1, itemId, insetPercent, frameColor });
}

export function applyBorderRequest(catalog, request) {
  const update = validateBorderRequest(request);
  validateCatalog(catalog);
  assert.ok(Object.hasOwn(catalog.items, update.itemId), 'Unknown photo ID');
  assert.equal(catalog.items[update.itemId].type, 'photo', 'Borders can only be applied to photos');
  const next = structuredClone(catalog);
  const photo = next.items[update.itemId];
  photo.layout.insetPercent = update.insetPercent;
  photo.colors.frame = update.insetPercent === 0 ? null : update.frameColor;
  validateCatalog(next);
  return next;
}

async function main() {
  const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
  authorizeBorderEvent(event, process.env);
  const path = 'site/gallery.json';
  const catalog = JSON.parse(await readFile(path, 'utf8'));
  const request = borderRequestFromEvent(event, process.env, catalog);
  const next = applyBorderRequest(catalog, request);
  const changed = JSON.stringify(next) !== JSON.stringify(catalog);
  if (changed) await writeFile(path, JSON.stringify(next, null, 2) + '\n');
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `changed=${changed}\nitem_id=${request.itemId}\n`);
  console.log(changed ? `Updated border for ${request.itemId}` : `Border for ${request.itemId} is already current`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => {
    // Do not echo untrusted event contents into workflow logs.
    console.error('Border publishing request rejected; no border was published.');
    process.exitCode = 1;
  });
}
