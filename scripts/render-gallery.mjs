import assert from 'node:assert/strict';
import { backColor, noteColor } from '../src/photo-colors.js';

function escape(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

export function validateCatalog(catalog) {
  assert.equal(catalog.schemaVersion, 1);
  const seen = new Set();
  const idPattern = /^[a-z][a-z0-9-]*$/;
  const hex = /^#[0-9a-f]{6}$/i;
  const visit = id => {
    assert.match(id, idPattern);
    assert.ok(!seen.has(id), `Duplicate layout item ${id}`);
    seen.add(id);
    const group = catalog.groups[id];
    if (group) {
      assert.equal(group.id, id);
      assert.ok(!catalog.items[id], `Group ID collides with photo ${id}`);
      assert.equal(group.layout, 'vertical-stack');
      assert.equal(group.members.length, 2);
      for (const child of group.members) {
        assert.ok(catalog.items[child], `Group ${id} contains unknown item ${child}`);
        visit(child);
      }
      return;
    }
    const item = catalog.items[id];
    assert.ok(item, `Unknown layout item ${id}`);
    assert.equal(item.id, id);
    assert.match(item.colors.base, hex);
    if (item.colors.frame !== null) assert.match(item.colors.frame, hex);
    assert.ok(['photo', 'animation', 'archive'].includes(item.type));
    if (item.type !== 'photo') return;
    assert.equal(typeof item.title, 'string');
    assert.equal(typeof item.notes, 'string');
    if (item.capture) {
      const capture = item.capture;
      assert.match(capture.date, /^\d{4}-\d{2}-\d{2}$/);
      assert.equal(new Date(`${capture.date}T00:00:00Z`).toISOString().slice(0, 10), capture.date);
      assert.match(capture.time, /^(?:[01]\d|2[0-3]):[0-5]\d$/);
      assert.equal(typeof capture.timeBasis, 'string');
      assert.equal(typeof capture.source, 'string');
      assert.equal(typeof capture.location.town, 'string');
      assert.equal(typeof capture.location.setting, 'string');
    }
    assert.match(item.colors.edge, hex);
    assert.match(item.image.src, /^\.\/assets\/[a-z0-9-]+\.(webp|jpg)$/);
    assert.ok(item.image.width > 0 && item.image.height > 0);
    assert.ok(item.layout.insetPercent >= 0 && item.layout.insetPercent < 50);
    assert.ok(['cover', 'contain'].includes(item.layout.fit));
    assert.ok(item.colors.palette.length > 0);
    let totalWeight = 0;
    for (const swatch of item.colors.palette) {
      assert.match(swatch.hex, hex);
      assert.ok(swatch.weight > 0 && swatch.weight <= 1);
      assert.ok(swatch.oklch.l >= 0 && swatch.oklch.l <= 1);
      assert.ok(swatch.oklch.c >= 0);
      assert.ok(swatch.oklch.h >= 0 && swatch.oklch.h < 360);
      totalWeight += swatch.weight;
    }
    assert.ok(Math.abs(totalWeight - 1) < 0.001, `Invalid palette weights for ${id}`);
  };
  for (const id of catalog.order) visit(id);
  for (const id of Object.keys(catalog.items)) assert.ok(seen.has(id), `Item missing from layout: ${id}`);
  for (const id of Object.keys(catalog.groups)) assert.ok(seen.has(id), `Group missing from layout: ${id}`);
}

function captureLabel(capture) {
  const date = new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: 'UTC' })
    .format(new Date(`${capture.date}T00:00:00Z`));
  const [hour, minute] = capture.time.split(':');
  const hours = Number(hour);
  return `${date} · ${hours % 12 || 12}:${minute} ${hours < 12 ? 'am' : 'pm'}`;
}

export function renderGallery(catalog) {
  validateCatalog(catalog);
  function render(id) {
    const group = catalog.groups[id];
    if (group) return `<div class="tile-stack" data-group-id="${id}">${group.members.map(render).join('\n')}</div>`;
    const item = catalog.items[id];
    if (item.type === 'animation') {
      const wave = id === 'waves';
      const description = wave ? 'Animated white waves on black. Move your pointer or touch to change their shape.' : 'Grey circles accumulating across a black canvas';
      return `<figure class="tile${wave ? ' tile--hero' : ''}" data-item-id="${id}" aria-label="${description}"><canvas data-art="${id}" role="img" aria-label="${description}">${description}</canvas><noscript><p class="fallback">Enable JavaScript to see the moving ${wave ? 'waves' : 'particles'}.</p></noscript></figure>`;
    }
    if (item.type === 'archive') return `<figure class="tile tile--archive" data-item-id="${id}"><a href="${escape(item.url)}" target="_blank" rel="noopener noreferrer"><span>Archived artwork</span><small>Original image unavailable<br>Open archive ↗</small></a></figure>`;
    const image = item.image;
    const color = backColor(item.colors);
    const classes = `tile tile--photo${item.layout.portrait ? ' tile--portrait' : ''}`;
    const style = `--inset:${item.layout.insetPercent}%;--image-fit:${item.layout.fit};--card-color:${color};--note-color:${noteColor(color)}`;
    const responsive = image.srcset ? ` srcset="${escape(image.srcset)}" sizes="${escape(image.sizes)}"` : '';
    const loading = image.priority ? ' fetchpriority="high"' : ' loading="lazy"';
    return `<figure class="${classes}" data-item-id="${id}" style="${style}">
  <button class="photo-flip" type="button" data-title="${escape(item.title)}" aria-label="Show notes for ${escape(item.title)}" aria-pressed="false" disabled>
    <span class="photo-rotor">
      <span class="photo-front" aria-hidden="false"><img src="${escape(image.src)}"${responsive} width="${image.width}" height="${image.height}" alt="${escape(image.alt)}"${loading} decoding="async"></span>
      <span class="photo-back" aria-hidden="true"><span class="photo-copy"><span class="photo-title">${escape(item.title)}</span> ${item.notes ? `<span class="photo-notes">${escape(item.notes)}</span>` : ''} ${item.capture ? `<span class="photo-capture">${escape(captureLabel(item.capture))}</span>` : ''}</span><span class="photo-return">Back to photo</span></span>
    </span>
  </button>
</figure>`;
  }
  return catalog.order.map(render).join('\n');
}

export function serializeCatalog(catalog) {
  // Keep metadata available for future colour-based reordering without another request.
  return JSON.stringify(catalog).replace(/</g, '\\u003c');
}
