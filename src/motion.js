import { createNoise3D } from 'simplex-noise';

const FRAME_MS = 1000 / 60;

export function drawWaves(ctx, width, height, time, pointer, noise) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = Math.min(width, height) * 0.0075;
  ctx.lineJoin = 'round';
  const frequency = 0.5 + 1.5 * pointer.x;
  const amplitude = (0.05 + 0.45 * pointer.y) * height;
  const steps = Math.min(150, Math.max(60, Math.ceil(width / 4)));
  ctx.beginPath();
  for (let row = 0; row < 10; row++) {
    const v = row / 9;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const x = t * width;
      const y = v * height + noise(t * frequency + time, v * frequency, time) * amplitude;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
}

export function drawParticles(ctx, width, height, delta, random = Math.random) {
  // Same ~120 circles/second as the old sketch, independent of refresh rate.
  const count = 120 * delta;
  const whole = Math.floor(count);
  const total = whole + (random() < count - whole ? 1 : 0);
  for (let i = 0; i < total; i++) {
    const grey = Math.floor(random() * 256);
    ctx.fillStyle = `rgba(${grey},${grey},${grey},${random() * 100 / 255})`;
    ctx.beginPath();
    ctx.arc(random() * width, random() * height, random() * 7.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function createGallery(canvases) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const noise = createNoise3D();
  let paused = reduced.matches;
  let explicitPause = false;
  let frame = null;
  let previous = null;
  let activeTime = 0;
  let destroyed = false;
  const states = canvases.map(canvas => ({
    canvas, ctx: canvas.getContext('2d', { alpha: false }), width: 0, height: 0,
    visible: false, pointer: { x: 0.5, y: 0.5 },
  })).filter(state => state.ctx);

  function paint(state, delta = 1 / 60) {
    if (!state.width || !state.height) return;
    if (state.canvas.dataset.art === 'waves') {
      drawWaves(state.ctx, state.width, state.height, activeTime * 0.5, state.pointer, noise);
    } else {
      drawParticles(state.ctx, state.width, state.height, delta);
    }
  }

  function stop() {
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = null;
    previous = null;
  }

  function canRun() {
    return !destroyed && !paused && !document.hidden && states.some(state => state.visible && state.width > 0 && state.height > 0);
  }

  function tick(now) {
    frame = null;
    if (!canRun()) return;
    if (previous !== null && now - previous < FRAME_MS - 0.5) {
      frame = window.requestAnimationFrame(tick);
      return;
    }
    const delta = previous === null ? 1 / 60 : Math.min((now - previous) / 1000, 0.05);
    previous = now;
    activeTime += delta;
    for (const state of states) if (state.visible) paint(state, delta);
    frame = window.requestAnimationFrame(tick);
  }

  function sync() {
    if (canRun()) {
      if (frame === null) frame = window.requestAnimationFrame(tick);
    } else stop();
  }

  function resize(state) {
    const { width, height } = state.canvas.getBoundingClientRect();
    if (!width || !height) return;
    // Cap backing resolution to keep Retina screens from multiplying the work.
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(width * ratio);
    const pixelHeight = Math.round(height * ratio);
    if (state.canvas.width === pixelWidth && state.canvas.height === pixelHeight && state.width === width && state.height === height) return;
    // Keep the accumulated particle image when resizing.
    let snapshot;
    if (state.canvas.dataset.art === 'particles' && state.width) {
      snapshot = document.createElement('canvas');
      snapshot.width = state.canvas.width;
      snapshot.height = state.canvas.height;
      snapshot.getContext('2d').drawImage(state.canvas, 0, 0);
    }
    state.canvas.width = pixelWidth;
    state.canvas.height = pixelHeight;
    state.width = width;
    state.height = height;
    state.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    state.ctx.fillStyle = '#000';
    state.ctx.fillRect(0, 0, width, height);
    if (snapshot) state.ctx.drawImage(snapshot, 0, 0, width, height);
    else if (state.canvas.dataset.art === 'particles') {
      // A visible first frame even when motion is paused/reduced.
      paint(state, 1);
    }
    if (state.canvas.dataset.art === 'waves') paint(state);
  }

  const byCanvas = new Map(states.map(state => [state.canvas, state]));
  const intersection = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const state = byCanvas.get(entry.target);
      state.visible = entry.isIntersecting;
    }
    sync();
  });
  const sizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) resize(byCanvas.get(entry.target));
    sync();
  });
  function pointer(event) {
    const state = byCanvas.get(event.currentTarget);
    const rect = state.canvas.getBoundingClientRect();
    state.pointer.x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    state.pointer.y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    if (paused) paint(state);
  }
  for (const state of states) {
    resize(state);
    intersection.observe(state.canvas);
    sizeObserver.observe(state.canvas);
    if (state.canvas.dataset.art === 'waves') {
      state.canvas.addEventListener('pointermove', pointer, { passive: true });
      state.canvas.addEventListener('pointerdown', pointer, { passive: true });
    }
  }
  function visibility() { sync(); }
  function preference() {
    if (!explicitPause) {
      paused = reduced.matches;
      sync();
      api.onPauseChange?.();
    }
  }
  function windowResize() {
    for (const state of states) resize(state);
    sync();
  }
  document.addEventListener('visibilitychange', visibility);
  reduced.addEventListener('change', preference);
  window.addEventListener('resize', windowResize, { passive: true });
  const api = {
    get paused() { return paused; },
    onPauseChange: null,
    setPaused(value) {
      paused = Boolean(value);
      explicitPause = true;
      sync();
    },
    destroy() {
      destroyed = true;
      stop();
      intersection.disconnect();
      sizeObserver.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      reduced.removeEventListener('change', preference);
      window.removeEventListener('resize', windowResize);
      for (const state of states) {
        state.canvas.removeEventListener('pointermove', pointer);
        state.canvas.removeEventListener('pointerdown', pointer);
      }
    },
  };
  return api;
}
