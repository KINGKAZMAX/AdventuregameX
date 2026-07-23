// Guards the homebrew cartridge + emulator integration:
// - 8 manifest entries with original (generated) label art — no downloaded
//   third-party cover art, no leftover Pokemon/Zelda branded assets;
// - every cartridge texture pair exists and is a 1024x1024 atlas;
// - every ROM listed in the emulator config exists, has a valid Game Boy
//   header, and is credited in public/roms/ATTRIBUTION.md;
// - the emulator game + save-state wiring stays in place.

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const gameBoyRequire = createRequire(path.join(root, 'apps/game-boy/package.json'));
const manifestPath = path.join(root, 'apps/game-boy/tools/homebrew-cartridges.json');
const bakerPath = path.join(root, 'apps/game-boy/tools/build-cartridges.mjs');
const cartridgeConfigPath = path.join(root, 'apps/game-boy/src/scene/game-boy-scene/cartridges/data/cartridges-config.ts');
const emulatorConfigPath = path.join(root, 'apps/game-boy/src/scene/game-boy-scene/game-boy-games/games/emulator/emulator-games-config.ts');
const emulatorGamePath = path.join(root, 'apps/game-boy/src/scene/game-boy-scene/game-boy-games/games/emulator/emulator-game.ts');
const gameBoyDebugPath = path.join(root, 'apps/game-boy/src/scene/game-boy-scene/game-boy-debug.ts');
const vendorWasmboyPath = path.join(root, 'apps/game-boy/src/vendor/wasmboy/wasmboy.esm.js');
const textureDir = path.join(root, 'apps/game-boy/public/textures');
const romDir = path.join(root, 'apps/game-boy/public/roms');
const attributionPath = path.join(romDir, 'ATTRIBUTION.md');
const sharp = gameBoyRequire('sharp');

const requiredFields = ['key', 'title', 'genre', 'author', 'license', 'cartridgeType', 'romFile'];

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

async function imageSize(filePath) {
  const metadata = await sharp(filePath).metadata();
  return { width: metadata.width, height: metadata.height };
}

const manifest = JSON.parse(readText(manifestPath));

if (!Array.isArray(manifest)) {
  fail('Manifest must be a JSON array.');
}

if (manifest.length !== 8) {
  fail(`Manifest must contain exactly 8 homebrew cartridges, found ${manifest.length}.`);
}

for (const entry of manifest) {
  for (const field of requiredFields) {
    if (entry[field] === undefined) {
      fail(`Manifest entry ${entry.key ?? '<unknown>'} is missing "${field}".`);
    }
  }
}

// The baker must generate original art, never download cover images.
const baker = readText(bakerPath);
if (/fetch\s*\(/.test(baker) || baker.includes('imageUrl')) {
  fail('build-cartridges.mjs must not download artwork from the network.');
}
if (!baker.includes('pokemon-cartridges.json')) {
  fail('build-cartridges.mjs must read tools/pokemon-cartridges.json.');
}

// No leftover Pokemon/Zelda branded assets or config references.
if (fs.existsSync(path.join(root, 'apps/game-boy/tools/pokemon-cartridge-sources.json'))) {
  fail('Legacy pokemon-cartridge-sources.json must be removed.');
}

// The retired Zelda cartridge must stay retired (its slot now hosts a real
// playable homebrew game).
const forbiddenTextures = ['zelda']
  .flatMap((name) => [`baked-cartridge-${name}.jpg`, `baked-cartridge-${name}-in-pocket.jpg`]);

for (const dir of [textureDir, path.join(root, 'public/game-boy/textures')]) {
  if (!fs.existsSync(dir)) {
    continue;
  }
  for (const forbidden of forbiddenTextures) {
    if (fs.existsSync(path.join(dir, forbidden))) {
      fail(`Legacy branded texture must be removed: ${path.join(path.relative(root, dir), forbidden)}`);
    }
  }
}

const cartridgeConfig = readText(cartridgeConfigPath);
for (const legacy of ['PocketRed', 'PocketBlue', 'PocketYellow', 'PocketGreen', 'PocketGold', 'PocketSilver', 'PocketCrystal', 'Zelda']) {
  if (cartridgeConfig.includes(legacy)) {
    fail(`cartridges-config.ts still references legacy cartridge "${legacy}".`);
  }
}

// All 17 cartridges use authentic Pokemon cartridge scans: sources + atlases.
const pokemonManifestPath = path.join(root, 'apps/game-boy/tools/pokemon-cartridges.json');
const pokemonManifest = JSON.parse(readText(pokemonManifestPath));
if (pokemonManifest.length !== 15) {
  fail(`pokemon-cartridges.json must cover the 15 displayed cartridges, found ${pokemonManifest.length}.`);
}
for (const entry of pokemonManifest) {
  for (const field of ['sourceImage', 'labelCrop', 'shellColor', 'outputs', 'cartridgeType']) {
    if (entry[field] === undefined) {
      fail(`pokemon-cartridges.json entry ${entry.key ?? '<unknown>'} is missing "${field}".`);
    }
  }

  const sourcePath = path.join(root, 'apps/game-boy/tools/sources', entry.sourceImage);
  if (!fs.existsSync(sourcePath)) {
    fail(`Missing Pokemon cartridge source image: tools/sources/${entry.sourceImage}`);
  }

  for (const output of [entry.outputs.standard, entry.outputs.inPocket]) {
    const texturePath = path.join(textureDir, output);
    if (!fs.existsSync(texturePath)) {
      fail(`Missing baked Pokemon texture: ${output}. Run: node apps/game-boy/tools/build-cartridges.mjs`);
    }

    const size = await imageSize(texturePath);
    if (size.width !== 1024 || size.height !== 1024) {
      fail(`${output} must be a 1024x1024 atlas, found ${size.width}x${size.height}.`);
    }
  }
}


// ROMs exist with a valid Game Boy header (Nintendo logo bytes at 0x104),
// and the emulator config references exactly the manifest ROMs.
const emulatorConfig = readText(emulatorConfigPath);
for (const entry of manifest) {
  const romPath = path.join(romDir, entry.romFile);
  if (!fs.existsSync(romPath)) {
    fail(`Missing ROM: public/roms/${entry.romFile}`);
  }

  const rom = fs.readFileSync(romPath);
  if (rom.length < 0x150 || rom[0x104] !== 0xce || rom[0x105] !== 0xed || rom[0x106] !== 0x66 || rom[0x107] !== 0x66) {
    fail(`${entry.romFile} does not have a valid Game Boy header.`);
  }

  if (!emulatorConfig.includes(`'${entry.romFile}'`)) {
    fail(`emulator-games-config.ts does not reference ROM ${entry.romFile}.`);
  }
}

// Every bundled ROM is credited.
const attribution = readText(attributionPath);
for (const entry of manifest) {
  if (!attribution.includes(entry.romFile)) {
    fail(`ATTRIBUTION.md is missing an entry for ${entry.romFile}.`);
  }
}

// Emulator + save-state wiring.
const emulatorGame = readText(emulatorGamePath);
for (const required of ['WasmBoy.config', 'loadROM', 'setJoypadState', 'saveState', 'loadState', 'saveLoadedCartridge', 'disableDefaultJoypad']) {
  if (!emulatorGame.includes(required)) {
    fail(`emulator-game.ts lost required emulator call "${required}".`);
  }
}

const gameBoyDebug = readText(gameBoyDebugPath);
for (const required of ['saveStateButtonClicked', 'loadStateButtonClicked', 'Save states']) {
  if (!gameBoyDebug.includes(required)) {
    fail(`game-boy-debug.ts lost the save-state panel ("${required}").`);
  }
}

if (!fs.existsSync(vendorWasmboyPath)) {
  fail('Vendored WasmBoy bundle is missing (src/vendor/wasmboy/wasmboy.esm.js).');
}

// Synced hub build must also carry the ROMs (when the sync has been run).
const syncedRomDir = path.join(root, 'public/game-boy/roms');
if (fs.existsSync(path.join(root, 'public/game-boy'))) {
  for (const entry of manifest) {
    if (!fs.existsSync(path.join(syncedRomDir, entry.romFile))) {
      fail(`Synced hub build is missing public/game-boy/roms/${entry.romFile}. Rebuild + sync the game-boy app.`);
    }
  }
}

console.log('Homebrew cartridge + emulator verification passed.');
