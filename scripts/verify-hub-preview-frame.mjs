import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const stylesPath = path.join(root, 'src/styles.css');

function fail(message) {
  console.error(`Hub preview frame verification failed: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(stylesPath)) {
  fail(`Missing file: ${path.relative(root, stylesPath)}`);
}

const styles = fs.readFileSync(stylesPath, 'utf8');

const forbiddenSnippets = [
  '--preview-max-width',
  '--preview-max-height',
  'width: min(100vw, var(--preview-max-width))',
  'height: min(100vh, var(--preview-max-height))',
  'place-items: center',
];

for (const snippet of forbiddenSnippets) {
  if (styles.includes(snippet)) {
    fail(`Fullscreen preview must not include constrained-frame CSS: ${snippet}`);
  }
}

const requiredSnippets = [
  'position: absolute',
  'inset: 0',
  'width: 100%',
  'height: 100%',
  'overflow: hidden',
];

for (const snippet of requiredSnippets) {
  if (!styles.includes(snippet)) {
    fail(`Expected CSS snippet missing: ${snippet}`);
  }
}

console.log('Hub preview frame verified.');
