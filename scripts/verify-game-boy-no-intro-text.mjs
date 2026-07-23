import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const sourcePaths = [
  path.join(root, 'apps/game-boy/index.html'),
  path.join(root, 'apps/game-boy/src/core/base-scene.ts'),
  path.join(root, 'apps/game-boy/src/scene/game-boy-scene/game-boy-scene-controller.ts'),
];
const publicIndexPath = path.join(root, 'public/game-boy/index.html');
const publicAssetsDir = path.join(root, 'public/game-boy/assets');
const forbiddenBottomText = [
  'Click to start',
  'Made by',
  'Source code',
  'Nintendo logo is trademark',
  'Tetris logo and Tetriminos',
  'Space Invaders logo is trademark',
];

function fail(message) {
  console.error(`Game Boy intro text verification failed: ${message}`);
  process.exit(1);
}

function readText(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`Missing file: ${path.relative(root, filePath)}`);
  }

  return fs.readFileSync(filePath, 'utf8');
}

for (const sourcePath of sourcePaths) {
  const source = readText(sourcePath);
  for (const text of forbiddenBottomText) {
    if (source.includes(text)) {
      fail(`Source must not render bottom text "${text}": ${path.relative(root, sourcePath)}`);
    }
  }
}

if (fs.existsSync(publicIndexPath)) {
  const publicIndex = fs.readFileSync(publicIndexPath, 'utf8');
  for (const text of forbiddenBottomText) {
    if (publicIndex.includes(text)) {
      fail(`Public Game Boy HTML still contains bottom text "${text}".`);
    }
  }
}

if (fs.existsSync(publicAssetsDir)) {
  const builtJsFiles = fs.readdirSync(publicAssetsDir)
    .filter((filename) => filename.endsWith('.js'))
    .map((filename) => path.join(publicAssetsDir, filename));

  for (const builtJsFile of builtJsFiles) {
    const builtJs = fs.readFileSync(builtJsFile, 'utf8');
    for (const text of forbiddenBottomText) {
      if (builtJs.includes(text)) {
        fail(`Built public asset still contains bottom text "${text}": ${path.relative(root, builtJsFile)}`);
      }
    }
  }
}

console.log('Game Boy bottom text verified.');
