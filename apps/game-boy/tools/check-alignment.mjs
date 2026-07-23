// Geometry-only alignment check for the generated cartridge textures.
// Base-independent: scans inside the label rect for the cover-content extent on
// all four sides (the dead/flat bands), so it works even though the cartridge
// body is now tinted. Does NOT render artwork.

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEX = resolve(__dirname, '../public/textures');

// Target label rectangle in the 1024x1024 UV atlas.
const LABEL = { left: 46, top: 471, right: 484, bottom: 1005 };
const VAR = 6; // per-step variance threshold that counts as "image content"

async function raw(file) {
  const { data, info } = await sharp(resolve(TEX, file))
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height, c: info.channels };
}
function px(img, x, y) { const i = (y * img.w + x) * img.c; return [img.data[i], img.data[i + 1], img.data[i + 2]]; }

function rowHasContent(img, y) {
  let v = 0, n = 0, prev = null;
  for (let x = LABEL.left + 4; x < LABEL.right - 4; x += 3) {
    const p = px(img, x, y);
    if (prev) v += Math.abs(p[0] - prev[0]) + Math.abs(p[1] - prev[1]) + Math.abs(p[2] - prev[2]);
    prev = p; n++;
  }
  return v / n > VAR;
}
function colHasContent(img, x) {
  let v = 0, n = 0, prev = null;
  for (let y = LABEL.top + 4; y < LABEL.bottom - 4; y += 3) {
    const p = px(img, x, y);
    if (prev) v += Math.abs(p[0] - prev[0]) + Math.abs(p[1] - prev[1]) + Math.abs(p[2] - prev[2]);
    prev = p; n++;
  }
  return v / n > VAR;
}

const keys = ['red', 'blue', 'yellow', 'green', 'gold', 'silver', 'crystal'];
console.log(`label rect x[${LABEL.left}..${LABEL.right}] y[${LABEL.top}..${LABEL.bottom}] (w=${LABEL.right - LABEL.left} h=${LABEL.bottom - LABEL.top})\n`);

for (const key of keys) {
  let img;
  try { img = await raw(`baked-cartridge-${key}.jpg`); } catch { console.log(`${key}: MISSING`); continue; }

  let top = -1, bot = -1, left = -1, right = -1;
  for (let y = LABEL.top; y < LABEL.bottom; y++) if (rowHasContent(img, y)) { if (top < 0) top = y; bot = y; }
  for (let x = LABEL.left; x < LABEL.right; x++) if (colHasContent(img, x)) { if (left < 0) left = x; right = x; }

  const bands = {
    top: top < 0 ? '-' : top - LABEL.top,
    bottom: bot < 0 ? '-' : LABEL.bottom - bot,
    left: left < 0 ? '-' : left - LABEL.left,
    right: right < 0 ? '-' : LABEL.right - right,
  };
  const ok = [bands.top, bands.bottom, bands.left, bands.right].every(b => b !== '-' && b <= 3);
  console.log(`${key.padEnd(8)} content x[${left}..${right}] y[${top}..${bot}]  ` +
    `bands T=${bands.top} B=${bands.bottom} L=${bands.left} R=${bands.right}px  ${ok ? 'OK (fills label)' : 'has dead band(s)'}`);
}
