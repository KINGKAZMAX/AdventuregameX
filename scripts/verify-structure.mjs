import { existsSync, readFileSync } from 'node:fs';

const requiredPaths = [
  'package.json',
  'index.html',
  'src/main.js',
  'src/styles.css',
  'apps/game-boy/package.json',
  'apps/game-boy/index.html',
  'apps/dammagotchi/package.json',
  'apps/dammagotchi/src/index.html',
];

const missing = requiredPaths.filter((path) => !existsSync(path));

if (missing.length > 0) {
  console.error(`Missing required GameX files:\n${missing.map((path) => `- ${path}`).join('\n')}`);
  process.exit(1);
}

const hubSource = readFileSync('src/main.js', 'utf8');

for (const expected of ['game-boy', 'Tamagotchi', 'iframe']) {
  if (!hubSource.includes(expected)) {
    console.error(`Hub source does not reference "${expected}".`);
    process.exit(1);
  }
}

const gameBoyLoader = readFileSync('apps/game-boy/src/core/loader.ts', 'utf8');
for (const forbidden of ["'/textures/'", "'/models/'", "'/audio/'"]) {
  if (gameBoyLoader.includes(forbidden)) {
    console.error(`Game Boy loader still uses root asset path ${forbidden}.`);
    process.exit(1);
  }
}

const tamagotchiHtml = readFileSync('apps/dammagotchi/src/index.html', 'utf8');
if (tamagotchiHtml.includes('class="loading"') || tamagotchiHtml.includes('Loading...')) {
  console.error('Tamagotchi loading screen markup is still present.');
  process.exit(1);
}
if (!tamagotchiHtml.includes('<title>Tamagotchi</title>') || tamagotchiHtml.includes('<title>Dammagotchi</title>')) {
  console.error('Tamagotchi page title is not updated.');
  process.exit(1);
}

const tamagotchiManifest = readFileSync('apps/dammagotchi/static/favicon/site.webmanifest', 'utf8');
if (tamagotchiManifest.includes('Dammagotchi') || !tamagotchiManifest.includes('"name": "Tamagotchi"')) {
  console.error('Tamagotchi manifest name is not updated.');
  process.exit(1);
}

const rootAssetDirs = ['assets', 'audio', 'cursors', 'environment-maps', 'favicon', 'fonts', 'images', 'models', 'sounds', 'sprites', 'textures', 'video'];
for (const dir of rootAssetDirs) {
  if (existsSync(`public/${dir}`)) {
    console.error(`Root public asset directory should not exist: public/${dir}`);
    process.exit(1);
  }
}

console.log('GameX structure verified.');
