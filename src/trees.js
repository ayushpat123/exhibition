export const WORLD = 1000;
export const MAX_GROVES = 100;
export const DEFAULTS = { size: 72, spread: 94, palette: 'forest', count: 'auto' };
export const PALETTES = {
  forest: { hue: 130, saturation: 28, lightness: 42 },
  sage: { hue: 101, saturation: 18, lightness: 53 },
  autumn: { hue: 37, saturation: 43, lightness: 52 },
};
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export function randomFromSeed(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let n = state;
    n = Math.imul(n ^ n >>> 15, n | 1);
    n ^= n + Math.imul(n ^ n >>> 7, n | 61);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}

export function makeGrove(seed, index, gesture) {
  const random = randomFromSeed((seed ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0);
  const count = gesture.count === 'auto' ? 10 + Math.floor(random() * 11) : Number(gesture.count);
  const palette = PALETTES[gesture.palette];
  const familyHue = palette.hue + (random() - 0.5) * 16;
  const trees = [];
  for (let i = 0; i < count; i++) {
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random()) * gesture.spread;
    const height = gesture.size * (0.65 + random() * 0.7);
    trees.push({
      x: clamp(gesture.x + Math.cos(angle) * radius, height * 0.5 + 4, WORLD - height * 0.5 - 4),
      y: clamp(gesture.y + Math.sin(angle) * radius * 0.5 + height * 0.35, height * 1.12 + 5, WORLD - 12),
      height,
      width: height * (0.3 + random() * 0.26),
      lean: (random() - 0.5) * height * 0.13,
      rotation: random() * Math.PI * 2,
      species: random() < 0.35 ? 'fir' : 'broadleaf',
      hue: familyHue + (random() - 0.5) * 18,
      saturation: palette.saturation + (random() - 0.5) * 10,
      lightness: palette.lightness + (random() - 0.5) * 10,
      seed: Math.floor(random() * 4294967296),
    });
  }
  return trees;
}

function normal(a, b, c) {
  const u = b.map((value, i) => value - a[i]);
  const v = c.map((value, i) => value - a[i]);
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const length = Math.hypot(...n) || 1;
  return n.map(value => value / length);
}
const LIGHT = [-0.55, 0.75, 0.38];
function project(point, tree) {
  const [x, y, z] = point;
  const cos = Math.cos(tree.rotation), sin = Math.sin(tree.rotation);
  const rx = x * cos - z * sin;
  const rz = x * sin + z * cos;
  return [rx + rz * 0.35 + tree.lean * y / tree.height, -y + rz * 0.24, rz];
}
function face(points, tree, jitter, trunk = false) {
  const projected = points.map(point => project(point, tree));
  // Use the outward-facing normal on either half of the convex crown.
  const center = points.reduce((sum, p) => sum.map((v, i) => v + p[i] / points.length), [0, 0, 0]);
  const cos = Math.cos(tree.rotation), sin = Math.sin(tree.rotation);
  const worldNormal = normal(points[0], points[1], points[2]);
  const rotated = [worldNormal[0] * cos - worldNormal[2] * sin, worldNormal[1], worldNormal[0] * sin + worldNormal[2] * cos];
  const outward = center[0] * worldNormal[0] + (center[1] - tree.height * 0.65) * worldNormal[1] + center[2] * worldNormal[2];
  const sign = outward < 0 ? -1 : 1;
  const light = rotated.reduce((sum, v, i) => sum + v * sign * LIGHT[i], 0);
  const hue = trunk ? 28 : tree.hue;
  const saturation = trunk ? 19 : tree.saturation;
  const lightness = clamp((trunk ? 30 : tree.lightness) + light * (trunk ? 10 : 16) + jitter, 13, 78);
  return {
    points: projected.map(p => [tree.x + p[0], tree.y + p[1]]),
    depth: projected.reduce((sum, p) => sum + p[2] / projected.length, 0),
    color: `hsl(${hue.toFixed(2)}, ${saturation.toFixed(2)}%, ${lightness.toFixed(2)}%)`,
  };
}

export function treeGeometry(tree) {
  const random = randomFromSeed(tree.seed);
  const h = tree.height, w = tree.width;
  const trunk = [];
  const trunkWidth = h * 0.045;
  const stem = h * 0.43;
  const base = [[-trunkWidth, 0, -trunkWidth], [trunkWidth, 0, -trunkWidth], [trunkWidth, 0, trunkWidth], [-trunkWidth, 0, trunkWidth]];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    trunk.push(face([base[i], base[j], [base[j][0] * 0.65, stem, base[j][2] * 0.65], [base[i][0] * 0.65, stem, base[i][2] * 0.65]], tree, 0, true));
  }
  const crown = [];
  if (tree.species === 'fir') {
    const tiers = 3;
    for (let tier = 0; tier < tiers; tier++) {
      const bottom = h * (0.25 + tier * 0.18);
      const tip = h * (0.67 + tier * 0.18);
      const radius = w * (0.66 - tier * 0.14);
      const count = 5 + (tree.seed % 2);
      for (let i = 0; i < count; i++) {
        const a = i * Math.PI * 2 / count, b = (i + 1) * Math.PI * 2 / count;
        crown.push(face([[Math.cos(a) * radius, bottom, Math.sin(a) * radius], [Math.cos(b) * radius, bottom, Math.sin(b) * radius], [0, tip, 0]], tree, (random() - 0.5) * 4));
      }
    }
  } else {
    const sides = 7;
    const rings = [];
    for (const [y, radius] of [[0.34, 0.44], [0.55, 0.64], [0.8, 0.5]]) {
      const ring = [];
      for (let i = 0; i < sides; i++) {
        const angle = i * Math.PI * 2 / sides;
        const r = w * radius * (0.86 + random() * 0.26);
        ring.push([Math.cos(angle) * r, h * (y + (random() - 0.5) * 0.08), Math.sin(angle) * r * 0.8]);
      }
      rings.push(ring);
    }
    const peak = [0, h * (0.99 + random() * 0.06), 0];
    for (let i = 0; i < sides; i++) {
      const j = (i + 1) % sides;
      crown.push(face([[0, h * 0.27, 0], rings[0][j], rings[0][i]], tree, 0));
      for (let row = 0; row < rings.length - 1; row++) {
        crown.push(face([rings[row][i], rings[row][j], rings[row + 1][i]], tree, (random() - 0.5) * 4));
        crown.push(face([rings[row][j], rings[row + 1][j], rings[row + 1][i]], tree, (random() - 0.5) * 4));
      }
      crown.push(face([rings[2][i], rings[2][j], peak], tree, 0));
    }
  }
  trunk.sort((a, b) => a.depth - b.depth);
  crown.sort((a, b) => a.depth - b.depth);
  return [...trunk, ...crown];
}

function polygon(ctx, points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fill();
}

export function renderForest(ctx, trees, pixels = 1000) {
  ctx.save();
  ctx.setTransform(pixels / WORLD, 0, 0, pixels / WORLD, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, WORLD, WORLD);
  const sorted = [...trees].sort((a, b) => a.y - b.y);
  for (const tree of sorted) {
    const points = Array.from({ length: 8 }, (_, i) => {
      const angle = i * Math.PI / 4;
      return [tree.x + Math.cos(angle) * tree.width * 0.65 + tree.height * 0.09, tree.y + Math.sin(angle) * tree.width * 0.12 + 2];
    });
    polygon(ctx, points, 'rgba(38, 53, 36, 0.07)');
  }
  for (const tree of sorted) for (const face of treeGeometry(tree)) polygon(ctx, face.points, face.color);
  ctx.restore();
}

export function validateScene(value) {
  if (!value || value.version !== 1 || !Number.isInteger(value.seed) || value.seed < 0 || value.seed > 4294967295 || !Array.isArray(value.groves) || value.groves.length > MAX_GROVES) return false;
  return value.groves.every(g => g && Number.isFinite(g.x) && g.x >= 0 && g.x <= WORLD && Number.isFinite(g.y) && g.y >= 0 && g.y <= WORLD && Number.isFinite(g.size) && g.size >= 40 && g.size <= 110 && Number.isFinite(g.spread) && g.spread >= 35 && g.spread <= 160 && Object.hasOwn(PALETTES, g.palette) && ['auto', '10', '15', '20'].includes(g.count));
}
export function sceneTrees(scene) {
  return scene.groves.flatMap((grove, index) => makeGrove(scene.seed, index, grove));
}
