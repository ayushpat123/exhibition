import { renderGallery, serializeCatalog } from './render-gallery.mjs';
import { build } from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

await rm('build', { recursive: true, force: true });
await mkdir('build/assets', { recursive: true });
await cp('site/assets', 'build/assets', { recursive: true });
for (const file of ['favicon.ico', 'safari-pinned-tab.svg', 'robots.txt']) await cp(`site/${file}`, `build/${file}`);
const result = await build({
  entryPoints: ['src/main.js', 'site/styles.css', 'src/tree-studio.js', 'site/trees/studio.css'], bundle: true, minify: true,
  loader: { '.webp': 'file', '.woff2': 'file' }, assetNames: '[name]',
  format: 'esm', target: ['safari15', 'chrome100', 'firefox100'],
  outdir: 'build/assets', entryNames: '[name]-[hash]', metafile: true, legalComments: 'eof',
});
const outputs = Object.entries(result.metafile.outputs);
const js = outputs.find(([, value]) => value.entryPoint === 'src/main.js')[0].replace('build/', './');
const css = outputs.find(([, value]) => value.entryPoint === 'site/styles.css')[0].replace('build/', './');
const catalog = JSON.parse(await readFile('site/gallery.json', 'utf8'));
const html = (await readFile('site/index.html', 'utf8'))
  .replace('./src/main.js', js).replace('./styles.css', css)
  .replace('<!-- GALLERY -->', renderGallery(catalog))
  .replace('<!-- GALLERY_DATA -->', serializeCatalog(catalog));
await writeFile('build/index.html', html);
await mkdir('build/trees', { recursive: true });
const studioJS = outputs.find(([, value]) => value.entryPoint === 'src/tree-studio.js')[0].replace('build/', '../');
const studioCSS = outputs.find(([, value]) => value.entryPoint === 'site/trees/studio.css')[0].replace('build/', '../');
const studioHTML = (await readFile('site/trees/index.html', 'utf8'))
  .replace('./src/tree-studio.js', studioJS).replace('./studio.css', studioCSS);
await writeFile('build/trees/index.html', studioHTML);
await writeFile('build/.nojekyll', '');
const version = createHash('sha256').update(html).update(studioHTML).digest('hex').slice(0, 12);
await writeFile('build/version.json', JSON.stringify({ version }) + '\n');
for (const [file, value] of outputs) console.log(`${file}: ${value.bytes} bytes`);
console.log(`Build ${version}`);
