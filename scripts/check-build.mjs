import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const html = await readFile('build/index.html', 'utf8');
const cssFiles = (await readdir('build/assets')).filter(file => file.endsWith('.css'));
assert.equal(cssFiles.length, 2);
assert.equal((html.match(/<canvas\b/g) || []).length, 2);
assert.equal((html.match(/<img\b/g) || []).length, 10, 'logo and nine gallery images');
assert.equal((html.match(/loading="lazy"/g) || []).length, 8);
assert.equal((html.match(/class="photo-flip"/g) || []).length, 9);
const catalog = JSON.parse(html.match(/<script id="gallery-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
assert.deepEqual(catalog.groups['blue-pair'].members, ['tiles', 'blue-seascape']);
assert.match(html, /type="module"/);
assert.doesNotMatch(html, /photo-edit|border-editor|border-publish|issues\/new/, 'public gallery must not expose border editing');
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
let jsBytes = 0, cssBytes = 0, imageBytes = 0, fontBytes = 0;
for (const file of await readdir('build/assets')) {
  const path = join('build/assets', file);
  const bytes = (await stat(path)).size;
  if (file.endsWith('.js')) jsBytes += bytes;
  else if (file.endsWith('.css')) cssBytes += bytes;
  else if (file.endsWith('.woff2')) fontBytes += bytes;
  else if (/\.(webp|png|jpg)$/.test(file)) imageBytes += bytes;
}
for (const ref of refs) {
  const path = join('build', ref);
  const entry = await stat(path);
  assert.ok(entry.isFile() || (entry.isDirectory() && (await stat(join(path, 'index.html'))).isFile()), `missing ${ref}`);
}
for (const [file, jsLimit, cssLimit] of [['index.html', 15000, 5000], ['trees/index.html', 20000, 7000]]) {
  const page = await readFile(join('build', file), 'utf8');
  assert.doesNotMatch(page.replace(/<a\b[^>]*>/g, ''), /(?:src|href)="https?:/g, `external startup request in ${file}`);
  let pageJS = 0, pageCSS = 0;
  for (const match of page.matchAll(/(?:src|href)="((?:\.\.?\/)[^"?#]+)"/g)) {
    const directory = file.includes('/') ? 'build/trees' : 'build';
    const path = join(directory, match[1]);
    const entry = await stat(path);
    if (path.endsWith('.js')) pageJS += entry.size;
    if (path.endsWith('.css')) pageCSS += entry.size;
  }
  assert.ok(pageJS < jsLimit, `${file} JS exceeds budget: ${pageJS}`);
  assert.ok(pageCSS < cssLimit, `${file} CSS exceeds budget: ${pageCSS}`);
  console.log(`${file}: ${pageJS} B JavaScript, ${pageCSS} B CSS`);
}
assert.ok(fontBytes < 30000, `fonts exceed budget: ${fontBytes}`);
assert.ok(imageBytes < 2000000, `images exceed budget: ${imageBytes}`);
const script = [...refs].find(ref => ref.endsWith('.js'));
const gzipBytes = gzipSync(await readFile(join('build', script))).length;
console.log(`Build checks passed: ${jsBytes} B JS (${gzipBytes} B gzip), ${cssBytes} B CSS, ${imageBytes} B images (all variants), ${fontBytes} B fonts.`);
