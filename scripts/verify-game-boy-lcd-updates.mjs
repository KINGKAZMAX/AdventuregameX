import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

// Guards the Game Boy LCD refresh path. The LCD is a Three shader texture wrapping
// the live Pixi canvas; it must be re-uploaded every frame WHILE POWERED ON.
// A previous bug froze it after the first frame (isFirstTextureUpdate ->
// GAME_BOY_CONFIG.updateTexture = false), leaving the screen blank/green.
// See LOOP-TASKS.md (T5).

const root = process.cwd();

function fail(message) {
  console.error(`Game Boy LCD update verification failed: ${message}`);
  process.exit(1);
}

function readText(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`Missing file: ${path.relative(root, filePath)}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

const gameBoy = readText(
  path.join(root, 'apps/game-boy/src/scene/game-boy-scene/game-boy/game-boy.ts'),
);
const games = readText(
  path.join(root, 'apps/game-boy/src/scene/game-boy-scene/game-boy-games/game-boy-games.ts'),
);

// 1) The one-shot freeze must not come back.
if (gameBoy.includes('isFirstTextureUpdate')) {
  fail('game-boy.ts must not re-introduce isFirstTextureUpdate (it froze the LCD after frame 1).');
}

// 2) updateScreenTexture must not disable updates from inside its own loop.
const updateFn = gameBoy.slice(
  gameBoy.indexOf('private updateScreenTexture'),
  gameBoy.indexOf('private updateButtonsRepeat'),
);
if (updateFn === '' ) {
  fail('Could not locate updateScreenTexture() in game-boy.ts.');
}
if (/updateTexture\s*=\s*false/.test(updateFn)) {
  fail('updateScreenTexture() must not set GAME_BOY_CONFIG.updateTexture = false (freezes the LCD).');
}

// 3) It must still request a texture upload.
if (!updateFn.includes('uBitmapTexture.value.needsUpdate = true')) {
  fail('updateScreenTexture() must set uBitmapTexture.value.needsUpdate = true.');
}

// 4) Power on enables continuous refresh; power off (and only power off) stops it.
if (!/onPowerOn[\s\S]*?GAME_BOY_CONFIG\.updateTexture = true/.test(games)) {
  fail('onPowerOn() must set GAME_BOY_CONFIG.updateTexture = true.');
}
if (!/onPowerOff[\s\S]*?GAME_BOY_CONFIG\.updateTexture = false/.test(games)) {
  fail('onPowerOff() must set GAME_BOY_CONFIG.updateTexture = false.');
}

console.log('Game Boy LCD update path verified (continuous refresh while powered on).');
