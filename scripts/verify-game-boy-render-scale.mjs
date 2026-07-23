import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const baseScenePath = path.join(root, 'apps/game-boy/src/core/base-scene.ts');

function fail(message) {
  console.error(`Game Boy render scale verification failed: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(baseScenePath)) {
  fail(`Missing file: ${path.relative(root, baseScenePath)}`);
}

const baseScene = fs.readFileSync(baseScenePath, 'utf8');

if (!baseScene.includes('private getRenderPixelRatio(): number')) {
  fail('BaseScene must centralize render pixel ratio calculation.');
}

if (!baseScene.includes('Math.max(1, Math.min(window.devicePixelRatio, SCENE_CONFIG.maxPixelRatio))')) {
  fail('Render pixel ratio must never drop below 1.');
}

if ((baseScene.match(/this\.getRenderPixelRatio\(\)/g) ?? []).length < 4) {
  fail('Renderer, resize, composer, and FXAA paths must use getRenderPixelRatio().');
}

console.log('Game Boy render scale verified.');
