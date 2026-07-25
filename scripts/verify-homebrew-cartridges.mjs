// Guards the truthful 15-cartridge open-homebrew collection plus the two
// preserved GameX built-ins in Archive. This verifier intentionally treats the
// manifest as the single source of truth for labels, ROMs and legal notices.

import crypto from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const gameBoyRequire = createRequire(path.join(root, 'apps/game-boy/package.json'));
const appRoot = path.join(root, 'apps/game-boy');
const manifestPath = path.join(appRoot, 'tools/homebrew-cartridges.json');
const pokemonManifestPath = path.join(appRoot, 'tools/pokemon-cartridges.json');
const pokemonSourcesDir = path.join(appRoot, 'tools/sources');
const bakerPath = path.join(appRoot, 'tools/build-cartridges.mjs');
const cartridgeConfigPath = path.join(appRoot, 'src/scene/game-boy-scene/cartridges/data/cartridges-config.ts');
const cartridgeInfoPath = path.join(appRoot, 'src/scene/game-boy-scene/cartridges/data/cartridge-info-config.ts');
const emulatorConfigPath = path.join(appRoot, 'src/scene/game-boy-scene/game-boy-games/games/emulator/emulator-games-config.ts');
const emulatorGamePath = path.join(appRoot, 'src/scene/game-boy-scene/game-boy-games/games/emulator/emulator-game.ts');
const gameBoyGamesPath = path.join(appRoot, 'src/scene/game-boy-scene/game-boy-games/game-boy-games.ts');
const gameBoyControllerPath = path.join(appRoot, 'src/scene/game-boy-scene/game-boy-scene-controller.ts');
const gameBoyDebugPath = path.join(appRoot, 'src/scene/game-boy-scene/game-boy-debug.ts');
const tetrisPath = path.join(appRoot, 'src/scene/game-boy-scene/game-boy-games/games/tetris/tetris.ts');
const spaceInvadersPath = path.join(appRoot, 'src/scene/game-boy-scene/game-boy-games/games/space-invaders/space-invaders.ts');
const vendorWasmboyPath = path.join(appRoot, 'src/vendor/wasmboy/wasmboy.esm.js');
const textureDir = path.join(appRoot, 'public/textures');
const romDir = path.join(appRoot, 'public/roms');
const licensesDir = path.join(romDir, 'licenses');
const sourcesDir = path.join(romDir, 'sources');
const attributionPath = path.join(romDir, 'ATTRIBUTION.md');
const sharp = gameBoyRequire('sharp');

const EXPECTED_MAIN_CARTRIDGES = [
  ['Adjustris', 'ADJUSTRIS', 'adjustris.gb'],
  ['BrekstasCat', "BREKSTA'S CAT", 'brekstascat.gb'],
  ['Airplanz', 'AIRPLANZ', 'airplanz.gb'],
  ['CrossConnect', 'CROSS CONNECT', 'cross-connect.gbc'],
  ['DysonsFear', "DYSON'S FEAR", 'dysons-fear.gb'],
  ['UnstoppableKnight', 'UNSTOPPABLE KNIGHT', 'unstoppable-knight.gb'],
  ['Wyrmhole', 'WYRMHOLE', 'wyrmhole.gb'],
  ['TobuTobuGirl', 'TOBU TOBU GIRL', 'tobutobugirl.gb'],
  ['MicroCity', 'MICRO CITY', 'ucity.gbc'],
  ['Game2048', '2048', '2048.gb'],
  ['GbCorp', 'GB CORP.', 'gbcorp.gb'],
  ['Carazu', 'CARAZU', 'carazu.gb'],
  ['ShockLobster', 'SHOCK LOBSTER', 'shock-lobster.gb'],
  ['Geometrix', 'GEOMETRIX', 'geometrix.gbc'],
  ['GbWordyl', 'GB WORDYL', 'gb-wordyl.gb'],
];

const LEGACY_ACTIVE_IDS = [
  'JpRed', 'JpGreen', 'JpBlue', 'JpPikachu', 'UsRed', 'UsBlue', 'Pinball',
  'UsYellow', 'JpGold', 'JpSilver', 'Tcg', 'UsGold', 'UsSilver', 'Puzzle', 'UsCrystal',
];

const NINTENDO_LOGO = Buffer.from([
  0xce, 0xed, 0x66, 0x66, 0xcc, 0x0d, 0x00, 0x0b,
  0x03, 0x73, 0x00, 0x83, 0x00, 0x0c, 0x00, 0x0d,
  0x00, 0x08, 0x11, 0x1f, 0x88, 0x89, 0x00, 0x0e,
  0xdc, 0xcc, 0x6e, 0xe6, 0xdd, 0xdd, 0xd9, 0x99,
  0xbb, 0xbb, 0x67, 0x63, 0x6e, 0x0e, 0xec, 0xcc,
  0xdd, 0xdc, 0x99, 0x9f, 0xbb, 0xb9, 0x33, 0x3e,
]);

const requiredFields = [
  'key', 'title', 'genre', 'author', 'license', 'version', 'year',
  'cartridgeType', 'romFile', 'releaseUrl', 'sourceUrl', 'sha256',
  'licenseFile', 'shellColor', 'outputs', 'theme',
];

function fail(message) {
  console.error(`Homebrew cartridge verification failed: ${message}`);
  process.exit(1);
}

function readText(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`Missing file: ${path.relative(root, filePath)}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function unique(values, label) {
  if (new Set(values).size !== values.length) {
    fail(`${label} values must be unique.`);
  }
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function verifyRomHeader(rom, romFile) {
  if (rom.length < 0x150) {
    fail(`${romFile} is too short to contain a Game Boy header.`);
  }
  if (!rom.subarray(0x104, 0x134).equals(NINTENDO_LOGO)) {
    fail(`${romFile} has an invalid Nintendo logo in its Game Boy header.`);
  }

  let headerChecksum = 0;
  for (let offset = 0x134; offset <= 0x14c; offset += 1) {
    headerChecksum = (headerChecksum - rom[offset] - 1) & 0xff;
  }
  if (headerChecksum !== rom[0x14d]) {
    fail(`${romFile} has an invalid header checksum.`);
  }

  let globalChecksum = 0;
  for (let offset = 0; offset < rom.length; offset += 1) {
    if (offset !== 0x14e && offset !== 0x14f) {
      globalChecksum = (globalChecksum + rom[offset]) & 0xffff;
    }
  }
  const declaredGlobalChecksum = (rom[0x14e] << 8) | rom[0x14f];
  if (globalChecksum !== declaredGlobalChecksum) {
    fail(`${romFile} has an invalid global checksum.`);
  }
}

async function imageSize(filePath) {
  const metadata = await sharp(filePath).metadata();
  return { width: metadata.width, height: metadata.height };
}

const manifest = JSON.parse(readText(manifestPath));
if (!Array.isArray(manifest)) {
  fail('Manifest must be a JSON array.');
}
if (manifest.length !== EXPECTED_MAIN_CARTRIDGES.length) {
  fail(`Manifest must contain exactly 15 main cartridges, found ${manifest.length}.`);
}

for (const entry of manifest) {
  for (const field of requiredFields) {
    if (entry[field] === undefined) {
      fail(`Manifest entry ${entry.key ?? '<unknown>'} is missing "${field}".`);
    }
  }
  for (const nested of ['standard', 'inPocket']) {
    if (!entry.outputs?.[nested]) {
      fail(`Manifest entry ${entry.key} is missing outputs.${nested}.`);
    }
  }
  for (const nested of ['background', 'accent', 'secondary', 'motif', 'series']) {
    if (!entry.theme?.[nested]) {
      fail(`Manifest entry ${entry.key} is missing theme.${nested}.`);
    }
  }
}

const actualTriples = manifest.map((entry) => [entry.cartridgeType, entry.title, entry.romFile]);
if (JSON.stringify(actualTriples) !== JSON.stringify(EXPECTED_MAIN_CARTRIDGES)) {
  fail(`Manifest order/identity mismatch. Expected ${JSON.stringify(EXPECTED_MAIN_CARTRIDGES)}, got ${JSON.stringify(actualTriples)}.`);
}

for (const [field, label] of [
  ['key', 'Manifest key'],
  ['cartridgeType', 'Cartridge type'],
  ['title', 'Label title'],
  ['romFile', 'ROM file'],
  ['sha256', 'ROM SHA-256'],
]) {
  unique(manifest.map((entry) => entry[field]), label);
}

// The old scan manifest and source photos are historical inputs that the user
// asked us to retain. They must remain present while leaving the active build.
const pokemonManifest = JSON.parse(readText(pokemonManifestPath));
if (!Array.isArray(pokemonManifest) || pokemonManifest.length !== 15) {
  fail('Historical pokemon-cartridges.json must remain intact with 15 entries.');
}
for (const entry of pokemonManifest) {
  const sourceImage = path.join(pokemonSourcesDir, entry.sourceImage);
  if (!fs.existsSync(sourceImage)) {
    fail(`Historical Pokemon source is missing: ${path.relative(root, sourceImage)}.`);
  }
}

const baker = readText(bakerPath);
for (const forbidden of ['pokemon-cartridges.json', 'tools/sources', 'fetch(', 'imageUrl', 'sourceImage', 'labelCrop']) {
  if (baker.includes(forbidden)) {
    fail(`Active label generator must not reference "${forbidden}".`);
  }
}
for (const required of ['homebrew-cartridges.json', '<svg', 'GAMEX HOMEBREW', '.rotate(270)']) {
  if (!baker.includes(required)) {
    fail(`Active label generator is missing "${required}".`);
  }
}

const cartridgeConfig = readText(cartridgeConfigPath);
const cartridgeInfo = readText(cartridgeInfoPath);
const emulatorConfig = readText(emulatorConfigPath);
const gameBoyGames = readText(gameBoyGamesPath);
const gameBoyController = readText(gameBoyControllerPath);
const gameBoyDebug = readText(gameBoyDebugPath);
const tetris = readText(tetrisPath);
const spaceInvaders = readText(spaceInvadersPath);

for (const legacy of LEGACY_ACTIVE_IDS) {
  if (cartridgeConfig.includes(` ${legacy} =`) || cartridgeConfig.includes(`CARTRIDGE_TYPE.${legacy}`)) {
    fail(`Active cartridge config still uses legacy Pokemon identity "${legacy}".`);
  }
}
if (cartridgeConfig.includes('GAME_TYPE.PocketCreatures')) {
  fail('A selectable cartridge still maps to GAME_TYPE.PocketCreatures.');
}
if (cartridgeInfo.includes("kind: 'display'") || cartridgeInfo.includes('Sleeve: Pokémon') || cartridgeInfo.includes('卡带外观：宝可梦')) {
  fail('Cartridge info still exposes a Pokemon display/sleeve identity.');
}

for (const [cartridgeType, title, romFile] of EXPECTED_MAIN_CARTRIDGES) {
  for (const [text, source] of [
    [`CARTRIDGE_TYPE.${cartridgeType}`, cartridgeConfig],
    [`CARTRIDGE_TYPE.${cartridgeType}`, emulatorConfig],
    [`CARTRIDGE_TYPE.${cartridgeType}`, cartridgeInfo],
    [`title: '${title.replaceAll("'", "\\'")}'`, emulatorConfig],
    [`romFile: '${romFile}'`, emulatorConfig],
  ]) {
    if (!source.includes(text)) {
      fail(`Runtime config is missing "${text}".`);
    }
  }
}

for (const archiveType of ['Tetris', 'SpaceInvaders']) {
  if (!cartridgeConfig.includes(`CARTRIDGE_TYPE.${archiveType}`)) {
    fail(`${archiveType} must remain a selectable Archive cartridge.`);
  }
  if (!gameBoyDebug.includes(`CARTRIDGE_TYPE.${archiveType}`)) {
    fail(`${archiveType} must remain insertable from the Control panel Archive.`);
  }
}
for (const required of ['Archive', 'Collection']) {
  if (!gameBoyDebug.includes(required)) {
    fail(`Control panel is missing the "${required}" cartridge group.`);
  }
}

for (const entry of manifest) {
  const romPath = path.join(romDir, entry.romFile);
  if (!fs.existsSync(romPath)) {
    fail(`Missing ROM: public/roms/${entry.romFile}`);
  }
  const rom = fs.readFileSync(romPath);
  verifyRomHeader(rom, entry.romFile);
  if (sha256(romPath) !== entry.sha256) {
    fail(`${entry.romFile} SHA-256 does not match the manifest.`);
  }

  if (!emulatorConfig.includes(`'${entry.romFile}'`)) {
    fail(`emulator-games-config.ts does not reference ROM ${entry.romFile}.`);
  }

  const licensePath = path.join(licensesDir, entry.licenseFile);
  if (!fs.existsSync(licensePath)) {
    fail(`${entry.romFile} is missing license file ${entry.licenseFile}.`);
  }
  if (/GPL/i.test(entry.license)) {
    if (!entry.sourceArchive) {
      fail(`${entry.romFile} uses ${entry.license} but has no sourceArchive field.`);
    }
    if (!fs.existsSync(path.join(sourcesDir, entry.sourceArchive))) {
      fail(`${entry.romFile} is missing GPL source archive ${entry.sourceArchive}.`);
    }
  }

  for (const output of [entry.outputs.standard, entry.outputs.inPocket]) {
    const texturePath = path.join(textureDir, output);
    if (!fs.existsSync(texturePath)) {
      fail(`Missing generated cartridge texture: ${output}.`);
    }
    const size = await imageSize(texturePath);
    if (size.width !== 1024 || size.height !== 1024) {
      fail(`${output} must be 1024x1024, found ${size.width}x${size.height}.`);
    }
  }
}

const attribution = readText(attributionPath);
for (const entry of manifest) {
  for (const required of [entry.romFile, entry.version, entry.license, entry.releaseUrl, entry.sourceUrl, entry.sha256]) {
    if (!attribution.includes(required)) {
      fail(`ATTRIBUTION.md is missing "${required}" for ${entry.romFile}.`);
    }
  }
}
if (/Pokemon|Pokémon|Bulbagarden|gbhwdb|game-boy-database|vgcollect/i.test(attribution)) {
  fail('Active ROM attribution still describes Pokemon cartridge scans.');
}

const emulatorGame = readText(emulatorGamePath);
for (const required of ['WasmBoy.config', 'loadROM', 'setJoypadState', 'saveState', 'loadState', 'saveLoadedCartridge', 'disableDefaultJoypad']) {
  if (!emulatorGame.includes(required)) {
    fail(`emulator-game.ts lost required emulator call "${required}".`);
  }
}

for (const required of ['saveCurrentGameState', 'loadCurrentGameState', 'GAME_TYPE.Tetris', 'GAME_TYPE.SpaceInvaders', 'GAME_TYPE.Emulator']) {
  if (!gameBoyGames.includes(required)) {
    fail(`game-boy-games.ts is missing unified save routing token "${required}".`);
  }
}
for (const forbidden of ['saveEmulatorState', 'loadEmulatorState']) {
  if (gameBoyController.includes(forbidden)) {
    fail(`game-boy-scene-controller.ts still calls emulator-only method "${forbidden}".`);
  }
}
for (const required of ['captureState', 'restoreState']) {
  if (!tetris.includes(required)) {
    fail(`Tetris is missing native snapshot method "${required}".`);
  }
  if (!spaceInvaders.includes(required)) {
    fail(`Space Invaders is missing native snapshot method "${required}".`);
  }
}
for (const required of [
  'gamex:builtin-save:TETRIS:v1',
  'gamex:builtin-save:SPACE_INVADERS:v1',
]) {
  if (!gameBoyGames.includes(required)) {
    fail(`Unified save router is missing storage key "${required}".`);
  }
}
for (const required of ['saveStateButtonClicked', 'loadStateButtonClicked', 'Save states']) {
  if (!gameBoyDebug.includes(required)) {
    fail(`game-boy-debug.ts lost the save-state panel token "${required}".`);
  }
}

if (!fs.existsSync(vendorWasmboyPath)) {
  fail('Vendored WasmBoy bundle is missing.');
}

const syncedRomDir = path.join(root, 'public/game-boy/roms');
if (fs.existsSync(path.join(root, 'public/game-boy'))) {
  for (const entry of manifest) {
    if (!fs.existsSync(path.join(syncedRomDir, entry.romFile))) {
      fail(`Synced Hub build is missing public/game-boy/roms/${entry.romFile}.`);
    }
  }
}

console.log('Truthful 15-cartridge collection + 2-cartridge Archive verified.');
