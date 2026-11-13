import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const html = await readFile('build/index.html', 'utf8');
const cssFiles = (await readdir('build/assets')).filter(file => file.endsWith('.css'));
assert.equal(cssFiles.length, 1);
assert.equal((html.match(/<canvas\b/g) || []).length, 2);
assert.equal((html.match(/<img\b/g) || []).length, 10, 'logo and nine gallery images');
assert.equal((html.match(/loading="lazy"/g) || []).length, 8);
assert.match(html, /type="module"/);
assert.doesNotMatch(html.replace(/<a\b[^>]*>/g, ''), /(?:src|href)="https?:/g, 'no external startup requests');
const refs = new Set([...html.matchAll(/(?:src|href)="(\.\/[^"?#]+)"/g)].map(match => match[1]));
for (const match of html.matchAll(/srcset="([^"]+)"/g)) {
  for (const source of match[1].split(',')) refs.add(source.trim().split(' ')[0]);
}
for (const file of cssFiles) {
  const css = await readFile(join('build/assets', file), 'utf8');
  assert.doesNotMatch(css, /https?:/);
  for (const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    assert.ok((await stat(join('build/assets', match[1]))).isFile(), `missing CSS image ${match[1]}`);
  }
}
let jsBytes = 0, cssBytes = 0, imageBytes = 0;
for (const file of await readdir('build/assets')) {
  const path = join('build/assets', file);
  const bytes = (await stat(path)).size;
  if (file.endsWith('.js')) jsBytes += bytes;
  else if (file.endsWith('.css')) cssBytes += bytes;
  else imageBytes += bytes;
}
for (const ref of refs) assert.ok((await stat(join('build', ref))).isFile(), `missing ${ref}`);
assert.ok(jsBytes < 15000, `JavaScript exceeds budget: ${jsBytes}`);
assert.ok(cssBytes < 5000, `CSS exceeds budget: ${cssBytes}`);
assert.ok(imageBytes < 2000000, `images exceed budget: ${imageBytes}`);
const script = [...refs].find(ref => ref.endsWith('.js'));
const gzipBytes = gzipSync(await readFile(join('build', script))).length;
console.log(`Build checks passed: ${jsBytes} B JS (${gzipBytes} B gzip), ${cssBytes} B CSS, ${imageBytes} B images (all variants).`);
