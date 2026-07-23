import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

// Guards the unified GRAY design language: the old teal/green accent must not
// return in the hub or the child experiences, and the gray accent tokens must
// stay in place. See LOOP-TASKS.md (T1).

const root = process.cwd();

const GRAY = '#3c3c43';
const FORBIDDEN_ACCENT = /1f7a6f/i; // old teal accent / --color-primary

const scanRoots = [
  path.join(root, 'src'),
  path.join(root, 'apps/game-boy/src'),
  path.join(root, 'apps/dammagotchi/src'),
  path.join(root, 'public/game-boy'),
  path.join(root, 'public/dammagotchi'),
];

const scanExtensions = new Set(['.js', '.mjs', '.ts', '.css', '.html']);

function fail(message) {
  console.error(`Hub accent verification failed: ${message}`);
  process.exit(1);
}

function readText(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`Missing file: ${path.relative(root, filePath)}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function collectTextFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectTextFiles(entryPath);
    }
    return scanExtensions.has(path.extname(entry.name)) ? [entryPath] : [];
  });
}

// 1) No forbidden teal/green accent anywhere in hub or child UI source/builds.
for (const scanRoot of scanRoots) {
  for (const filePath of collectTextFiles(scanRoot)) {
    const text = fs.readFileSync(filePath, 'utf8');
    if (FORBIDDEN_ACCENT.test(text)) {
      fail(`Old teal/green accent #1f7a6f must not appear: ${path.relative(root, filePath)}`);
    }
  }
}

// 2) Hub keeps the gray accent token (CSS default + per-experience inline value).
const hubStyles = readText(path.join(root, 'src/styles.css'));
if (!hubStyles.includes(`--accent: ${GRAY}`)) {
  fail(`src/styles.css must define the gray accent --accent: ${GRAY}`);
}

const hubMain = readText(path.join(root, 'src/main.js'));
if (!hubMain.includes(`accent: '${GRAY}'`)) {
  fail(`src/main.js experiences must use the gray accent '${GRAY}'`);
}

// 3) Dammagotchi shares the same gray primary.
const dammaStyles = readText(path.join(root, 'apps/dammagotchi/src/style.css'));
if (!dammaStyles.includes(`--color-primary: ${GRAY}`)) {
  fail(`apps/dammagotchi/src/style.css must use the gray primary --color-primary: ${GRAY}`);
}

console.log('Hub gray accent verified (no teal/green; gray tokens in place).');
