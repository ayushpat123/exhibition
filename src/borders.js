import { backColor, noteColor } from './photo-colors.js';

export function borderSettings(item) {
  return { insetPercent: item.layout.insetPercent, frameColor: item.colors.frame ?? item.colors.edge ?? item.colors.base };
}

export function validBorderSettings(value) {
  return value && Number.isFinite(value.insetPercent) && value.insetPercent >= 0 && value.insetPercent <= 30
    && typeof value.frameColor === 'string' && /^#[0-9a-f]{6}$/i.test(value.frameColor);
}

export function applyBorder(tile, item, settings) {
  if (!validBorderSettings(settings)) throw new Error('Invalid border settings');
  const surface = backColor({ ...item.colors, frame: settings.insetPercent > 0 ? settings.frameColor : null });
  tile.style.setProperty('--inset', `${settings.insetPercent}%`);
  tile.style.setProperty('--card-color', surface);
  tile.style.setProperty('--note-color', noteColor(surface));
  return surface;
}

export function publishUrl(item, settings) {
  if (!validBorderSettings(settings)) throw new Error('Invalid border settings');
  const payload = { schemaVersion: 1, itemId: item.id, ...settings };
  const body = `Publish these border settings for ${item.title}.\n\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\`\n\nSubmitted from the EXBT border editor. Only the gallery owner's submissions are applied.`;
  const params = new URLSearchParams({ title: `EXBT borders: ${item.title}`, body });
  return `https://github.com/ayushpat123/exhibition/issues/new?${params}`;
}

export function initBorderEditor(root = document) {
  const dialog = root.querySelector('#border-editor');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const catalog = JSON.parse(root.querySelector('#gallery-data').textContent);
  const width = dialog.querySelector('#border-width');
  const color = dialog.querySelector('#border-color');
  const output = dialog.querySelector('#border-width-value');
  const title = dialog.querySelector('#border-title');
  const preview = dialog.querySelector('.border-preview');
  const previewImage = preview.querySelector('img');
  const publish = dialog.querySelector('#border-publish');
  const status = dialog.querySelector('#border-status');
  const undo = dialog.querySelector('#border-reset');
  let active = null;
  let draft = null;
  let keepPreview = false;
  let opener = null;

  function update() {
    if (!active) return;
    draft = { insetPercent: Number(width.value), frameColor: color.value };
    applyBorder(active.tile, active.item, draft);
    applyBorder(preview, active.item, draft);
    const px = Math.round(active.tile.getBoundingClientRect().width * draft.insetPercent / 100);
    output.value = draft.insetPercent ? `${px} px` : 'No border';
    color.disabled = draft.insetPercent === 0;
    publish.href = publishUrl(active.item, draft);
    for (const button of dialog.querySelectorAll('[data-border-width]')) {
      button.setAttribute('aria-pressed', String(Number(button.dataset.borderWidth) === draft.insetPercent));
    }
    for (const button of dialog.querySelectorAll('[data-border-color]')) {
      const swatch = button.dataset.borderColor === 'edge' ? active.item.colors.edge : button.dataset.borderColor;
      button.setAttribute('aria-pressed', String(swatch.toLowerCase() === draft.frameColor.toLowerCase()));
    }
    status.textContent = 'Preview only. Publish to update the site for everyone.';
  }

  function open(event) {
    opener = event.currentTarget;
    const item = catalog.items[opener.dataset.editId];
    active = { item, tile: root.querySelector(`[data-item-id="${item.id}"]`) };
    keepPreview = false;
    const settings = borderSettings(item);
    width.value = settings.insetPercent;
    color.value = settings.frameColor;
    title.textContent = item.title;
    previewImage.src = item.image.src;
    previewImage.alt = item.image.alt;
    const rect = active.tile.getBoundingClientRect();
    preview.style.aspectRatio = `${rect.width} / ${rect.height}`;
    preview.style.width = `${Math.min(220, 150 * rect.width / rect.height)}px`;
    preview.style.setProperty('--image-fit', item.layout.fit);
    update();
    dialog.showModal();
  }

  for (const button of root.querySelectorAll('.photo-edit')) {
    button.hidden = false;
    button.addEventListener('click', open);
  }
  width.addEventListener('input', update);
  color.addEventListener('input', update);
  for (const button of dialog.querySelectorAll('[data-border-width]')) {
    button.addEventListener('click', () => { width.value = button.dataset.borderWidth; update(); });
  }
  for (const button of dialog.querySelectorAll('[data-border-color]')) {
    button.addEventListener('click', () => {
      color.value = button.dataset.borderColor === 'edge' ? active.item.colors.edge : button.dataset.borderColor;
      if (Number(width.value) === 0) width.value = 6;
      update();
    });
  }
  undo.addEventListener('click', () => {
    const saved = borderSettings(active.item);
    width.value = saved.insetPercent;
    color.value = saved.frameColor;
    update();
  });
  dialog.querySelector('#border-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    if (active && !keepPreview) applyBorder(active.tile, active.item, borderSettings(active.item));
    opener?.focus();
    active = null;
  });
  publish.addEventListener('click', () => {
    keepPreview = true;
    status.textContent = 'Confirm on GitHub. Your public border will appear after the site rebuilds; then reload this page.';
  });
}
