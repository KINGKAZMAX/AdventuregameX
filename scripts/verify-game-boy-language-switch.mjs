import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

// Guards that the Game Boy language switch lives INSIDE its Control panel and
// drives the hub via postMessage (not the hub side panel). See LOOP-TASKS.md (T2).

const root = process.cwd();

function fail(message) {
  console.error(`Game Boy language-switch verification failed: ${message}`);
  process.exit(1);
}

function readText(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`Missing file: ${path.relative(root, filePath)}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

// 1) Source of truth: the Game Boy debug/Control-panel module adds a Language
//    control and posts the shared message to the parent hub.
const debugSource = readText(
  path.join(root, 'apps/game-boy/src/scene/game-boy-scene/game-boy-debug.ts'),
);
for (const snippet of ['initLanguageControl', "label: 'Language'", 'gamex:set-language', 'window.parent.postMessage']) {
  if (!debugSource.includes(snippet)) {
    fail(`game-boy-debug.ts must include the Control-panel language control: ${snippet}`);
  }
}

// 2) Built Game Boy bundle must carry the Language control + message.
const publicAssetsDir = path.join(root, 'public/game-boy/assets');
if (!fs.existsSync(publicAssetsDir)) {
  fail('Missing built Game Boy assets dir: public/game-boy/assets');
}
const builtJs = fs.readdirSync(publicAssetsDir)
  .filter((name) => name.endsWith('.js'))
  .map((name) => fs.readFileSync(path.join(publicAssetsDir, name), 'utf8'))
  .join('\n');
for (const snippet of ['gamex:set-language', 'Language']) {
  if (!builtJs.includes(snippet)) {
    fail(`Built public/game-boy bundle must contain "${snippet}" (rebuild + sync public/game-boy).`);
  }
}

// 3) Hub listens for the message and the Game Boy view hides the hub side-panel toggle.
const hubMain = readText(path.join(root, 'src/main.js'));
if (!hubMain.includes('gamex:set-language')) {
  fail('src/main.js must listen for the gamex:set-language message.');
}
if (!hubMain.includes("addEventListener('message'")) {
  fail('src/main.js must register a window message listener.');
}
if (!hubMain.includes("active.id === 'game-boy' ? ''")) {
  fail('Hub must hide its side-panel language toggle while Game Boy is active.');
}

console.log('Game Boy language switch verified (in Control panel, drives hub).');
