import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const baseScenePath = path.join(root, 'apps/game-boy/src/core/base-scene.ts');
const runtimePath = path.join(root, 'apps/game-boy/src/core/pixi-runtime.ts');
const liteRuntimePath = path.join(root, 'apps/game-boy/src/core/pixi-lite.ts');
const builtAssetsDir = path.join(root, 'public/game-boy/assets');
const viteConfigPath = path.join(root, 'apps/game-boy/vite.config.js');

function fail(message) {
  console.error(`Game Boy Pixi runtime verification failed: ${message}`);
  process.exit(1);
}

function readText(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`Missing file: ${path.relative(root, filePath)}`);
  }

  return fs.readFileSync(filePath, 'utf8');
}

const baseScene = readText(baseScenePath);

if (!baseScene.includes("import './pixi-runtime'")) {
  fail('base-scene.ts must import the explicit Pixi runtime setup.');
}

const skipExtensionImportsCount = [...baseScene.matchAll(/skipExtensionImports:\s*true/g)].length;

if (skipExtensionImportsCount !== 2) {
  fail(`Both Pixi Application.init calls must set skipExtensionImports: true. Found ${skipExtensionImportsCount}.`);
}

const runtime = readText(runtimePath);
const liteRuntime = readText(liteRuntimePath);
const viteConfig = readText(viteConfigPath);

if (!viteConfig.includes('pixi-lite.ts')) {
  fail('Game Boy Vite config must alias the Pixi barrel import to pixi-lite.ts.');
}

const requiredImports = [
  "pixi.js/app",
  "pixi.js/events",
  "pixi.js/graphics",
  "pixi.js/text",
  "pixi.js/filters",
];

for (const importPath of requiredImports) {
  if (!runtime.includes(importPath)) {
    fail(`pixi-runtime.ts must explicitly import ${importPath}.`);
  }
}

if (runtime.includes("pixi.js/accessibility") || runtime.includes("browserAll")) {
  fail('pixi-runtime.ts must not import Pixi accessibility or browserAll.');
}

if (!liteRuntime.includes("spritesheet/init.mjs")) {
  fail('pixi-lite.ts must register the Pixi spritesheet parser.');
}

if (liteRuntime.includes("pixi.js/accessibility") || liteRuntime.includes("browserAll") || liteRuntime.includes("webworkerAll")) {
  fail('pixi-lite.ts must not import Pixi accessibility or all-environment bundles.');
}

if (fs.existsSync(builtAssetsDir)) {
  const jsFiles = fs.readdirSync(builtAssetsDir)
    .filter((filename) => filename.endsWith('.js'))
    .map((filename) => path.join(builtAssetsDir, filename));

  for (const jsFile of jsFiles) {
    const basename = path.basename(jsFile);
    const text = fs.readFileSync(jsFile, 'utf8');
    const filename = path.relative(root, jsFile);

    if (/^(browserAll|webworkerAll)-/.test(basename)) {
      fail(`Built output must not include Pixi all-environment extension bundle: ${filename}`);
    }

    for (const forbidden of ['browserAll', 'webworkerAll', 'MutationObserver', 'select to enable accessibility', 'setAccessibilityEnabled']) {
      if (text.includes(forbidden)) {
        fail(`Built asset still includes ${forbidden}: ${filename}`);
      }
    }
  }
}

console.log('Game Boy Pixi runtime verified.');
