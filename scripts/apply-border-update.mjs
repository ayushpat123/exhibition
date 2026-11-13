import assert from 'node:assert/strict';
import { appendFile, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { validateCatalog } from './render-gallery.mjs';

const OWNER = 'ayushpat123';
const REPOSITORY = `${OWNER}/exhibition`;
const TITLE_PREFIX = 'EXBT borders: ';
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
  if (environment.GITHUB_EVENT_NAME === 'issues') {
    assert.equal(event.action, 'opened', 'Only newly opened issues publish');
    assert.equal(event.issue?.user?.login, OWNER, 'Only owner-authored issues publish');
    assert.equal(typeof event.issue?.title, 'string', 'Missing issue title');
    assert.ok(event.issue.title.startsWith(TITLE_PREFIX), 'Not a border publishing issue');
  } else {
    assert.equal(environment.GITHUB_EVENT_NAME, 'workflow_dispatch', 'Unsupported publishing event');
  }
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

export function borderRequestFromEvent(event, environment) {
  authorizeBorderEvent(event, environment);
  let json;
  if (environment.GITHUB_EVENT_NAME === 'issues') {
    assert.equal(typeof event.issue.body, 'string', 'Missing border request body');
    assert.ok(event.issue.body.length <= 16384, 'Border request body is too large');
    const blocks = [...event.issue.body.matchAll(/^```json[ \t]*\r?\n([\s\S]*?)\r?\n```[ \t]*$/gm)];
    assert.equal(blocks.length, 1, 'Expected exactly one fenced JSON border request');
    json = blocks[0][1];
  } else {
    json = event.inputs?.border_json;
  }
  assert.equal(typeof json, 'string', 'Missing border JSON');
  assert.ok(json.length <= 4096, 'Border JSON is too large');
  return validateBorderRequest(JSON.parse(json));
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
  const request = borderRequestFromEvent(event, process.env);
  const path = 'site/gallery.json';
  const catalog = JSON.parse(await readFile(path, 'utf8'));
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
