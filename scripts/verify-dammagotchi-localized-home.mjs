import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const files = {
  hubMain: path.join(root, 'src/main.js'),
  hubStyles: path.join(root, 'src/styles.css'),
  dammaIndex: path.join(root, 'apps/dammagotchi/src/index.html'),
  dammaStyles: path.join(root, 'apps/dammagotchi/src/style.css'),
  dammaTutorial: path.join(root, 'apps/dammagotchi/src/experience/tutorial.js'),
  dammaSourceRoot: path.join(root, 'apps/dammagotchi/src'),
  publicDammaRoot: path.join(root, 'public/dammagotchi'),
  publicDammaIndex: path.join(root, 'public/dammagotchi/index.html'),
};

const emojiPattern = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
const forbiddenCreditText = [
  'Made with',
  'Tamagotchi Connection v2 Sprites',
  'The Spriters Resource',
  'MasterPengo',
  'Background Music',
  'Tamagotchi 1996 Sound Effects',
];

function fail(message) {
  console.error(`Dammagotchi localized home verification failed: ${message}`);
  process.exit(1);
}

function readText(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`Missing file: ${path.relative(root, filePath)}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function collectTextFiles(dirPath, extensions = new Set(['.html', '.css', '.js', '.mjs', '.json', '.map'])) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      return collectTextFiles(entryPath, extensions);
    }

    return extensions.has(path.extname(entry.name)) ? [entryPath] : [];
  });
}

const hubMain = readText(files.hubMain);
const hubStyles = readText(files.hubStyles);
const dammaIndex = readText(files.dammaIndex);
const dammaStyles = readText(files.dammaStyles);
const dammaTutorial = readText(files.dammaTutorial);

const requiredHubSnippets = [
  "const defaultLanguage = 'en'",
  "id=\"language-toggle\"",
  '中文',
  'English',
  'lang=${language}',
  '电子宠物',
  '加载',
  '运行中',
];

for (const snippet of requiredHubSnippets) {
  if (!hubMain.includes(snippet)) {
    fail(`Hub must include localized language switch snippet: ${snippet}`);
  }
}

if (!hubStyles.includes('.language-toggle')) {
  fail('Hub styles must include language-toggle controls.');
}

for (const text of forbiddenCreditText) {
  if (dammaIndex.includes(text)) {
    fail(`Dammagotchi source HTML still contains credit text: ${text}`);
  }
}

if (!dammaIndex.includes('<div class="credits"></div>')) {
  fail('Dammagotchi credits panel must be an empty placeholder.');
}

if (/Made with|\u2764/.test(dammaIndex)) {
  fail('Dammagotchi footer must not contain made-with text or heart emoji.');
}

if (emojiPattern.test(dammaTutorial)) {
  fail('Dammagotchi tutorial source must not contain emoji.');
}

for (const filePath of [
  ...collectTextFiles(files.dammaSourceRoot),
  ...collectTextFiles(files.publicDammaRoot),
]) {
  const text = fs.readFileSync(filePath, 'utf8');
  if (emojiPattern.test(text)) {
    fail(`Dammagotchi text file must not contain emoji: ${path.relative(root, filePath)}`);
  }
}

const requiredTutorialSnippets = [
  "const defaultLanguage = 'en'",
  "getTutorialLanguage",
  '你好',
  '是否养过电子宠物？',
  '跳过',
  '上一步',
  '下一步',
  'I have raised one',
];

for (const snippet of requiredTutorialSnippets) {
  if (!dammaTutorial.includes(snippet)) {
    fail(`Dammagotchi tutorial must include localized text snippet: ${snippet}`);
  }
}

const requiredStyleSnippets = [
  '--color-primary: #3c3c43',
  'background-color: #ffffff',
  'background: transparent',
  'outline-color: transparent',
];

for (const snippet of requiredStyleSnippets) {
  if (!dammaStyles.includes(snippet)) {
    fail(`Dammagotchi styles must include white/Game Boy aligned snippet: ${snippet}`);
  }
}

if (fs.existsSync(files.publicDammaIndex)) {
  const publicDammaIndex = fs.readFileSync(files.publicDammaIndex, 'utf8');
  for (const text of forbiddenCreditText) {
    if (publicDammaIndex.includes(text)) {
      fail(`Public Dammagotchi HTML still contains credit text: ${text}`);
    }
  }
}

console.log('Dammagotchi localized home verified.');
