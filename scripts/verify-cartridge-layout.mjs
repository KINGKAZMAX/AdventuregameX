import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const cartridgeConfigPath = path.join(root, 'apps/game-boy/src/scene/game-boy-scene/cartridges/data/cartridges-config.ts');
const cartridgesControllerPath = path.join(root, 'apps/game-boy/src/scene/game-boy-scene/cartridges/cartridges-controller.ts');

function fail(message) {
  console.error(`Cartridge layout verification failed: ${message}`);
  process.exit(1);
}

function readText(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`Missing file: ${path.relative(root, filePath)}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function parseVector(text, key, property) {
  const pattern = new RegExp(`\\[CARTRIDGE_TYPE\\.${key}\\]:\\s*\\{[\\s\\S]*?${property}:\\s*new THREE\\.Vector3\\(([^)]+)\\)`);
  const match = text.match(pattern);
  if (!match) {
    fail(`Missing ${property} vector for ${key}.`);
  }

  const values = match[1].split(',').map((value) => Number(value.trim()));
  if (values.length !== 3 || values.some((value) => !Number.isFinite(value))) {
    fail(`Invalid ${property} vector for ${key}: ${match[1]}`);
  }
  return { x: values[0], y: values[1], z: values[2] };
}

function parseNumber(text, key, property) {
  const pattern = new RegExp(`\\[CARTRIDGE_TYPE\\.${key}\\]:\\s*\\{[\\s\\S]*?${property}:\\s*([0-9.]+)`);
  const match = text.match(pattern);
  if (!match) {
    fail(`Missing ${property} value for ${key}.`);
  }

  const value = Number(match[1]);
  if (!Number.isFinite(value)) {
    fail(`Invalid ${property} value for ${key}: ${match[1]}`);
  }
  return value;
}

const config = readText(cartridgeConfigPath);
const controller = readText(cartridgesControllerPath);

if (!controller.includes('Math.sign(cartridge.startPosition.x)')) {
  fail('Zoom layout must move cartridges outward per side, not all toward the original left-side direction.');
}

// All 15 releases sit on ONE symmetric horseshoe (a circle of radius ~4.0
// centred at y=0.3), listed here in arc order: lower-left (oldest) → top →
// lower-right (newest).
const ARC_ORDER = [
  'JpRed', 'JpGreen', 'JpBlue', 'JpPikachu', 'UsRed', 'UsBlue', 'Pinball',
  'UsYellow',
  'JpGold', 'JpSilver', 'Tcg', 'UsGold', 'UsSilver', 'Puzzle', 'UsCrystal',
];

const arcItems = ARC_ORDER.map((type) => ({
  type,
  position: parseVector(config, type, 'startPosition'),
  rotation: parseVector(config, type, 'rotation'),
  amplitude: parseNumber(config, type, 'amplitude'),
}));
const N = arcItems.length; // 15
const centerIdx = (N - 1) / 2; // 7

const CIRCLE = { cy: 0.3, r: 4.0 };

// Each cartridge lies on the shared circle (a uniform ring), just behind the
// Game Boy plane, arranged in a symmetric depth bowl (top nearest, ends
// furthest) so any residual edge overlap reads as cleanly fanned tiles.
for (const it of arcItems) {
  const radius = Math.hypot(it.position.x, it.position.y - CIRCLE.cy);
  if (Math.abs(radius - CIRCLE.r) > 0.12) {
    fail(`${it.type} is off the horseshoe circle (radius=${radius.toFixed(2)}, expected ${CIRCLE.r}).`);
  }
  if (it.position.z > -0.25 || it.position.z < -0.85) {
    fail(`${it.type} must sit just behind the Game Boy (z in [-0.85,-0.25]), found z=${it.position.z}.`);
  }
}

// The single top-centre cartridge is on the axis; every other has a mirror
// twin sharing |x|, y and z.
if (Math.abs(arcItems[centerIdx].position.x) > 0.05) {
  fail(`Arc centre ${arcItems[centerIdx].type} must be at x=0, found x=${arcItems[centerIdx].position.x}.`);
}
for (let i = 0; i < centerIdx; i += 1) {
  const a = arcItems[i];
  const b = arcItems[N - 1 - i];
  if (Math.abs(a.position.x + b.position.x) > 0.05) {
    fail(`Arc pair ${a.type}/${b.type} is not x-mirrored: ${a.position.x} vs ${b.position.x}.`);
  }
  if (Math.abs(a.position.y - b.position.y) > 0.03) {
    fail(`Arc pair ${a.type}/${b.type} must share height: ${a.position.y} vs ${b.position.y}.`);
  }
  if (Math.abs(a.position.z - b.position.z) > 0.03) {
    fail(`Arc pair ${a.type}/${b.type} must share depth: ${a.position.z} vs ${b.position.z}.`);
  }
}

// Height rises monotonically from the lower-left end to the top centre.
for (let i = 1; i <= centerIdx; i += 1) {
  if (arcItems[i].position.y < arcItems[i - 1].position.y - 0.001) {
    fail(`Arc must rise toward the top: y dropped ${arcItems[i - 1].type} -> ${arcItems[i].type}.`);
  }
}

// Depth bowl: z increases (nearer) toward the top centre, symmetric.
for (let i = 1; i <= centerIdx; i += 1) {
  if (arcItems[i].position.z < arcItems[i - 1].position.z - 0.001) {
    fail(`Depth bowl broken: z must increase toward the top ${arcItems[i - 1].type} -> ${arcItems[i].type}.`);
  }
}

// The top-centre cartridge clears the Game Boy.
if (arcItems[centerIdx].position.y < 3.0) {
  fail(`Arc top ${arcItems[centerIdx].type} must clear the Game Boy (y>=3.0), found ${arcItems[centerIdx].position.y}.`);
}

// Neighbours must be spread far enough apart that the ring does not collapse
// into a pile (centre-to-centre distance in the view plane).
const MIN_NEIGHBOUR_DIST = 1.30;
for (let i = 1; i < arcItems.length; i += 1) {
  const a = arcItems[i - 1].position;
  const b = arcItems[i].position;
  const d = Math.hypot(a.x - b.x, a.y - b.y);
  if (d < MIN_NEIGHBOUR_DIST) {
    fail(`Neighbours ${arcItems[i - 1].type}/${arcItems[i].type} too close (${d.toFixed(2)} < ${MIN_NEIGHBOUR_DIST}).`);
  }
}

// No two cartridges (adjacent or not) may occupy nearly the same spot.
for (let i = 0; i < arcItems.length; i += 1) {
  for (let j = i + 1; j < arcItems.length; j += 1) {
    const a = arcItems[i].position;
    const b = arcItems[j].position;
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (d < 1.0) {
      fail(`${arcItems[i].type} and ${arcItems[j].type} occupy nearly the same spot (${d.toFixed(2)}).`);
    }
  }
}

// Pokemon manifest → texture mapping and chronological order.
const pokemonManifestPath = path.join(root, 'apps/game-boy/tools/pokemon-cartridges.json');
const pokemonManifest = JSON.parse(readText(pokemonManifestPath));
if (pokemonManifest.length !== 15) {
  fail(`pokemon-cartridges.json must contain exactly 15 chronological entries, found ${pokemonManifest.length}.`);
}

const RELEASE_ORDER = ['jp-red', 'jp-green', 'jp-blue', 'jp-pikachu', 'us-red', 'us-blue', 'pinball', 'us-yellow', 'jp-gold', 'jp-silver', 'tcg', 'us-gold', 'us-silver', 'puzzle', 'us-crystal'];
const manifestKeys = pokemonManifest.map((entry) => entry.key);
if (JSON.stringify(manifestKeys) !== JSON.stringify(RELEASE_ORDER)) {
  fail(`Manifest must list releases in chronological order. Expected ${RELEASE_ORDER.join(',')} got ${manifestKeys.join(',')}.`);
}

// The arc must list the SAME 15 releases, in the same chronological order.
const arcKeys = ARC_ORDER.map((t) => t.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase());
if (JSON.stringify(arcKeys) !== JSON.stringify(RELEASE_ORDER)) {
  fail(`Arc order must match chronological release order. Got ${arcKeys.join(',')}.`);
}

// Storage: the original cartridges are parked well above the visible stage.
for (const stored of ['Tetris', 'SpaceInvaders']) {
  const position = parseVector(config, stored, 'startPosition');
  if (position.y < 6) {
    fail(`${stored} must be stored off-screen (y >= 6), found y=${position.y}.`);
  }
}

for (const entry of pokemonManifest) {
  const textures = {
    standard: entry.outputs.standard.replace(/\.jpg$/, ''),
    inPocket: entry.outputs.inPocket.replace(/\.jpg$/, ''),
  };
  const blockPattern = new RegExp(`\\[CARTRIDGE_TYPE\\.${entry.cartridgeType}\\]:\\s*\\{[\\s\\S]*?texture:\\s*'${textures.standard}'[\\s\\S]*?textureInPocket:\\s*'${textures.inPocket}'`);
  if (!blockPattern.test(config)) {
    fail(`${entry.cartridgeType} is not mapped to the expected texture pair ${textures.standard} / ${textures.inPocket}.`);
  }
}

console.log('Cartridge layout verified.');
