// Generates original late-1990s handheld cartridge labels from the truthful
// homebrew manifest. Historical scan assets stay in the repository but are not
// part of this active build.

import fs from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const texturesDir = resolve(__dirname, '../public/textures');
const basesDir = resolve(__dirname, 'bases');
const manifestPath = resolve(__dirname, 'homebrew-cartridges.json');

const frontRegion = { left: 46, top: 471, width: 438, height: 534, radius: 22 };
const labelSize = { width: frontRegion.height, height: frontRegion.width };
const standardBase = resolve(basesDir, 'base-standard.jpg');
const inPocketBase = resolve(basesDir, 'base-in-pocket.jpg');
const seriesFallback = 'GAMEX HOMEBREW';

async function loadManifest() {
  const text = await fs.readFile(manifestPath, 'utf8');
  const entries = JSON.parse(text);
  if (!Array.isArray(entries) || entries.length !== 15) {
    throw new Error(`homebrew-cartridges.json must contain exactly 15 entries, found ${entries?.length ?? 'invalid'}`);
  }
  return entries;
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function titleSize(title) {
  if (title.length <= 8) return 72;
  if (title.length <= 13) return 58;
  if (title.length <= 18) return 46;
  return 38;
}

function titleLines(title) {
  if (title.length <= 15 || !title.includes(' ')) {
    return [title];
  }
  const words = title.split(' ');
  let splitIndex = 1;
  let bestDifference = Number.POSITIVE_INFINITY;
  for (let index = 1; index < words.length; index += 1) {
    const leftLength = words.slice(0, index).join(' ').length;
    const rightLength = words.slice(index).join(' ').length;
    const difference = Math.abs(leftLength - rightLength);
    if (difference < bestDifference) {
      splitIndex = index;
      bestDifference = difference;
    }
  }
  return [words.slice(0, splitIndex).join(' '), words.slice(splitIndex).join(' ')];
}

function motifSvg(motif, accent, secondary) {
  const shared = `fill="none" stroke-linecap="round" stroke-linejoin="round"`;
  switch (motif) {
    case 'blocks':
      return `<g opacity=".92"><rect x="355" y="68" width="50" height="50" rx="7" fill="${accent}"/><rect x="409" y="68" width="50" height="50" rx="7" fill="${secondary}"/><rect x="409" y="122" width="50" height="50" rx="7" fill="${accent}"/><rect x="409" y="176" width="50" height="50" rx="7" fill="${secondary}"/><path d="M335 247h144" stroke="${accent}" stroke-width="8"/></g>`;
    case 'cat':
      return `<g ${shared} stroke="${accent}" stroke-width="12" opacity=".92"><path d="M354 205v-75l35 25 42-25 35 26v68c0 48-112 52-112-19Z"/><path d="M382 191h1m54 0h1" stroke-width="17"/><path d="M400 220q18 18 36 0" stroke="${secondary}"/></g>`;
    case 'flight':
      return `<g opacity=".94"><path d="M341 196 476 88l-42 119-33-14-27 34-8-49Z" fill="${accent}"/><path d="m372 177 62-47-39 57Z" fill="${secondary}"/><path d="M330 250q70 32 151-4" ${shared} stroke="${secondary}" stroke-width="10"/></g>`;
    case 'network':
      return `<g ${shared} stroke-width="10" opacity=".92"><path d="m347 105 61 50 65-37m-65 37-40 80m40-80 47 87" stroke="${secondary}"/><circle cx="347" cy="105" r="20" fill="${accent}" stroke="${accent}"/><circle cx="408" cy="155" r="25" fill="${accent}" stroke="${accent}"/><circle cx="473" cy="118" r="18" fill="${accent}" stroke="${accent}"/><circle cx="368" cy="235" r="20" fill="${accent}" stroke="${accent}"/><circle cx="455" cy="242" r="20" fill="${accent}" stroke="${accent}"/></g>`;
    case 'radar':
      return `<g ${shared} opacity=".94"><circle cx="410" cy="170" r="92" stroke="${secondary}" stroke-width="8"/><circle cx="410" cy="170" r="55" stroke="${secondary}" stroke-width="5"/><path d="M410 170 475 105M318 170h184M410 78v184" stroke="${secondary}" stroke-width="5"/><circle cx="454" cy="132" r="14" fill="${accent}" stroke="${accent}"/><path d="M410 170 463 218" stroke="${accent}" stroke-width="12"/></g>`;
    case 'shield':
      return `<g opacity=".95"><path d="M410 67 478 92v88c0 49-32 83-68 104-36-21-68-55-68-104V92Z" fill="${accent}"/><path d="m410 93 39 14v66c0 30-17 54-39 70Z" fill="${secondary}"/><path d="m384 158 19 20 37-47" ${shared} stroke="#17213d" stroke-width="13"/></g>`;
    case 'wormhole':
      return `<g ${shared} opacity=".95"><path d="M492 174c0 63-73 106-129 73-51-30-34-112 23-121 47-8 81 43 53 79-21 27-65 11-63-22 2-23 31-32 45-14" stroke="${accent}" stroke-width="15"/><path d="M337 89 480 259M337 259 480 89" stroke="${secondary}" stroke-width="6" opacity=".7"/></g>`;
    case 'bounce':
      return `<g opacity=".94"><circle cx="397" cy="218" r="52" fill="${secondary}"/><circle cx="456" cy="124" r="34" fill="${accent}"/><path d="M350 275q55-33 78-85t55-99" ${shared} stroke="${accent}" stroke-width="11" stroke-dasharray="2 23"/><path d="m448 92 28 2-8 27" ${shared} stroke="${secondary}" stroke-width="10"/></g>`;
    case 'city':
      return `<g opacity=".94"><path d="M329 258V150h45v108m0 0V104h55v154m0 0V139h48v119Z" fill="${secondary}"/><path d="M346 171h12m-12 25h12m40-66h14m-14 27h14m-14 27h14m40-20h12m-12 27h12" ${shared} stroke="${accent}" stroke-width="8"/><path d="M318 260h174" stroke="${accent}" stroke-width="12"/></g>`;
    case 'tiles':
      return `<g font-family="Arial Black,Arial,sans-serif" font-weight="900" text-anchor="middle"><rect x="333" y="88" width="70" height="70" rx="12" fill="${secondary}"/><rect x="411" y="88" width="70" height="70" rx="12" fill="${accent}"/><rect x="333" y="166" width="70" height="70" rx="12" fill="${accent}"/><rect x="411" y="166" width="70" height="70" rx="12" fill="${secondary}"/><text x="368" y="134" font-size="27">2</text><text x="446" y="134" font-size="27">0</text><text x="368" y="212" font-size="27">4</text><text x="446" y="212" font-size="27">8</text></g>`;
    case 'office':
      return `<g opacity=".95"><rect x="330" y="91" width="151" height="155" rx="12" fill="${secondary}"/><path d="M350 122h111M350 153h111M350 184h52M417 184h44M350 215h111" stroke="${accent}" stroke-width="12"/><circle cx="381" cy="272" r="22" fill="${accent}"/><circle cx="432" cy="272" r="22" fill="${secondary}"/></g>`;
    case 'temple':
      return `<g opacity=".95"><path d="m409 70 84 58H325Z" fill="${accent}"/><path d="M341 135h136v25H341Zm15 25h24v83h-24Zm53 0h24v83h-24Zm53 0h24v83h-24ZM330 243h158v24H330Z" fill="${secondary}"/></g>`;
    case 'waves':
      return `<g ${shared} stroke-width="14" opacity=".95"><path d="M323 148q37-40 74 0t74 0" stroke="${secondary}"/><path d="M323 198q37-40 74 0t74 0" stroke="${accent}"/><path d="M323 248q37-40 74 0t74 0" stroke="${secondary}"/><path d="m412 87 23 38 36 7-29 27 8 38-38-18-36 18 7-39-29-26 38-7Z" fill="${accent}" stroke="${accent}"/></g>`;
    case 'geometry':
      return `<g ${shared} stroke-width="11" opacity=".95"><circle cx="370" cy="137" r="48" fill="${secondary}" stroke="${secondary}"/><path d="m444 87 54 94H390Z" fill="${accent}" stroke="${accent}"/><rect x="348" y="195" width="96" height="72" rx="8" stroke="${accent}"/><path d="m365 250 62-42m-62 0 62 42" stroke="${secondary}"/></g>`;
    case 'letters':
      return `<g font-family="Arial Black,Arial,sans-serif" font-weight="900" text-anchor="middle" font-size="31"><rect x="326" y="91" width="48" height="48" rx="7" fill="${secondary}"/><rect x="382" y="91" width="48" height="48" rx="7" fill="${accent}"/><rect x="438" y="91" width="48" height="48" rx="7" fill="${secondary}"/><rect x="326" y="147" width="48" height="48" rx="7" fill="${accent}"/><rect x="382" y="147" width="48" height="48" rx="7" fill="${secondary}"/><rect x="438" y="147" width="48" height="48" rx="7" fill="${accent}"/><text x="350" y="126">W</text><text x="406" y="126">O</text><text x="462" y="126">R</text><text x="350" y="182">D</text><text x="406" y="182">Y</text><text x="462" y="182">L</text></g>`;
    default:
      throw new Error(`Unsupported label motif: ${motif}`);
  }
}

function labelSvg(entry) {
  const { background, accent, secondary, motif, series = seriesFallback } = entry.theme;
  const lines = titleLines(entry.title);
  const fontSize = titleSize(entry.title);
  const titleStartY = lines.length === 1 ? 204 : 178;
  const title = lines.map((line, index) => (
    `<text x="34" y="${titleStartY + index * (fontSize + 8)}" font-size="${fontSize}">${escapeXml(line)}</text>`
  )).join('');

  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${labelSize.width}" height="${labelSize.height}" viewBox="0 0 ${labelSize.width} ${labelSize.height}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${background}"/>
          <stop offset="1" stop-color="#070a14"/>
        </linearGradient>
        <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="2" fill="${secondary}" opacity=".2"/>
        </pattern>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
          <feOffset dx="4" dy="5"/>
          <feComponentTransfer><feFuncA type="linear" slope=".65"/></feComponentTransfer>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <rect width="534" height="438" rx="20" fill="url(#bg)"/>
      <path d="M0 332 534 82v356H0Z" fill="${accent}" opacity=".13"/>
      <rect width="534" height="438" rx="20" fill="url(#dots)"/>
      <path d="M26 65h245" stroke="${accent}" stroke-width="7"/>
      <text x="28" y="47" fill="${accent}" font-family="Arial Black,Arial,sans-serif" font-size="20" font-weight="900" letter-spacing="2">${escapeXml(series)}</text>
      <text x="29" y="83" fill="#f5f2df" font-family="Arial,Helvetica,sans-serif" font-size="15" font-weight="700" letter-spacing="1.6">${escapeXml(entry.genre)}</text>
      ${motifSvg(motif, accent, secondary)}
      <g fill="#fffdf0" stroke="#0a0b12" stroke-width="10" paint-order="stroke fill" filter="url(#shadow)" font-family="Arial Black,Arial,sans-serif" font-weight="900" letter-spacing="-1">
        ${title}
      </g>
      <rect x="25" y="344" width="484" height="65" rx="13" fill="#f3f0d9" opacity=".95"/>
      <text x="42" y="372" fill="#10131d" font-family="Arial Black,Arial,sans-serif" font-size="17" font-weight="900">${escapeXml(entry.author)}</text>
      <text x="42" y="394" fill="#303541" font-family="Arial,Helvetica,sans-serif" font-size="14" font-weight="700">${escapeXml(entry.license)} · ${escapeXml(entry.version)}</text>
      <rect x="455" y="354" width="41" height="41" rx="8" fill="${background}"/>
      <text x="475.5" y="382" text-anchor="middle" fill="${accent}" font-family="Arial Black,Arial,sans-serif" font-size="18" font-weight="900">GX</text>
      <rect x="7" y="7" width="520" height="424" rx="16" fill="none" stroke="#e9e4c8" stroke-width="6" opacity=".8"/>
    </svg>
  `);
}

function roundedMaskSvg() {
  const { width, height, radius } = frontRegion;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}" fill="#fff"/></svg>`);
}

async function renderFront(entry, inPocket) {
  const upright = await sharp(labelSvg(entry)).png().toBuffer();
  let front = await sharp(upright)
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
  const value = hex.replace('#', '');
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

async function bakeTexture(baseFile, outputFile, front, shellColor) {
  const { r, g, b } = hexToRgb(shellColor);
  const shellLuma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const brightness = Math.min(1.3, Math.max(0.3, shellLuma / 0.6));
  const tintedBase = await sharp(baseFile)
    .modulate({ brightness })
    .tint({ r, g, b })
    .png()
    .toBuffer();

  await sharp(tintedBase)
    .composite([{ input: front, left: frontRegion.left, top: frontRegion.top }])
    .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
    .toFile(resolve(texturesDir, outputFile));
}

for (const entry of await loadManifest()) {
  const standardFront = await renderFront(entry, false);
  const pocketFront = await renderFront(entry, true);
  await bakeTexture(standardBase, entry.outputs.standard, standardFront, entry.shellColor);
  await bakeTexture(inPocketBase, entry.outputs.inPocket, pocketFront, entry.shellColor);
  console.log(`wrote ${entry.outputs.standard} and ${entry.outputs.inPocket}`);
}

console.log('all 15 cartridge textures generated from truthful homebrew metadata');
