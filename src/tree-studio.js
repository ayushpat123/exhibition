import { DEFAULTS, MAX_GROVES, WORLD, renderForest, sceneTrees, validateScene } from './trees.js';

const $ = selector => document.querySelector(selector);
const canvas = $('#forest');
const ctx = canvas.getContext('2d', { alpha: false });
const STORAGE_KEY = 'exbt:small-groves:v1';
function newSeed() { return crypto.getRandomValues(new Uint32Array(1))[0]; }
let scene = { version: 1, seed: newSeed(), groves: [] };
let storageAvailable = true;
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && saved.length < 100000) {
    const value = JSON.parse(saved);
    if (validateScene(value)) scene = value;
  }
} catch { storageAvailable = false; }
let trees = [];
let frame = null;
let keyboardPoint = null;
let pointerStart = null;
let exportURL = null;
let exportFile = null;
let clearArmedUntil = 0;
const controls = { size: $('#tree-size'), spread: $('#spread'), palette: $('#palette'), count: $('#density') };

function settings() {
  return { size: Number(controls.size.value), spread: Number(controls.spread.value), palette: controls.palette.value, count: controls.count.value };
}
function scheduleDraw() {
  if (frame !== null) return;
  frame = requestAnimationFrame(() => {
    frame = null;
    const pixels = Math.max(1, Math.round(canvas.getBoundingClientRect().width * Math.min(devicePixelRatio || 1, 2)));
    if (canvas.width !== pixels || canvas.height !== pixels) canvas.width = canvas.height = pixels;
    renderForest(ctx, trees, pixels);
    if (keyboardPoint && document.activeElement === canvas) {
      ctx.save(); ctx.setTransform(pixels / WORLD, 0, 0, pixels / WORLD, 0, 0);
      ctx.strokeStyle = '#697a61'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(keyboardPoint.x, keyboardPoint.y, 15, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
  });
}
function update(message = '') {
  trees = sceneTrees(scene);
  $('#tree-count').textContent = `${trees.length.toLocaleString()} ${trees.length === 1 ? 'tree' : 'trees'}`;
  $('#empty-hint').hidden = trees.length > 0;
  for (const id of ['#undo', '#clear', '#save']) $(id).disabled = trees.length === 0;
  $('#seed').value = scene.seed;
  $('#clear').textContent = 'Clear';
  clearArmedUntil = 0;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(scene)); }
  catch { storageAvailable = false; }
  $('#studio-status').textContent = message || (storageAvailable ? 'Your forest is saved on this device.' : 'Save an editable copy to keep your drawing.');
  scheduleDraw();
}
function plant(x, y) {
  if (scene.groves.length >= MAX_GROVES) {
    $('#studio-status').textContent = 'The canvas is full. Save it, undo a grove, or start a new forest.';
    return;
  }
  const before = trees.length;
  scene.groves.push({ x, y, ...settings() });
  update();
  $('#studio-status').textContent = `${trees.length - before} trees planted.${storageAvailable ? ' Saved on this device.' : ' Save an editable copy to keep them.'}`;
}
canvas.addEventListener('pointerdown', event => {
  if (event.isPrimary && event.button === 0) pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
});
canvas.addEventListener('pointerup', event => {
  const start = pointerStart; pointerStart = null;
  if (!start || start.id !== event.pointerId || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 12) return;
  const rect = canvas.getBoundingClientRect();
  keyboardPoint = null;
  plant(Math.min(WORLD, Math.max(0, (event.clientX - rect.left) / rect.width * WORLD)), Math.min(WORLD, Math.max(0, (event.clientY - rect.top) / rect.height * WORLD)));
});
canvas.addEventListener('pointercancel', () => { pointerStart = null; });
canvas.addEventListener('keydown', event => {
  const moves = { ArrowLeft: [-40, 0], ArrowRight: [40, 0], ArrowUp: [0, -40], ArrowDown: [0, 40] };
  if (Object.hasOwn(moves, event.key)) {
    event.preventDefault(); keyboardPoint ??= { x: 500, y: 500 };
    keyboardPoint.x = Math.min(950, Math.max(50, keyboardPoint.x + moves[event.key][0]));
    keyboardPoint.y = Math.min(950, Math.max(50, keyboardPoint.y + moves[event.key][1]));
    scheduleDraw();
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault(); keyboardPoint ??= { x: 500, y: 500 }; plant(keyboardPoint.x, keyboardPoint.y);
  }
});
canvas.addEventListener('click', event => {
  if (event.detail === 0) plant(keyboardPoint?.x ?? 500, keyboardPoint?.y ?? 500);
});
canvas.addEventListener('blur', scheduleDraw);
$('#undo').addEventListener('click', () => { scene.groves.pop(); update('Last grove removed.'); });
$('#clear').addEventListener('click', () => {
  if (Date.now() > clearArmedUntil) {
    clearArmedUntil = Date.now() + 4000;
    $('#clear').textContent = 'Clear all?';
    $('#studio-status').textContent = 'Tap Clear all again to start a fresh canvas.';
    setTimeout(() => { if (Date.now() >= clearArmedUntil) $('#clear').textContent = 'Clear'; }, 4100);
    return;
  }
  scene.groves = []; update('A blank page. Tap anywhere to plant.');
});
function setSeed(seed) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) {
    $('#studio-status').textContent = 'Use a whole-number seed from 0 to 4294967295.'; return;
  }
  scene.seed = seed; update('A new variation of your planting pattern.');
}
$('#previous-seed').addEventListener('click', () => setSeed((scene.seed - 1) >>> 0));
$('#next-seed').addEventListener('click', () => setSeed((scene.seed + 1) >>> 0));
$('#random-seed').addEventListener('click', () => setSeed(newSeed()));
$('#apply-seed').addEventListener('click', () => {
  if ($('#seed').value.trim() === '') { $('#studio-status').textContent = 'Enter a seed first.'; return; }
  setSeed(Number($('#seed').value));
});
controls.size.addEventListener('input', () => { $('#size-value').value = controls.size.value; });
controls.spread.addEventListener('input', () => { $('#spread-value').value = controls.spread.value; });
$('#reset-controls').addEventListener('click', () => {
  for (const [key, input] of Object.entries(controls)) input.value = DEFAULTS[key];
  $('#size-value').value = DEFAULTS.size; $('#spread-value').value = DEFAULTS.spread;
  $('#studio-status').textContent = 'Planting controls reset. Your existing trees stay as they are.';
});
function download(blob, name) {
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = name; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
$('#export-scene').addEventListener('click', () => download(new Blob([JSON.stringify(scene, null, 2)], { type: 'application/json' }), `small-groves-${scene.seed}.json`));
$('#import-scene').addEventListener('click', () => $('#scene-file').click());
$('#scene-file').addEventListener('change', async () => {
  const file = $('#scene-file').files[0]; if (!file) return;
  try {
    if (file.size > 100000) throw new Error();
    const imported = JSON.parse(await file.text());
    if (!validateScene(imported)) throw new Error();
    if (scene.groves.length && !confirm('Replace the current forest with this saved copy?')) return;
    scene = imported; update('Your editable copy is open.');
  } catch { $('#studio-status').textContent = 'This file is not a valid Small Groves drawing.'; }
  finally { $('#scene-file').value = ''; }
});
$('#save').addEventListener('click', async () => {
  const button = $('#save'); button.disabled = true; button.textContent = 'Preparing…';
  try {
    const image = document.createElement('canvas'); image.width = image.height = 2000;
    renderForest(image.getContext('2d', { alpha: false }), trees, 2000);
    const blob = await new Promise(resolve => image.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error();
    if (exportURL) URL.revokeObjectURL(exportURL);
    exportURL = URL.createObjectURL(blob);
    exportFile = new File([blob], `small-groves-${scene.seed}.png`, { type: 'image/png' });
    $('#saved-image').src = exportURL;
    $('#download-image').href = exportURL;
    $('#download-image').download = exportFile.name;
    $('#share-image').hidden = !navigator.canShare?.({ files: [exportFile] });
    if (typeof $('#save-dialog').showModal === 'function') $('#save-dialog').showModal();
    else download(blob, exportFile.name);
    $('#studio-status').textContent = 'Image ready. Save it or share it from the preview.';
  } catch { $('#studio-status').textContent = 'The image could not be prepared. Try again or save an editable copy.'; }
  finally { button.disabled = trees.length === 0; button.textContent = 'Save image ↗'; }
});
$('#share-image').addEventListener('click', async () => {
  try { await navigator.share({ files: [exportFile], title: 'Small groves · EXBT' }); }
  catch (error) { if (error.name !== 'AbortError') $('#studio-status').textContent = 'Use Download PNG to save this image.'; }
});
$('#close-save').addEventListener('click', () => $('#save-dialog').close());
new ResizeObserver(scheduleDraw).observe(canvas);
update(scene.groves.length ? 'Your last forest is back.' : 'Each tap plants 10–20 slightly different trees.');
