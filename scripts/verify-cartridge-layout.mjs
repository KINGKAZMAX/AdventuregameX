import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const cartridgeConfigPath = path.join(root, 'apps/game-boy/src/scene/game-boy-scene/cartridges/data/cartridges-config.ts');
const cartridgesControllerPath = path.join(root, 'apps/game-boy/src/scene/game-boy-scene/cartridges/cartridges-controller.ts');
const gameBoyDebugPath = path.join(root, 'apps/game-boy/src/scene/game-boy-scene/game-boy-debug.ts');
const manifestPath = path.join(root, 'apps/game-boy/tools/homebrew-cartridges.json');

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
const gameBoyDebug = readText(gameBoyDebugPath);
const manifest = JSON.parse(readText(manifestPath));

if (!controller.includes('Math.sign(cartridge.startPosition.x)')) {
  fail('Zoom layout must move cartridges outward per side.');
}

const ARC_ORDER = [
  'Adjustris', 'BrekstasCat', 'Airplanz', 'CrossConnect', 'DysonsFear',
  'UnstoppableKnight', 'Wyrmhole', 'TobuTobuGirl', 'MicroCity', 'Game2048',
  'GbCorp', 'Carazu', 'ShockLobster', 'Geometrix', 'GbWordyl',
];
const ARCHIVE_ORDER = ['Tetris', 'SpaceInvaders'];

const manifestOrder = manifest.map((entry) => entry.cartridgeType);
if (JSON.stringify(manifestOrder) !== JSON.stringify(ARC_ORDER)) {
  fail(`Main manifest order must match the horseshoe. Expected ${ARC_ORDER.join(',')}, got ${manifestOrder.join(',')}.`);
}

const arcItems = ARC_ORDER.map((type) => ({
  type,
  position: parseVector(config, type, 'startPosition'),
  rotation: parseVector(config, type, 'rotation'),
  amplitude: parseNumber(config, type, 'amplitude'),
}));
const count = arcItems.length;
const centerIndex = (count - 1) / 2;
const circle = { cy: 0.3, r: 4.0 };

for (const item of arcItems) {
  const radius = Math.hypot(item.position.x, item.position.y - circle.cy);
  if (Math.abs(radius - circle.r) > 0.12) {
    fail(`${item.type} is off the horseshoe circle (radius=${radius.toFixed(2)}).`);
  }
  if (item.position.z > -0.25 || item.position.z < -0.85) {
    fail(`${item.type} must have z in [-0.85,-0.25], found ${item.position.z}.`);
  }
  if (item.rotation.x > 0) {
    fail(`${item.type} must keep the shared forward-facing x rotation.`);
  }
}

if (Math.abs(arcItems[centerIndex].position.x) > 0.05) {
  fail(`Arc centre ${arcItems[centerIndex].type} must be at x=0.`);
}
for (let index = 0; index < centerIndex; index += 1) {
  const left = arcItems[index];
  const right = arcItems[count - 1 - index];
  if (Math.abs(left.position.x + right.position.x) > 0.05) {
    fail(`${left.type}/${right.type} are not x-mirrored.`);
  }
  if (Math.abs(left.position.y - right.position.y) > 0.03) {
    fail(`${left.type}/${right.type} must share height.`);
  }
  if (Math.abs(left.position.z - right.position.z) > 0.03) {
    fail(`${left.type}/${right.type} must share depth.`);
  }
}

for (let index = 1; index <= centerIndex; index += 1) {
  if (arcItems[index].position.y < arcItems[index - 1].position.y - 0.001) {
    fail(`Arc height drops toward the centre at ${arcItems[index].type}.`);
  }
  if (arcItems[index].position.z < arcItems[index - 1].position.z - 0.001) {
    fail(`Depth bowl breaks at ${arcItems[index].type}.`);
  }
}
if (arcItems[centerIndex].position.y < 3) {
  fail(`Arc top ${arcItems[centerIndex].type} must clear the Game Boy.`);
}

for (let index = 1; index < arcItems.length; index += 1) {
  const previous = arcItems[index - 1].position;
  const current = arcItems[index].position;
  const distance = Math.hypot(previous.x - current.x, previous.y - current.y);
  if (distance < 1.3) {
    fail(`Neighbours ${arcItems[index - 1].type}/${arcItems[index].type} are too close (${distance.toFixed(2)}).`);
  }
}

for (let leftIndex = 0; leftIndex < arcItems.length; leftIndex += 1) {
  for (let rightIndex = leftIndex + 1; rightIndex < arcItems.length; rightIndex += 1) {
    const left = arcItems[leftIndex].position;
    const right = arcItems[rightIndex].position;
    if (Math.hypot(left.x - right.x, left.y - right.y) < 1) {
      fail(`${arcItems[leftIndex].type}/${arcItems[rightIndex].type} occupy nearly the same spot.`);
    }
  }
}

for (const archived of ARCHIVE_ORDER) {
  const position = parseVector(config, archived, 'startPosition');
  if (position.y < 6) {
    fail(`${archived} must remain stored off-screen (y >= 6).`);
  }
  if (!gameBoyDebug.includes(`CARTRIDGE_TYPE.${archived}`)) {
    fail(`${archived} is missing from the Archive control.`);
  }
}
if (!gameBoyDebug.includes('Archive') || !gameBoyDebug.includes('Collection')) {
  fail('Control panel must separate Collection and Archive cartridge lists.');
}

for (const entry of manifest) {
  const standard = entry.outputs?.standard?.replace(/\.jpg$/, '');
  const inPocket = entry.outputs?.inPocket?.replace(/\.jpg$/, '');
  if (!standard || !inPocket) {
    fail(`${entry.cartridgeType} is missing generated texture names.`);
  }
  const blockPattern = new RegExp(
    `\\[CARTRIDGE_TYPE\\.${entry.cartridgeType}\\]:\\s*\\{[\\s\\S]*?texture:\\s*'${standard}'[\\s\\S]*?textureInPocket:\\s*'${inPocket}'`,
  );
  if (!blockPattern.test(config)) {
    fail(`${entry.cartridgeType} is not mapped to ${standard}/${inPocket}.`);
  }
}

console.log('15-cartridge horseshoe + 2-cartridge Archive layout verified.');
