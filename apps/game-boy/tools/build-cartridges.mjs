// Bakes cartridge label art onto the cartridge UV atlases.
//
// Every cartridge front uses a scan/photo of a REAL released Pokemon cartridge
// (stored locally in tools/sources/ — the build never downloads anything).
// tools/pokemon-cartridges.json lists all entries: source image, label-sticker
// crop (fractions), authentic shell colour, and output atlas names.
//
// ORIENTATION FACT: the FRONT atlas region (46,471 438x534) maps to the
// cartridge's label sticker recess, and its content must be the upright label
// rotated 90 degrees COUNTER-clockwise (verified against the original Tetris
// atlas: rotating its front region 90 degrees clockwise yields the upright
// label). Labels are cropped upright (landscape 534x438) and rotated with
// sharp .rotate(270) before compositing.

import fs from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEX = resolve(__dirname, '../public/textures');
const BASES = resolve(__dirname, 'bases');
const MANIFEST = resolve(__dirname, 'pokemon-cartridges.json');
const SOURCES = resolve(__dirname, 'sources');

const FRONT = { left: 46, top: 471, width: 438, height: 534, radius: 22 };
const LABEL = { width: FRONT.height, height: FRONT.width }; // 534x438 upright
const STANDARD_BASE = resolve(BASES, 'base-standard.jpg');
const IN_POCKET_BASE = resolve(BASES, 'base-in-pocket.jpg');

async function loadManifest() {
  const text = await fs.readFile(MANIFEST, 'utf8');
  const entries = JSON.parse(text);

  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error('pokemon-cartridges.json must be a non-empty array');
  }

  return entries;
}

function roundedMaskSvg() {
  const { width, height, radius } = FRONT;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" fill="#ffffff"/></svg>`);
}

// Crop ONLY the label sticker from the cartridge scan (fractions from the
// manifest), keep it upright, then rotate into atlas orientation. The shell
// around it is the tinted base atlas plastic.
async function frontImage(entry, inPocket) {
  const sourcePath = resolve(SOURCES, entry.sourceImage);

  const meta = await sharp(sourcePath, { limitInputPixels: false }).metadata();
  const crop = entry.labelCrop;
  const region = {
    left: Math.round(meta.width * crop.left),
    top: Math.round(meta.height * crop.top),
    width: Math.round(meta.width * crop.width),
    height: Math.round(meta.height * crop.height),
  };

  const uprightLabel = await sharp(sourcePath, { limitInputPixels: false })
    .extract(region)
    .resize({ width: LABEL.width, height: LABEL.height, fit: 'fill' })
    .png()
    .toBuffer();

  let front = await sharp(uprightLabel)
    .rotate(270)
    .composite([{ input: roundedMaskSvg(), blend: 'dest-in' }])
    .png()
    .toBuffer();

  if (inPocket) {
    front = await sharp(front)
      .modulate({ brightness: 0.58, saturation: 0.92 })
      .png()
      .toBuffer();
  }

  return front;
}

function hexToRgb(hex) {
  const m = hex.replace('#', '');
  return { r: parseInt(m.slice(0, 2), 16), g: parseInt(m.slice(2, 4), 16), b: parseInt(m.slice(4, 6), 16) };
}

// Tint the grey cartridge body to the authentic shell colour (sharp.tint keeps
// luminance, so the moulding/shading detail survives). IMPORTANT: sharp applies
// colour operations AFTER composite within a single pipeline, so the tint must
// happen in a separate first pass or the label artwork would be tinted too.
async function bakeTexture(baseFile, outputFile, front, shellColor) {
  // sharp.tint preserves the base's luminance, so dark shells (black Pinball,
  // navy JP Gold...) would come out light grey. Scale brightness towards the
  // target colour's relative luminance first (base plastic luma ~0.60).
  const { r, g, b } = hexToRgb(shellColor);
  const shellLuma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const brightness = Math.min(1.3, Math.max(0.3, shellLuma / 0.6));

  const tintedBase = await sharp(baseFile)
    .modulate({ brightness })
    .tint(hexToRgb(shellColor))
    .png()
    .toBuffer();

  await sharp(tintedBase)
    .composite([{ input: front, left: FRONT.left, top: FRONT.top }])
    .jpeg({ quality: 92 })
    .toFile(resolve(TEX, outputFile));
}

for (const entry of await loadManifest()) {
  const standardFront = await frontImage(entry, false);
  const inPocketFront = await frontImage(entry, true);

  await bakeTexture(STANDARD_BASE, entry.outputs.standard, standardFront, entry.shellColor);
  console.log(`wrote ${entry.outputs.standard}  shell=${entry.shellColor} (authentic scan)`);

  await bakeTexture(IN_POCKET_BASE, entry.outputs.inPocket, inPocketFront, entry.shellColor);
  console.log(`wrote ${entry.outputs.inPocket}`);
}

console.log('all cartridge textures generated from authentic cartridge scans');
