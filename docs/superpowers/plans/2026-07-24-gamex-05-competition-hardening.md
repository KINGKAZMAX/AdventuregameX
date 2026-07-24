# GameX 比赛与离线发布加固实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 把阶段 1–4 的可运行原型收束成可提交的离线比赛候选版：权利边界透明、公开画面原创化、无运行时外链、音频循环稳定、关键路径可访问、首屏与模型预算受控，并能稳定完成 120 秒评委演示。

**架构：** `competition-profile.json` 固定公开名称、允许发布的运行时内容和权利声明；构建前验证脚本 fail closed，避免品牌扫描、来源不明素材或远程 URL 进入 `dist/`。原始子项目许可证保留，公开素材改为程序化原创表达。BGM 调度、资源错误、偏好设置和 Judge Demo 分为独立模块，最终由一个聚合门禁串联。

**技术栈：** Vite 6、Three.js、Vitest、Playwright、Node.js `assert/fs/crypto`、Web Audio API、原生 Canvas/SVG/CSS。

---

## 文件结构

### 创建

- `competition/competition-profile.json`：公开名称、原创贡献、允许发布内容、禁止词和演示预算。
- `CREDITS.md`：由最终 source/output locks 生成的 Hub、两个上游运行时、WasmBoy、八个模型、八个 homebrew ROM、MediaPipe 与修改说明。
- `assets/legal/credits.json`：与最终 CREDITS 同源生成、只供离线 Credits dialog 按需读取的结构化副本。
- `src/ui/create-credits-dialog.js`：可见的许可证/源码入口。
- `src/ui/create-accessibility-panel.js`：减少动态、高对比和静音开关。
- `src/settings/preferences.js`：版本化本地偏好。
- `src/bgm-scheduler.js`：可测试的循环调度器。
- `src/runtime/load-with-timeout.js`：资源加载超时与取消。
- `src/demo/judge-demo-script.js`：120 秒段落、目标和可选 Air Control 路径。
- `src/demo/create-judge-demo-panel.js`：只提示、不自动替用户游玩的演示面板。
- `tests/e2e/helpers/runtime-actions.js`：复用阶段 03 的真实父子运行时操作，不设置测试专用 memory。
- `apps/game-boy/MODIFICATIONS.md`、`apps/dammagotchi/MODIFICATIONS.md`：带 `2026-07-24` 日期的上游修改声明。
- `apps/game-boy/src/ui/source-license-links.ts`、`apps/dammagotchi/src/experience/ui/source-license-links.js`：两个 child 内可见、可键盘访问的同源 Source / License 链接。
- `apps/dammagotchi/src/experience/config/original-pixel-art.js`：原创宠物、食物、状态和 UI 像素矩阵。
- `apps/dammagotchi/src/experience/ui/synth-soundboard.js`：原创程序化音效。
- `competition/pocket-play-prune-manifest.schema.json`：严格约束 `delete/replace/add`、变更前后 SHA 与权利键。
- `scripts/apply-pocket-play-prune.mjs`：Pocket Play 清理的唯一执行器；提供 `capture/apply/verify-history` 三种互斥模式。
- `competition/source-package-members.json`：Pocket Care、WasmBoy 与六个上游 ROM 源码包的逐成员路径/SHA-256 allowlist；不允许 glob。
- `assets/legal/source-inputs/roms/{tobu,ucity,minesweep,wordyl,geometrix,gbcorp}/source.tar.gz`：联网维护阶段生成并提交的六个安全、确定性上游源码输入。
- `assets/legal/source-inputs/wasmboy/wasmboy-0.7.1.filtered.tar.gz`：从固定 WasmBoy commit 安全过滤并提交的源码输入。
- `assets/legal/source-inputs/wasmboy/third-party/{audiobuffer-to-wav-8878a20c,big-integer-1.6.48,idb-2.1.3,raf-3.4.1,performance-now-2.1.0,responsive-gamepad-1.1.0,uzip-6a4bbf88}.filtered.tar.gz`：实际七项 bundled closure 的逐组件安全过滤源码输入。
- `assets/legal/source-input-lock.json`：上述 tracked 输入的上游哈希、artifact 哈希、逐成员清单哈希与 rights evidence 锁。
- `assets/legal/wasmboy-third-party-notices.json`：由固定 npm lock/import closure 生成的 WasmBoy bundled dependency notices。
- `scripts/lib/verify-safe-source-archive.mjs`：不落盘解析 tar/tar.gz 并拒绝路径穿越、链接、特殊文件、碰撞与越界大小。
- `scripts/verify-competition-rights.mjs`
- `scripts/generate-credits.mjs`
- `scripts/verify-offline-build.mjs`
- `scripts/verify-bundle-budget.mjs`
- `scripts/verify-bgm-scheduler.mjs`
- `scripts/build-corresponding-source.mjs`
- `scripts/assets/rebuild-pocket-care.mjs`：只重建 Pocket Care approved GLB 的自包含入口。
- `scripts/verify-competition.mjs`
- `assets/legal/corresponding-source-lock.json`
- `tests/unit/preferences.test.js`
- `tests/unit/pocket-care-original-assets.test.js`
- `tests/unit/synth-soundboard.test.js`
- `tests/unit/bgm-scheduler.test.js`
- `tests/unit/load-with-timeout.test.js`
- `tests/unit/source-archive-safety.test.js`
- `tests/unit/verify-offline-build-mode.test.js`
- `tests/unit/build-all-order.test.js`
- `tests/unit/memory-deadline.test.js`
- `tests/unit/asset-load-limiter.test.js`
- `tests/e2e/competition-demo.spec.js`
- `tests/e2e/memory-deadline.spec.js`
- `tests/e2e/offline.spec.js`
- `tests/e2e/air-control-production.spec.js`
- `playwright.memory-deadline.config.js`
- `playwright.competition.config.js`

### 修改

- `package.json`：比赛构建与聚合门禁命令。
- `src/main.js`、`src/styles.css`：Credits、偏好和 Judge Demo。
- `src/bgm.js`：使用独立调度器并正确取消已排程节点。
- `src/museum/create-museum-scene.js`：高对比、减少动态和低性能降级。
- `src/runtime/focus-portal.js`：资源超时和可恢复错误界面。
- `vite.config.js`、`scripts/build-all.mjs`：显式读取比赛模式并关闭比赛 sourcemap。
- `scripts/prepare-apps.mjs`：只复制经过允许的源资产。
- `apps/game-boy/tools/homebrew-cartridges.json`：固定 SPDX、源码、素材许可与 ROM 哈希字段。
- `apps/game-boy/tools/generated-rom-lock.json`：两张原创 ROM 的可重复构建结果与 source-tree/toolchain 哈希。
- `apps/game-boy/tools/build-cartridges.mjs`：只生成八张原创 homebrew 标签。
- `apps/game-boy/src/scene/game-boy-scene/cartridges/data/cartridges-config.ts`：只展示八张开放 homebrew 卡带。
- `apps/game-boy/src/main.ts`、`src/style.css`：挂载 child 内的 Source / License 链接。
- `scripts/verify-homebrew-cartridges.mjs`：拒绝品牌扫描和非开放 ROM。
- `apps/dammagotchi/src/index.html`、`src/style.css`：Pocket Care 名称、本地图标、无外部字体。
- `apps/dammagotchi/src/experience/config/resources.js`：移除未核验图片/音频资源。
- `apps/dammagotchi/src/experience/utils/sprites.js`：使用原创像素矩阵。
- `apps/dammagotchi/src/experience/ui/soundboard.js`：委托程序化音效。
- `apps/dammagotchi/static/favicon/favicon.svg`：原创 Pocket Care 图标。
- `README.md`、`LICENSE`：准确描述原创与上游边界、AGPL 源码提供方式。

### 删除

- `apps/game-boy/tools/pokemon-cartridges.json`
- `apps/game-boy/tools/sources/` 下的产品扫描。
- 不可证明来源的现有 `carazu.gb`、`shock-lobster.gb`，以及不能绑定到源码 Git blob/可重复构建的 `2048.gb`；当前 Tobu/Wordyl 二进制由可固定上游版本逐字节覆盖。
- `apps/game-boy/public/roms/ATTRIBUTION.md`：由 schema 驱动的 `CREDITS.md`、Credits dialog 与逐卡带 Source 链接替代，避免旧清单继续宣称已删除作品。
- `apps/game-boy/public/textures/` 下由上述扫描生成的 30 张品牌卡带贴图，以及旧版 `tetris`、`space-invaders` 的 4 张公开品牌贴图。
- `apps/game-boy/public/assets/`、`audio/`、`fonts/`、`video/` 中的旧内建游戏、品牌画面、字体、音频与视频；改为内联 SVG、Web Audio 与开放 ROM。
- `apps/game-boy/src/.../games/{pocket-creatures,space-invaders,tetris}/` 三套旧内建游戏，只保留统一 emulator 路径。
- `apps/game-boy/src/scene/game-boy-scene/game-boy-debug.ts` 及 `game-boy-scene.ts` / controller 中的整个 import、字段、初始化与调用图。
- `apps/dammagotchi/static/images/credits/` 下的角色图。
- `apps/dammagotchi/static/sprites/pets/` 下的上游角色图。
- `apps/dammagotchi/static/sounds/` 下的来源不适合比赛发布的音频。
- 不再引用的 Google Fonts、Font Awesome、背景图片和光标图片。

所有 Pocket Play delete/replace/add 都只由 `scripts/apply-pocket-play-prune.mjs --mode=apply` 按 literal manifest 执行，随后以普通 `git add -A` 记录，可从 Git 历史恢复；执行前脚本打印精确 action 清单并与本节核对，禁止另行使用 `git rm`、glob 或手工覆盖作为实际清理流程。Pocket Care 的独立媒体删除仍使用其 Task 3 精确 `git rm` 清单，不属于 Pocket Play prune scope。

## Task 1：建立 fail-closed 的比赛配置与权利 schema

**Files:**

- Create: `competition/competition-profile.json`
- Create: `competition/homebrew-manifest.schema.json`
- Create: `scripts/verify-competition-rights.mjs`
- Modify: `package.json`

- [ ] 先创建失败验证 `scripts/verify-competition-rights.mjs`。本任务只验证 profile 与 JSON Schema；CREDITS 必须等 Task 2 的权威 ROM 清单完成后再生成：

```js
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const profilePath = 'competition/competition-profile.json';
const schemaPath = 'competition/homebrew-manifest.schema.json';
assert.ok(existsSync(profilePath), 'competition profile is required');
assert.ok(existsSync(schemaPath), 'homebrew manifest schema is required');

const profile = JSON.parse(readFileSync(profilePath, 'utf8'));
assert.equal(profile.publicNames.gameBoy, 'Pocket Play');
assert.equal(profile.publicNames.virtualPet, 'Pocket Care');
assert.equal(profile.allowedHomebrew.length, 8);
assert.deepEqual(profile.forbiddenPublicTerms.sort(), [
  'Bandai', 'Nintendo', 'Pokémon', 'Subor', 'Tamagotchi', 'Tetris',
].sort());
assert.equal(profile.provenancePolicy, 'fixed-binary-and-source-or-reproducible-local');
console.log('competition rights profile verified');
```

- [ ] 在 `package.json` 增加 `"verify:competition-rights": "node scripts/verify-competition-rights.mjs"`。
- [ ] 运行 `npm run verify:competition-rights`，预期因 profile 与 schema 不存在而失败。
- [ ] 创建 `competition/competition-profile.json`：

```json
{
  "version": 1,
  "title": "GameX — Playable Artifacts of Childhood",
  "publicNames": {
    "gameBoy": "Pocket Play",
    "virtualPet": "Pocket Care"
  },
  "originalContributions": [
    "white orbit museum",
    "open museum protocol",
    "runtime-to-object bridge",
    "memory core",
    "air control",
    "judge demo direction"
  ],
  "allowedHomebrew": [
    "tobu", "ucity", "minesweep", "wordyl",
    "geometrix", "gbcorp", "orbit-curator", "neon-seed"
  ],
  "forbiddenPublicTerms": [
    "Nintendo", "Pokémon", "Tamagotchi", "Tetris", "Bandai", "Subor"
  ],
  "provenancePolicy": "fixed-binary-and-source-or-reproducible-local",
  "modificationDate": "2026-07-24",
  "firstScreenBudgetBytes": 4194304,
  "judgeDemoSeconds": 120
}
```

- [ ] 创建严格的 `homebrew-manifest.schema.json`：`additionalProperties: false`；恰好八个唯一 `key`；上游项必填 `binarySourceUrl/binarySha256/sourceCommit/sourceArchiveUrl/sourceArchiveSha256/codeLicenseSpdx/assetLicenseSpdx/attribution/notices/romFile/localSourcePath/verifiedAt`；原创项必填 `provenanceKind: "reproducible-local"`、`sourceTree`、结构化 `buildToolchain`、`generatedLockFile`、`author/copyright/attribution/notices`，且禁止预填不存在的 ROM hash。`buildToolchain` 必须含固定 native macOS URL/SHA、Linux URL/SHA 和 container manifest/platform digest。日期用 ISO UTC 并由验证器拒绝未来日期；`profile.modificationDate` 必须为 `YYYY-MM-DD`、不得晚于执行日，并逐字出现在两个 child 的 `MODIFICATIONS.md`。schema 同时要求 GPL 项的 `localSourcePath`、GPLv3 全文与 notices 均存在。
- [ ] 运行 `npm run verify:competition-rights`，预期输出 `competition rights profile verified`。
- [ ] 提交：

```bash
git add competition/competition-profile.json competition/homebrew-manifest.schema.json \
  scripts/verify-competition-rights.mjs package.json
git commit -m "build(rights): define competition provenance policy"
```

## Task 2：把 Pocket Play 收束为八张开放 homebrew 卡带

**Files:**

- Create: `apps/game-boy/rom-src/orbit-curator/{Makefile,LICENSE,ASSETS_LICENSE,AUTHORS.md,src/main.asm}`
- Create: `apps/game-boy/rom-src/neon-seed/{Makefile,LICENSE,ASSETS_LICENSE,AUTHORS.md,src/main.asm}`
- Create: `apps/game-boy/tools/build-original-roms.mjs`
- Create: `apps/game-boy/tools/sync-homebrew-provenance.mjs`
- Create: `apps/game-boy/tools/generated-rom-lock.json`
- Create: `apps/game-boy/MODIFICATIONS.md`
- Create: `apps/game-boy/src/ui/source-license-links.ts`
- Create: `competition/pocket-play-prune-manifest.json`
- Create: `competition/pocket-play-prune-manifest.schema.json`
- Create: `scripts/apply-pocket-play-prune.mjs`
- Create: `competition/source-package-members.json`
- Create: `assets/legal/source-inputs/roms/{tobu,ucity,minesweep,wordyl,geometrix,gbcorp}/source.tar.gz`
- Create: `assets/legal/source-input-lock.json`
- Create: `scripts/lib/verify-safe-source-archive.mjs`
- Create: `scripts/generate-credits.mjs`
- Create: `CREDITS.md`
- Create: `assets/legal/credits.json`
- Create: `tests/unit/homebrew-provenance.test.js`
- Create: `tests/unit/source-archive-safety.test.js`
- Create: `tests/e2e/pocket-play-cartridges.spec.js`
- Modify: `apps/game-boy/tools/homebrew-cartridges.json`
- Modify: `apps/game-boy/tools/build-cartridges.mjs`
- Modify: `apps/game-boy/src/Data/Configs/Assets/Assets.ts`
- Modify: `apps/game-boy/src/Data/Configs/Main/debug-config.ts`
- Modify: `apps/game-boy/src/main.ts`
- Modify: `apps/game-boy/src/style.css`
- Modify: `apps/game-boy/src/scene/game-boy-scene/cartridges/cartridges-controller.ts`
- Modify: `apps/game-boy/src/scene/game-boy-scene/cartridges/data/cartridge-info-config.ts`
- Modify: `apps/game-boy/src/scene/game-boy-scene/cartridges/data/cartridges-config.ts`
- Modify: `apps/game-boy/src/scene/game-boy-scene/game-boy-games/data/games-classes.ts`
- Modify: `apps/game-boy/src/scene/game-boy-scene/game-boy-games/data/games-config.ts`
- Modify: `apps/game-boy/src/scene/game-boy-scene/game-boy-games/game-boy-games.ts`
- Modify: `apps/game-boy/src/scene/game-boy-scene/game-boy-games/games/emulator/emulator-games-config.ts`
- Modify: `apps/game-boy/src/scene/game-boy-scene/game-boy-scene-controller.ts`
- Modify: `apps/game-boy/src/scene/game-boy-scene/game-boy-scene.ts`
- Modify: `apps/game-boy/src/scene/game-boy-scene/game-boy/game-boy-audio/game-boy-audio-config.ts`
- Modify: `apps/game-boy/src/scene/game-boy-scene/game-boy/game-boy-audio/game-boy-audio-data.ts`
- Modify: `scripts/verify-homebrew-cartridges.mjs`
- Modify: `scripts/verify-competition-rights.mjs`
- Modify: `README.md`
- Modify: `LICENSE`
- Modify: `package.json`
- Delete: `apps/game-boy/tools/pokemon-cartridges.json`
- Delete: `apps/game-boy/tools/sources/`
- Delete: `apps/game-boy/public/roms/carazu.gb`
- Delete: `apps/game-boy/public/roms/shock-lobster.gb`
- Delete: `apps/game-boy/public/roms/2048.gb`
- Delete: `apps/game-boy/public/roms/ATTRIBUTION.md`
- Delete: `apps/game-boy/public/assets/`
- Delete: `apps/game-boy/public/audio/`
- Delete: `apps/game-boy/public/fonts/`
- Delete: `apps/game-boy/public/video/`
- Delete: `apps/game-boy/src/scene/game-boy-scene/game-boy-games/games/{pocket-creatures,space-invaders,tetris}/`
- Delete: `apps/game-boy/src/scene/game-boy-scene/game-boy-debug.ts`
- Delete: branded generated textures listed below

- [ ] 先扩展 `scripts/verify-homebrew-cartridges.mjs` 与 `verify-competition-rights.mjs`，按 Task 1 schema fail closed，并加入红灯测试：

```js
const sourceRoot = path.join(root, 'apps/game-boy/tools/sources');
const brandedManifest = path.join(root, 'apps/game-boy/tools/pokemon-cartridges.json');
if (fs.existsSync(sourceRoot) || fs.existsSync(brandedManifest)) {
  fail('competition source tree must not contain product cartridge scans');
}
for (const term of ['Pokemon', 'Pokémon', 'Nintendo', 'TETRIS', 'SPACE_INVADERS']) {
  if (cartridgeConfig.includes(term)) {
    fail(`competition cartridge config contains forbidden term: ${term}`);
  }
}
```

- [ ] `tests/unit/homebrew-provenance.test.js` 至少制造并拒绝：重复 key、变动 ROM、变动源码归档、GPL 无本地 source、缺 notices、未知/不完整 SPDX、上游项缺 commit、原创项缺 author/copyright/notices、原创项预填不存在 hash、生成锁与 ROM 不一致、八项以外的文件，以及 `2048` key/`2048.gb` 回流。运行 `npm run verify:homebrew-cartridges`，预期报告品牌 manifest、旧扫描、五个不合规 ROM/旧副本与 GPL source 缺失。
- [ ] 用下表六个逐字节固定上游项与两个原创项完整替换 `homebrew-cartridges.json`。所有 URL 都是审计时可下载的 immutable URL；运行时只访问本地 `romFile`，不会热链上游：

| key | binarySourceUrl / binarySha256 | sourceCommit / sourceArchiveUrl / sourceArchiveSha256 | code / assets | 必须展开的 notices |
| --- | --- | --- | --- | --- |
| `tobu` | `https://raw.githubusercontent.com/SimonLarsen/tobutobugirl/113c1dcb182dd774ac13ccf19c60d502148a1627/tobu.gb` / `a675d7e46b04cbfe91d488f0512b39ce731e6481e6031358e8d890fb94597ce5` | `113c1dcb182dd774ac13ccf19c60d502148a1627` / `https://codeload.github.com/SimonLarsen/tobutobugirl/tar.gz/113c1dcb182dd774ac13ccf19c60d502148a1627` / `094c52b53b68535d6618bceec828edd0a79fbfb831eed5977013c14b613d7e01` | `MIT` / `CC-BY-4.0` | 作品名、Tangram Games、Simon Larsen、Lukas Erritsø Hansen、源码、CC BY 4.0、未改 ROM；授权证据只能取 commit `048a22c2d7ebbe25811322e8692803fa86bb643a` 的 immutable raw README/LICENSE（见下） |
| `ucity` | `https://github.com/AntonioND/ucity/releases/download/v1.3/ucity.gbc` / `9422ee2ca7b7ea1d46b58b2a429fff3f354dfd3e732dee1e7ae6220f148ce6e0` | `d1880a2a112d7c26f16c0fc06a15b6c32fdc9137` (`v1.3`) / `https://codeload.github.com/AntonioND/ucity/tar.gz/d1880a2a112d7c26f16c0fc06a15b6c32fdc9137` / `8556399ad1d81cfea41e171ad5262664f19a76115a753b5513842a475b385353` | `GPL-3.0-or-later AND BSD-2-Clause AND MIT` / `CC-BY-SA-4.0` | AntonioND、GBT Player/mod2gbt、rle 工具、媒体作者、全部 per-file notices 与 GPLv3 |
| `minesweep` | `https://raw.githubusercontent.com/lancekindle/minesweepGB/a1d18a46b14f3126e3e2b2569e035ebd8a456b9e/play_minesweep.gb` / `e19e895e4b48d8554500a76f890805cd39a1ab86a4ccbb82a7e680222d226384` | `a1d18a46b14f3126e3e2b2569e035ebd8a456b9e` / `https://codeload.github.com/lancekindle/minesweepGB/tar.gz/a1d18a46b14f3126e3e2b2569e035ebd8a456b9e` / `de1a057c4a888d7635223c61635581da09bba24c6ced09113f6ac2be4960b386` | `GPL-3.0-only` / `GPL-3.0-only` | Lance Kindle；binary 是同一 commit 的 `play_minesweep.gb` Git blob；GPLv3 全文；源码包剔除非构建所需 `screenplay.gif/screenshot.png` |
| `wordyl` | `https://raw.githubusercontent.com/bbbbbr/gb-wordyl/964913c877907442f50061da5e6f0451d49dc6f4/rom/GBWORDYL.gb` / `4369a6fef3a0eef8e3cdb52f9c61c1c420f6f3feb5db522573df52f2b3e64f74` | `964913c877907442f50061da5e6f0451d49dc6f4` (`v0.75`) / `https://codeload.github.com/bbbbbr/gb-wordyl/tar.gz/964913c877907442f50061da5e6f0451d49dc6f4` / `f21deacec910795d1fc6254536a29daa714e944e267b029d80808dbc25a2c65d` | `GPL-3.0-only` / `GPL-3.0-only` | bbbbbr、0x7f、`stacksmashing`、`zeta_two`、`arpruss` 与 archive 内逐文件作者；完整固定 archive、GPLv3 |
| `geometrix` | `https://raw.githubusercontent.com/AntonioND/geometrix/ec2138bc0a1c1d0995dcf0aab2ca8547379f1945/geometrix.gbc` / `56efdf82118e5faf22511c18dd1fc2ab8bc0c5e44cd634b8e06050ff08124586` | `ec2138bc0a1c1d0995dcf0aab2ca8547379f1945` / `https://codeload.github.com/AntonioND/geometrix/tar.gz/ec2138bc0a1c1d0995dcf0aab2ca8547379f1945` / `87b54fb6aafddc589525478d2dfa7e71170910b748f59d31e3b06a875a3e2875` | `GPL-3.0-or-later AND BSD-2-Clause` / `GPL-3.0-or-later` | AntonioND、GBT Player、全部 per-file notices 与 GPLv3 |
| `gbcorp` | `https://github.com/drludos/GBcorp/releases/download/1.0/gbcorp.gb` / `5a39926a23ff50448859b2d924d8bba5a8c68db91563783f0c593a3aa8e7bad3` | `3d61ed9aedfcf204976b06dd86e85e7a4cf272fd` (`1.0`) / `https://codeload.github.com/drludos/GBcorp/tar.gz/3d61ed9aedfcf204976b06dd86e85e7a4cf272fd` / `e1228972d22a741c6a0d5a6331cd9b021217b6763aecc965217d6b2f1c276c22` | `MIT AND BSD-2-Clause` / `MIT` | Dr. Ludos MIT；GBT Player v2.1.1 / Antonio Niño Díaz BSD-2-Clause；`In the Town` / krümel (crumb)#0723 的固定 MIT 音乐证据（见下） |

六个本地 `romFile` 依次固定为 `tobutobugirl.gb`、`ucity.gbc`、`minesweep.gb`、`gb-wordyl.gb`、`geometrix.gbc`、`gbcorp.gb`；`localSourcePath` 固定为站点根相对路径 `source/<key>/source.tar.gz`，Tobu 与 GB Corp 另含下列 `license-evidence/`。manifest 不允许同一 ROM 文件被两个 key 复用，也不允许把源码包复制进 child 的 `public/source` 或最终 `dist/game-boy/source`。

固定补充证据（URL、commit 与 SHA 都进入 manifest，而不是只写在 CREDITS）：

- Tobu：`https://raw.githubusercontent.com/SimonLarsen/tobutobugirl/048a22c2d7ebbe25811322e8692803fa86bb643a/README.md` / `955e9c84cc191728f186646a3cff250ba0136d7b2821f27c00766fe0bd6b0a10`；同 commit 的 `LICENSE` / `f5529c9982c7a8f966679d5772037c5ef0b25b00ba4daaff5a2ee35e891d8dda`。验证器拒绝 `master/main` raw URL，并证明证据 commit 是 ROM/source commit 的后继。
- GB Corp 的 GBT Player：commit `74f486c5e759b013eebe15477bdc17a79aa6c57d`，`https://codeload.github.com/AntonioND/gbt-player/tar.gz/74f486c5e759b013eebe15477bdc17a79aa6c57d` / `58af8a529a1a7df95ceeb6e73239418630f4c47044dde61eeabd0a896f6443ce`，LICENSE SHA-256 `bfd66a0bc8c08db31954564ea9799c6fbc1920304afddcb941a94063c8e97653`。验证器要求 GB Corp 的 `gbt_player.h` / `gbt_player.s` 分别等于上游 SHA `616466532e7f89e0a9f5c7e9fe8666c7da8a780348ffa675783e51dc17486d62` / `8af4bb5a55217feba61545a7ebc9e066097d4f1f5e403ea704c23054da377e7b`，并把修改过的 `gbt_player_bank1.s` 标为 BSD-2-Clause derivative。
- GB Corp 音乐：证据 commit `d8a47ffcc54bbf32531633421143d7467a6fc5f1`；`Music/Overworld/In the Town.mod` SHA-256 `32611d72d998dded2d6294b6259678763883b3e638fc37662126250a0d3f6a89`；`Music/Readme.md` SHA-256 `ec7c196691669ed864672a8f0cf75589ff2ae1b6026c7d5643a24bd7af891d39` 明列作者与曲名；根 README SHA-256 `25aded23024977341fb5db663002cdbf8d9cf1d8e1fe7ff2a5f56d8c68d877dd` 声明默认 MIT；LICENSE SHA-256 `55d6ac849bef8d2eb844cced3ffd35134d4a60c47c4d0265786213f8b216e996`。只使用 `https://raw.githubusercontent.com/DeerTears/GB-Studio-Community-Assets/d8a47ffcc54bbf32531633421143d7467a6fc5f1/...`，不使用 branch URL，也不再依据 GB Corp 注释中的“public domain”简写。

`2048.gb` 明确不得进入候选：审计到的静态 binary `3ea2376b15b34bd26b10e6b31d2753bf8b086098dbdb5ee84d9c0f03d66d3d7f` 既不是 commit `e44f94f898c1e0de7caa1160c82c0da36ff5eb05` 的 Git blob，计划也没有能重建该字节的固定工具链；“发布时间接近”不满足本计划 provenance policy。验证器永久拒绝 `key === "2048"`、`romFile === "2048.gb"` 与 `CARTRIDGE_TYPE.Twenty48`，由上表 `minesweep` 补足第六个固定上游槽位。

两个原创项不用伪造尚未生成的 SHA：

```json
[
  {
    "key": "orbit-curator",
    "title": "ORBIT CURATOR",
    "provenanceKind": "reproducible-local",
    "sourceTree": "apps/game-boy/rom-src/orbit-curator",
    "buildToolchain": {
      "name": "RGBDS",
      "version": "v1.0.2+hotfix",
      "darwinUniversal": {
        "url": "https://github.com/gbdev/rgbds/releases/download/v1.0.2%2Bhotfix/rgbds-macos.zip",
        "sha256": "7e8e6e0560522466afac354a28c4bdfd6b9c94a83b6767356035d6c43110d0cf"
      },
      "linuxX86_64": {
        "url": "https://github.com/gbdev/rgbds/releases/download/v1.0.2%2Bhotfix/rgbds-linux-x86_64.tar.xz",
        "sha256": "b13d97db79095fb99372fab8e75d024b7bffbd9485b3cd1d0a6cbf2d2badfbf9"
      },
      "container": {
        "image": "docker.io/library/debian@sha256:7b140f374b289a7c2befc338f42ebe6441b7ea838a042bbd5acbfca6ec875818",
        "platform": "linux/amd64",
        "platformDigest": "sha256:63a496b5d3b99214b39f5ed70eb71a61e590a77979c79cbee4faf991f8c0783e"
      }
    },
    "generatedLockFile": "apps/game-boy/tools/generated-rom-lock.json",
    "author": "GameX contributors",
    "copyright": "Copyright (c) 2026 GameX contributors",
    "attribution": "Original GameX ROM; no upstream game content.",
    "notices": ["Code: MIT.", "Programmatic pixel art and note data: CC0-1.0."],
    "codeLicenseSpdx": "MIT",
    "assetLicenseSpdx": "CC0-1.0",
    "romFile": "orbit-curator.gb"
  },
  {
    "key": "neon-seed",
    "title": "NEON SEED",
    "provenanceKind": "reproducible-local",
    "sourceTree": "apps/game-boy/rom-src/neon-seed",
    "buildToolchain": {
      "name": "RGBDS",
      "version": "v1.0.2+hotfix",
      "darwinUniversal": {
        "url": "https://github.com/gbdev/rgbds/releases/download/v1.0.2%2Bhotfix/rgbds-macos.zip",
        "sha256": "7e8e6e0560522466afac354a28c4bdfd6b9c94a83b6767356035d6c43110d0cf"
      },
      "linuxX86_64": {
        "url": "https://github.com/gbdev/rgbds/releases/download/v1.0.2%2Bhotfix/rgbds-linux-x86_64.tar.xz",
        "sha256": "b13d97db79095fb99372fab8e75d024b7bffbd9485b3cd1d0a6cbf2d2badfbf9"
      },
      "container": {
        "image": "docker.io/library/debian@sha256:7b140f374b289a7c2befc338f42ebe6441b7ea838a042bbd5acbfca6ec875818",
        "platform": "linux/amd64",
        "platformDigest": "sha256:63a496b5d3b99214b39f5ed70eb71a61e590a77979c79cbee4faf991f8c0783e"
      }
    },
    "generatedLockFile": "apps/game-boy/tools/generated-rom-lock.json",
    "author": "GameX contributors",
    "copyright": "Copyright (c) 2026 GameX contributors",
    "attribution": "Original GameX ROM; no upstream game content.",
    "notices": ["Code: MIT.", "Programmatic pixel art and note data: CC0-1.0."],
    "codeLicenseSpdx": "MIT",
    "assetLicenseSpdx": "CC0-1.0",
    "romFile": "neon-seed.gb"
  }
]
```

- [ ] 先为 `scripts/lib/verify-safe-source-archive.mjs` 写红灯测试：以内存构造 tar.gz，逐项拒绝 absolute path、`..`、反斜线、NUL、symlink、hardlink、device/FIFO、重复 member、NFC/NFD 与大小写折叠碰撞、未列 member、member > 8 MiB、archive > 80 MiB、嵌套未核验 archive，以及 allowlist 外的 `.gb/.gbc/.png/.jpg/.gif/.webp/.mp3/.wav/.mp4`。API 固定为 `verifySafeSourceArchive({ bytes, stripPrefix, members, maxArchiveBytes, maxMemberBytes }) -> { members: [{ path, sha256, size, bytes }] }`；它先完整验证 header/type/path/size/hash，再返回 regular-file bytes，绝不先调用系统 `tar` 解包。
- [ ] `competition/source-package-members.json` 对六个上游 ROM 源码输入与最终源码包分别保存逐个 literal `{ "path", "sha256", "size", "rightsEvidenceKey" }`，禁止 glob/prefix-only 条目。ROM 包只允许完整构建所需源、数据、Makefile、README、license/notices；Minesweep 明确排除 `screenplay.gif/screenshot.png`；任何媒体只有 manifest 中存在匹配 SHA 与 `rightsEvidenceKey` 才可列入。验证器要求每个输入和输出 member 恰好命中一次 rights record，确保源码包不能把已从运行时删除的品牌或未授权媒体重新带回。
- [ ] `sync-homebrew-provenance.mjs --refresh-inputs` 是 ROM 的唯一联网维护命令：下载六个 binary、六个固定 source archive、Tobu 两份证据、GB Corp 的 GBT Player/音乐证据到每次新建且不得复用的临时目录，先核对本计划的 upstream SHA，再用安全 archive API 按 literal member allowlist 重打确定性 ustar+gzip。命令强制接受位于仓库外的绝对 `--output-root`，只在 Task 2 candidate root 下原子更新六个将被 tracked 的 `assets/legal/source-inputs/roms/<key>/source.tar.gz`、`assets/legal/source-input-lock.json` 与已核验 `apps/game-boy/public/roms/`；主工作树仍只能由 prune executor 的 `apply` 模式写入。它绝不直接写根 `public/source` 或 child `public/source`。
- [ ] `assets/legal/source-input-lock.json` 使用 `additionalProperties: false`，恰好含六个 ROM input record；每项固定 `componentId/upstreamUrl/upstreamCommit/upstreamArtifactSha256/filteredArtifactPath/filteredArtifactSha256/memberManifestSha256/rightsEvidenceKeys/refreshedAt`。`filteredArtifactPath` 必须位于 `assets/legal/source-inputs/roms/`，artifact 与逐成员哈希从实际 committed bytes 重算，日期非未来；lock、member manifest、homebrew manifest 三层的 component/key 集合必须逐字一致。刷新命令连续运行两次应得到完全相同的六个 archive 与 lock（除非显式 `--refresh-date`，比赛分支禁止该参数）。
- [ ] 普通 child/root build、`build-corresponding-source.mjs --prepare` 与 `build:competition` 的**源码闭包阶段零网络**：不得重新下载/过滤任何 provenance/source 输入，`--prepare` 只读上述 tracked input/lock 并生成确定性临时 artifacts；只有 competition `prepare-apps.mjs` 在 final lock 完成后才把这些已核验字节生成到被 Git 忽略的根 `public/source/`，base build 不生成 source public 副本。显式 `npm ci` 是独立的 lockfile 依赖安装步骤，不得调用 source refresh；在预热 npm cache 的 hermetic runner 可加 `--offline`。单测在 `globalThis.fetch`、`http.request`、`https.request`、`undici.request` 全部设为抛错时运行 `--prepare`，仍必须成功；静态门禁拒绝 `--prepare` 路径调用任何 refresh/download 函数。GPL 四项的 `Source + GPLv3 + Notices` 与 ROM 同站点、无需登录或费用；Tobu/GB Corp 也发布 source artifact 并进入 artifact/member hash lock。两遍显式 ROM refresh 与 tracked-input 提交必须在下面 normal gate 前完成，normal gate 本身不联网。
- [ ] 创建两个 32 KiB MBC0 原创 ROM。`Orbit Curator` 用 D-pad 在八个抽象展位间移动、A 扫描、收集八枚几何印记后显示完成；`Neon Seed` 用 A 照料、B 调频、D-pad 选择能量频道，在 30 秒状态循环中保持抽象种子能量。二者只用 1-bit 几何 tile 与原创短音序，不使用任何产品名、角色、UI 或音效。每棵 source tree 的 `AUTHORS.md` 必须逐字包含 manifest 的 author/copyright/attribution/notices，`src/main.asm` 顶部保留相同 copyright 与 `SPDX-License-Identifier: MIT`，`ASSETS_LICENSE` 是完整 CC0-1.0；验证器逐字段比对，不能只在 JSON 自称原创。
- [ ] `build-original-roms.mjs` 的平台选择必须可在 macOS arm64 真正执行：`darwin/arm64|x64` 下载并核对上述 universal zip，先用安全 zip member allowlist 只取 `rgbasm/rgblink/rgbfix/rgbgfx`；`linux/x64` 使用固定 Linux archive；其他平台或 `GAME_X_RGBDS_CONTAINER=1` 则把已核验 Linux 工具挂载到 `docker run --rm --platform=linux/amd64 docker.io/library/debian@sha256:7b140f374b289a7c2befc338f42ebe6441b7ea838a042bbd5acbfca6ec875818`，并验证实际 image platform digest 为 `sha256:63a496b5d3b99214b39f5ed70eb71a61e590a77979c79cbee4faf991f8c0783e`。容器内不联网、不 apt install；`--network=none`、只读 rootfs、临时 `/tmp`。单测 mock `process.platform/process.arch`，必须覆盖 `darwin/arm64` native 分支与 container fallback，不允许在 Apple Silicon 执行 Linux ELF。
- [ ] 两个全新临时目录各构建一次，固定 `SOURCE_DATE_EPOCH=0`、locale/umask、输入排序和绝对路径消除，要求同一 source tree 两次 ROM 字节完全相等且大小为 32768；native mac 与 pinned container 可同时存在时还要求跨工具产物相同。只有成功后才写 `generated-rom-lock.json`：每项严格含 `sourceTreeSha256/finalBinarySha256/buildLogSha256/toolchainSha256/assetSha256/platformEvidence`，其中 toolchain SHA 对实际四个 RGBDS executable bytes、版本、下载 artifact SHA 和容器 platform digest 的 canonical record 取哈希，platform evidence 记录 container digest 或 native platform；随后原子复制到 `public/roms/`。验证器重建并与已提交 lock 比较，任何漂移都失败。
- [ ] 重写 `build-cartridges.mjs`，只读取 schema 通过的 manifest 与 generated lock，以标题、作者和确定性色盘生成原创标签；验证脚本拒绝 `fetch(`、`imageUrl`、产品扫描及 manifest 之外的 ROM。将 `CARTRIDGE_TYPE` 固定为 `Tobu/MicroCity/Minesweep/Wordyl/Geometrix/GbCorp/OrbitCurator/NeonSeed`，每条 `CARTRIDGES_BY_TYPE_CONFIG` 显式写对应 manifest `key` 到 `manifestKey`，左右各四对称排列，`GAME_TYPE` 只保留 `Emulator`。
- [ ] 运行 `node apps/game-boy/tools/build-cartridges.mjs`，预期只生成 16 张 `baked-cartridge-<homebrew>{,-in-pocket}.jpg`。
- [ ] 先创建 `competition/pocket-play-prune-manifest.schema.json` 与失败测试。`competition/pocket-play-prune-manifest.json` 顶层固定 `schemaVersion: 1`、`baselineCommit`、`baselineTree`、`baselineScopeTreeSha256`、`postPruneScopeTreeSha256`、`scopeRoots`、`protectedPaths`、`changes` 且 `additionalProperties: false`。`baselineCommit` 是执行 Task 2 前的完整 Git OID，`baselineTree` 是该提交根 tree 的完整 Git OID；两个 scope SHA 都是对 `scopeRoots` 内 `{path,mode,blobSha256,size}` 按 UTF-8 path 排序后 canonical JSON 的 SHA-256，因此不依赖当前工作树或 `git diff`。`scopeRoots` 只允许 literal 产品目录或单文件，必须覆盖全部 action，但明确不得包含 prune manifest 本身；因此 after tree hash 不形成自引用。每个 change 只能含 `path/action/beforeSha256/afterSha256/rightsEvidenceKey/reason`。`action` 仅为 `delete|replace|add`：delete 必须是 `before=64hex/after=null`，replace 必须两者均为 64hex 且不同，add 必须 `before=null/after=64hex`。所有路径为 NFC、仓库相对 literal path，排序、唯一、不得含 glob、目录项、symlink 或越界。
- [ ] 创建唯一执行器 `scripts/apply-pocket-play-prune.mjs`，命令只能三选一，并共享同一 schema、Git blob reader、canonical scope-tree hasher 与 literal action engine：
  - `--mode=capture --baseline <full-oid> --candidate-root <absolute-temp-worktree>` 只从 `git cat-file` / `git ls-tree -r -z` 读取 baseline commit/tree 的 bytes，验证 `beforeSha256`，从显式外部 candidate root 读取 add/replace payload 并验证 `afterSha256`，计算两棵 scope tree，原子写 manifest；candidate root 不得位于仓库、不得含 symlink，capture 不改产品工作树。
  - `--mode=apply --candidate-root <same-absolute-temp-worktree>` 首先要求目标 `scopeRoots` 与 manifest 的 baseline scope 完全相同；随后只按已排序 literal `changes` 执行。delete 由 executor 删除，replace/add 只从 candidate root 的同名 regular file 读取并原子落盘；每步前后都核对 before/after SHA，任一缺失、额外 payload、碰撞或中途失败即回滚全部 scope。结束时必须等于 `postPruneScopeTreeSha256`。任何手写 `git rm`、`cp`、shell glob 或另一脚本直接删除/覆盖这些目标都由静态门禁拒绝。
  - `--mode=verify-history --post-prune <full-oid|auto>` 完全忽略工作树和 index，分别从 manifest 的 `baselineCommit` 与给定 post-prune commit 的 Git trees 读取 literal blobs；重算 baseline tree OID、两棵 canonical scope SHA、每条 action 的 before/after 及 exact closure，拒绝 undeclared、stale、missing/extra 或 action 类型不符。`auto` 只选择 baseline 第一父链上“本提交 scope 等于 post-prune SHA、第一父提交 scope 不等于该 SHA”的唯一 transition commit；后续未改变 scope 的提交不能形成重复 match。它必须能在 Task 2 已提交、`git diff` 为空时复验。

  清单必须覆盖五个不再按当前字节分发的 ROM/副本（旧 Tobu、旧 Wordyl、Carazu、Shock Lobster、2048；前两者是 replace，后三者是 delete）、新 ROM/source inputs/原创标签的 add、旧 attribution/产品扫描/非 emulator 游戏/debug import graph/所有 Vite 会复制旧媒体的 delete，以及所有代码 replace。实现者只在外部临时 worktree 形成 candidate bytes；主工作树的 delete/replace/add 均由上述 `apply` 模式完成。
- [ ] `protectedPaths` 至少固定 `tests/fixtures/museum-review.glb` SHA `6cfe35284ca242fd3bc24531edb8fd4d678a4f1962e7cedf824c0c68662171d2`、阶段 02 的 `assets/museum/upstream/pocket-play-game-boy.glb`、`assets/museum/upstream/pocket-care-device.js` 与 `assets/museum/upstream/NOTICE.md`。三项 upstream protected path 的 path/SHA 必须与阶段 02 `assets/museum/sources.json`/NOTICE 一致，fixture 与 upstream paths 均不得出现在 `changes`；它们是测试或离线重建输入，不是公开发布资产。验证器还要求 `public/`、任一 child `dist/` 与根 `dist/` 不存在 `museum/upstream` 路径、冻结 input 文件名或与两个冻结 input 相同 SHA 的文件。
- [ ] 人工核对完整 action closure 后，在外部临时 worktree 准备候选内容，依次运行 `capture` 与 `apply`；不得另外执行散落的删除/替换命令。literal manifest 必须逐文件列出原计划的产品扫描及其 30 个标签、四个旧品牌标签（含唯一 yellow in-pocket）、`public/assets/other/nintendo-logo-screen.png`、Tetris/Space Invaders TPS、spritesheets 与源图、全部旧音频、`fonts/tetris.ttf`、`video/zelda-intro.mp4`、child `apps/game-boy/public/models/game-boy*.glb` 副本、`baked-game-boy.jpg`、`baked-power-indicator.jpg`、`background.jpg`、`baked-screen-shadow.png`、旧 favicon、三个非 emulator 游戏、debug import graph 与五个旧 ROM/副本；目录名只作审阅说明，manifest 不得用目录或 glob 代替逐文件 action。严禁删除、改写或公开复制阶段 02 已冻结的 `assets/museum/upstream/pocket-play-game-boy.glb`；运行时机身改为阶段 02 已批准并去标识的 `assets/museum/models/pocket-play.glb`，卡带为程序化中性壳；UI 图标用内联 SVG，插拔音效用 Web Audio 短音序。`game-boy-scene.ts` 与 `game-boy-scene-controller.ts` 删除 `GameBoyDebug` import、字段、`initGameBoyDebug()`、folder/update callback 和调用；`Assets.ts`、audio config/data、debug config、game registry 与 emulator mapping 全部同步收束。门禁运行 `rg -n "GameBoyDebug|game-boy-debug|Twenty48|2048\\.gb|ATTRIBUTION\\.md|Tetris|SpaceInvaders|PocketCreatures" apps/game-boy/src apps/game-boy/public apps/game-boy/tools`，预期无命中；随后 `npx tsc -p apps/game-boy/tsconfig.json --noEmit`，从 import graph 证明没有孤儿引用。
- [ ] 创建 `apps/game-boy/MODIFICATIONS.md`，首段逐字为 `Modified by GameX contributors on 2026-07-24.`，列出公开改名、移除旧媒体/内建游戏、开放 ROM 集、原创标签/音效和同源 bridge；明确 WasmBoy vendor 字节未修改。`source-license-links.ts` 在正式 UI 加 `<nav aria-label="Source and license">`，提供 `License (MIT)` → `new URL('./LICENSE.txt', document.baseURI)`、`Modifications` → `new URL('./MODIFICATIONS.md', document.baseURI)`、`WasmBoy source (GPL-3.0-or-later)` → `new URL('../source/wasmboy-0.7.1-source.tar.gz', document.baseURI)`、`Third-party notices` → `new URL('../legal/wasmboy-third-party-notices.json', document.baseURI)`，并在当前卡带详情把 manifest 的站点根相对 `source/<key>/source.tar.gz` 解析为 `new URL(\`../${localSourcePath}\`, document.baseURI)` 后显示 Source 与 license。公开 child route 固定为站点根下的 `/game-boy/`，所以这里只能上移一级；链接必须可见、可 Tab、带明确文本，不能只在根 Hub/README。
- [ ] `tests/e2e/pocket-play-cartridges.spec.js` 从正式 accessible shelf 逐一确认八个 manifest key；至少真实插入 `ucity` 与 `orbit-curator`，等待 WasmBoy running，发送一次正式按键，再退出。它不得直接调用 emulator 或 memory bridge。
- [ ] 此时创建 `generate-credits.mjs`、根级 `CREDITS.md` 与 `assets/legal/credits.json` 的严格 schema/Task 2 基线。八个模型与八个 ROM 全部从已验证 manifests/lock 生成，不能手抄；Task 2 输出标记 `finalized: false`，仅供 base build 与 UI 开发，Task 8 必须在 corresponding finalizer 后原子重写为 `finalized: true` 才能进入 competition `dist`：

| 类别 | 名称 | 作者/维护者 | 上游 | SPDX | 仓库内路径 / 修改 |
| --- | --- | --- | --- | --- | --- |
| Hub | GameX integration | KINGKAZMAX + contributors | 本仓库 | MIT | 白色环形展馆、协议、Memory Core、Air Control、演示编排 |
| Runtime | Pocket Play upstream | Andrii Babintsev / Snokke | `https://github.com/Snokke/game-boy-challenge` | MIT | 通用命名、开放 ROM、原创标签/音效 |
| Runtime | Pocket Care upstream | Francesco Dammacco / dammafra | `https://github.com/dammafra/dammagotchi` | AGPL-3.0-only | 原创像素/音频、同源 bridge |
| Emulator | WasmBoy 0.7.1 | Aaron Turner / contributors | npm `wasmboy@0.7.1`；registry `gitHead=8e96bcb70969d943b1ffc4028b169c835098ce04`；tarball/source hashes 在 Task 8 固定 | GPL-3.0-or-later | vendored npm dist 字节锁；同站点提供过滤后的完整对应源码与第三方 notices |
| Air | MediaPipe Tasks Vision 0.10.35 | Google | `https://github.com/google-ai-edge/mediapipe` | Apache-2.0 | 本地 Worker 推理 |

`renderCredits({ profile, models, homebrew, generatedRomLock, sourceInputLock, correspondingSourceLock })` 与 `renderCreditsJson(...)` 按 key 排序，展开每个 component/notices/source download，不把 µCity、GB Corp 或 WasmBoy 简化成单一许可。模型数组恰好八项，每项固定 creator/source/license/originalSha256/outputSha256；ROM 数组恰好八项，上游 ROM 固定 attribution/binary source+SHA/source artifact+member SHA，原创 ROM 固定 author/copyright/source-tree SHA/final ROM SHA/toolchain。GB Corp 必须分别展示 Dr. Ludos/MIT、Antonio Niño Díaz/BSD-2-Clause、krümel (crumb)#0723/`In the Town`/MIT；Wordyl 必须拼作 `stacksmashing`。JSON schema 固定 `version/finalized/generatedFrom/originalWork/upstreams/models/homebrew/air/sourceInputs/correspondingSource/attributionLinks` 且所有层级 `additionalProperties: false`；provisional 只允许 `correspondingSource: null`，competition 要求 finalized 且 source/final locks 的 SHA 与所有映射非空。生成后，rights verifier 在内存重建两份输出并要求字节一致；`assets/legal/credits.json` 的 SHA 写入比赛验证报告，不允许人工编辑。
- [ ] 在 `README.md` 准确说明原创/上游边界；在 `LICENSE` 的 bundled works 段落链接 `CREDITS.md`、Pocket Care AGPL source、WasmBoy source，以及 GPL ROM 的同站点对应源码，不把第三方内容重许可。
- [ ] 在运行 normal gate 前，使用前述同一个外部 Task 2 candidate root 显式刷新两遍 ROM 输入。每遍都强制新的 download scratch；`--determinism-report` 按固定顺序覆盖六个 binary、六个 filtered source archive、证据 members 与候选 source-input lock 的 SHA/size，两个报告必须逐字节相同。随后由 prune `capture/apply` 把 candidate 的 literal bytes 一次落入主工作树，并先提交 tracked ROM inputs；不得在下面任一 normal command 内调用 refresh：

```bash
rom_refresh_run_dir="$(mktemp -d)"
node "$task2_candidate_root/apps/game-boy/tools/sync-homebrew-provenance.mjs" \
  --refresh-inputs \
  --output-root "$task2_candidate_root" \
  --fresh-download-dir "$rom_refresh_run_dir/first-download" \
  --determinism-report "$rom_refresh_run_dir/first.json"
node "$task2_candidate_root/apps/game-boy/tools/sync-homebrew-provenance.mjs" \
  --refresh-inputs \
  --output-root "$task2_candidate_root" \
  --fresh-download-dir "$rom_refresh_run_dir/second-download" \
  --determinism-report "$rom_refresh_run_dir/second.json"
cmp "$rom_refresh_run_dir/first.json" "$rom_refresh_run_dir/second.json"
node "$task2_candidate_root/scripts/apply-pocket-play-prune.mjs" --mode=capture \
  --repo-root "$PWD" --baseline "$task2_baseline_commit" \
  --candidate-root "$task2_candidate_root"
node "$task2_candidate_root/scripts/apply-pocket-play-prune.mjs" --mode=apply \
  --repo-root "$PWD" --candidate-root "$task2_candidate_root"
git add apps/game-boy/tools/sync-homebrew-provenance.mjs \
  apps/game-boy/tools/homebrew-cartridges.json \
  apps/game-boy/public/roms assets/legal/source-inputs/roms \
  assets/legal/source-input-lock.json competition/source-package-members.json \
  scripts/lib/verify-safe-source-archive.mjs
git commit -m "build(roms): pin homebrew source inputs"
```

  `task2_candidate_root` 与 `task2_baseline_commit` 是本 Task 开始时创建并验证的仓库外绝对路径/完整 OID；脚本拒绝未设置、相对路径、位于仓库内或 baseline 不匹配。中间提交后，其余已由 executor 应用的 Task 2 变更可继续留在工作树，最终 Task 2 commit 必须成为 `verify-history --post-prune auto` 唯一匹配的 post-prune scope tree。

- [ ] 运行完整 Task 2 normal gate：

```bash
npm test -- tests/unit/homebrew-provenance.test.js
npm test -- tests/unit/source-archive-safety.test.js
npm run verify:homebrew-cartridges
npm run verify:competition-rights
npm --prefix apps/game-boy ci
npm --prefix apps/game-boy run build
npm run test:e2e -- tests/e2e/pocket-play-cartridges.spec.js
```

预期：八张卡带维持“六个固定开放上游 + 两个可重复原创”；GPL source 可同站点下载且安全逐成员扫描；CREDITS 两种输出可重建且字节一致；TypeScript 无 stale enum/debug import；`2048.gb`、旧 attribution 与 yellow in-pocket texture 不存在；构建产物没有被移除品牌素材；两张代表卡带真实启动。

- [ ] 提交：

```bash
git add apps/game-boy/rom-src apps/game-boy/tools apps/game-boy/src apps/game-boy/MODIFICATIONS.md \
  apps/game-boy/public competition/pocket-play-prune-manifest.json \
  competition/pocket-play-prune-manifest.schema.json assets/legal/source-inputs/roms \
  assets/legal/source-input-lock.json \
  CREDITS.md assets/legal/credits.json scripts/generate-credits.mjs \
  scripts/verify-homebrew-cartridges.mjs scripts/verify-competition-rights.mjs \
  scripts/apply-pocket-play-prune.mjs \
  scripts/lib/verify-safe-source-archive.mjs competition/source-package-members.json \
  tests/unit/homebrew-provenance.test.js tests/unit/source-archive-safety.test.js \
  tests/e2e/pocket-play-cartridges.spec.js \
  README.md LICENSE package.json
git commit -m "feat(pocket-play): ship open homebrew collection"
```

## Task 3：把 Pocket Care 的公开素材改成原创程序化表达

**Files:**

- Create: `apps/dammagotchi/src/experience/config/original-pixel-art.js`
- Create: `apps/dammagotchi/src/experience/ui/synth-soundboard.js`
- Create: `apps/dammagotchi/src/experience/ui/source-license-links.js`
- Create: `apps/dammagotchi/MODIFICATIONS.md`
- Modify: `apps/dammagotchi/src/experience/utils/sprites.js`
- Modify: `apps/dammagotchi/src/experience/config/sprites.js`
- Modify: `apps/dammagotchi/src/experience/config/resources.js`
- Modify: `apps/dammagotchi/src/experience/utils/resources.js`
- Modify: `apps/dammagotchi/src/experience/ui/soundboard.js`
- Modify: `apps/dammagotchi/src/experience/tutorial.js`
- Modify: `apps/dammagotchi/src/index.html`
- Modify: `apps/dammagotchi/src/script.js`
- Modify: `apps/dammagotchi/src/style.css`
- Modify: `apps/dammagotchi/static/favicon/site.webmanifest`
- Delete: unapproved image/audio/font assets listed in the file structure
- Delete: `apps/dammagotchi/assets.zip`
- Delete: `apps/dammagotchi/screens/`
- Delete: `apps/dammagotchi/html2png/`
- Create: `scripts/verify-pocket-care-originals.mjs`
- Create: `tests/unit/pocket-care-original-assets.test.js`
- Create: `tests/unit/synth-soundboard.test.js`

- [ ] 创建失败验证 `scripts/verify-pocket-care-originals.mjs`：扫描 `apps/dammagotchi/src` 与构建产物，禁止外部字体/图标脚本、品牌公开名、`static/sprites/pets` 和 `static/sounds/*.mp3`；要求 `createOriginalFrames` 与 `SynthSoundboard`。
- [ ] 在 `package.json` 增加 `"verify:pocket-care-originals": "node scripts/verify-pocket-care-originals.mjs"`，运行后预期因 Google Fonts、Font Awesome、角色图和 MP3 失败。
- [ ] 创建原创像素帧生成器；每个动作由确定性 seed、生命周期大小和 mood 生成，不读取第三方图片：

```js
const SIZE = { egg: 9, babies: 9, children: 11, teenagers: 13, adults: 15, seniors: 13, death: 9 };

function hash(text) {
  return [...text].reduce((value, char) => (value * 33 + char.charCodeAt(0)) >>> 0, 5381);
}

export function createOriginalFrames(path, action, count = 1) {
  const stage = path.split('.')[1] || 'misc';
  const size = SIZE[stage] || 11;
  const seed = hash(`${path}:${action}`);
  return Array.from({ length: count }, (_, frame) =>
    Array.from({ length: size }, (_, y) =>
      Array.from({ length: size }, (_, x) => {
        const cx = (size - 1) / 2;
        const body = ((x - cx) ** 2) / (cx ** 2) + ((y - cx) ** 2) / ((cx - 1) ** 2) < 0.78;
        const ear = y < 3 && (x === 2 + (seed % 2) || x === size - 3 - (seed % 2));
        const eye = y === Math.floor(size * 0.42) && (x === Math.floor(size * 0.35) || x === Math.floor(size * 0.65));
        const bounce = action === 'run' || action === 'happy' ? frame % 2 : 0;
        return Number((body && y + bounce < size - 1) || ear) ^ Number(eye);
      }),
    ),
  );
}
```

- [ ] `original-pixel-art.js` 同时导出完整的程序化纹理目录，保持现有 28 个资源键不变，避免移除图片后出现 `undefined texture`：

```js
import { CanvasTexture, NearestFilter, SRGBColorSpace } from 'three';

export const ORIGINAL_TEXTURE_KEYS = Object.freeze([
  'sceneBackground', 'screenBackground',
  'attention', 'discipline', 'duck', 'feed', 'light', 'medicine', 'meter', 'play',
  'arrow', 'meterEmpty', 'meterFull', 'tab', 'menuFeed', 'menuMeter1', 'menuMeter2',
  ...Array.from({ length: 11 }, (_, score) => `score${score}`),
]);

export function createOriginalTextureCatalog() {
  return Object.fromEntries(ORIGINAL_TEXTURE_KEYS.map((key) => {
    const canvas = document.createElement('canvas');
    canvas.width = key.startsWith('score') ? 64 : 32;
    canvas.height = 32;
    const context = canvas.getContext('2d', { alpha: true });
    drawOriginalPixelResource(context, key, canvas.width, canvas.height);
    const texture = new CanvasTexture(canvas);
    texture.magFilter = NearestFilter;
    texture.minFilter = NearestFilter;
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
    return [key, texture];
  }));
}
```

`drawOriginalPixelResource` 只用矩形、圆、线段和项目色板：两个 background 为原创网格/珍珠渐变；十个 UI 键为无品牌点阵符号；meter/tab/menu 为抽象框线；`score0…score10` 只画项目自带 3×5 数字段码。`resources.js` 改为 28 条 `{ name, type: 'generated-texture' }`，`utils/resources.js` 在加载开始前调用一次 `createOriginalTextureCatalog()`，同步写入既有 `items[name]` 后再发 `ready`；`dispose()` 逐项调用 texture.dispose()。

- [ ] 在 `Sprites` 中让 `pets.*`、`food` 与 `misc` 使用 `createOriginalFrames(this.path, name, split)` 并包装为现有 `Sprite` 实例；保留 `ready` 事件和 `get(name)` 缓存契约。
- [ ] 将 `sprites.js` 的生命周期模型固定为：`babies.sprout`、`children.pebble`、`teenagers.drift`、`adults.bloom`、`adults.moss`、`seniors.ember`；egg/death 使用无角色名的程序化帧。各 stage 继续提供现有代码调用的 `idle(2)/run(3)/happy/sad/eyes-closed/upset/bed(2)/eat(2)/no/sit`，babies 额外提供 `hatching`。`Life.setModel()` 仍从当前 stage 的这些新 key 中选择，旧存档载入遇到未知 model 时按 stage 映射到上述第一个 key；公开 UI、localStorage 新写入值和构建产物均不出现上游角色名。
- [ ] 创建 `SynthSoundboard`，用 Web Audio 短振荡器生成现有调用所需的十种原创提示音：

```js
const PATTERNS = {
  angry: [[196, 0.08], [155.56, 0.08], [130.81, 0.14]],
  button: [[660, 0.04]],
  happy: [[523.25, 0.08], [659.25, 0.08], [783.99, 0.12]],
  attention: [[880, 0.06], [0, 0.04], [880, 0.06]],
  hatching: [[392, 0.08], [523.25, 0.08], [659.25, 0.16]],
  evolution: [[440, 0.08], [554.37, 0.08], [659.25, 0.08], [880, 0.18]],
  discipline: [[220, 0.08], [196, 0.12]],
  'game-start': [[329.63, 0.06], [493.88, 0.12]],
  'time-speed': [[392, 0.035], [523.25, 0.035], [659.25, 0.05]],
  death: [[293.66, 0.16], [246.94, 0.16], [196, 0.24]],
};
```

`play(name, times = 1)` 顺序排程 `OscillatorNode + GainNode` 并乘以 `time.speedSetting`；未知名称在开发模式抛错。保留现有 `setMuted/toggleMuted/playBackgroundMusic/stopBackgroundMusic/toggleBackgroundMusic/pause/resume/dispose` API。背景音乐不读取文件：`playBackgroundMusic()` 以 76 BPM（节拍间隔严格为 `60 / 76` 秒）循环 `[261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23]`；每个音符发声长度为 0.22 秒、gain 0.045。`stopBackgroundMusic()` 清除 timer 并停止已排程节点。`pause()` 调用 `audioContext.suspend()`，`resume()` 只恢复暂停前为 running 的 context，`dispose()` 停止活动节点、移除键盘/按钮 listener 并关闭 context。

- [ ] 创建两个资源契约单测。`pocket-care-original-assets.test.js` 遍历 28 个 `ORIGINAL_TEXTURE_KEYS`、全部生命周期与动作，断言每个请求都得到非空帧/纹理、动作帧数严格匹配 `idle(2)/run(3)/happy/sad/eyes-closed/upset/bed(2)/eat(2)/no/sit`，babies 另有 `hatching`，并在 `dispose()` 后验证 28 个 texture 各释放一次。`synth-soundboard.test.js` 用 fake `AudioContext` 逐一调用十个 `PATTERNS`，断言静音时不建节点、76 BPM 调度间隔为 `60 / 76`、单音发声 0.22 秒、`pause/resume` 保持先前状态，`stopBackgroundMusic/dispose` 清除 timer、停止所有节点并移除 listener。

- [ ] 从 `resources.js` 移除所有文件 URL 并换成上述 28 个生成描述符；Three.js 背景读取 `sceneBackground` 的原创珍珠网格，屏幕读取 `screenBackground` 的 32×24 点阵网格。执行 `rg -n \"\\.webp|\\.png|\\.mp3|https?://\" apps/dammagotchi/src/experience/config/resources.js apps/dammagotchi/src/experience/ui/soundboard.js`，预期无命中。
- [ ] 将 `index.html` 标题改为 `Pocket Care`，删除 `fonts.googleapis.com`、`fonts.gstatic.com` 和 Font Awesome；用带 `aria-hidden="true"` 的内联 SVG 替换 palette、mute、music、play、dice、expand、question 图标，并为每个按钮增加 `aria-label`。
- [ ] `tutorial.js` 把 `images/keys/*.png` 全部替换为语义 `<kbd>`；CSS 使用系统 `cursor: auto/grab/grabbing/pointer`。随后用精确清单删除所有已替换媒体：

```bash
git rm -r apps/dammagotchi/static/cursors \
  apps/dammagotchi/static/environment-maps \
  apps/dammagotchi/static/fonts \
  apps/dammagotchi/static/images/credits \
  apps/dammagotchi/static/images/keys \
  apps/dammagotchi/static/sounds \
  apps/dammagotchi/static/sprites \
  apps/dammagotchi/static/textures
git rm apps/dammagotchi/static/favicon/apple-touch-icon.png \
  apps/dammagotchi/static/favicon/favicon-96x96.png \
  apps/dammagotchi/static/favicon/favicon.ico \
  apps/dammagotchi/static/favicon/web-app-manifest-192x192.png \
  apps/dammagotchi/static/favicon/web-app-manifest-512x512.png
git rm apps/dammagotchi/assets.zip
git rm -r apps/dammagotchi/screens apps/dammagotchi/html2png
```

把保留的 `favicon.svg` 改为由圆、三按钮和点阵叶片组成的原创图标；重写 `site.webmanifest` 仅引用该 SVG 并使用 `Pocket Care`。删除后运行 `git ls-files apps/dammagotchi/static`，预期只剩原创 `favicon.svg/site.webmanifest` 与验证器允许的明确文件。
- [ ] 创建 `apps/dammagotchi/MODIFICATIONS.md`，首段逐字为 `Modified by GameX contributors on 2026-07-24.`，逐项列出公开改名、原创程序化像素/纹理/声音、移除旧媒体、协议 bridge 与无外链构建，并保留“上游仍为 Francesco Dammacco / AGPL-3.0-only”。`source-license-links.js` 在正式 UI 挂载 `<nav aria-label="Source and license">`，提供 `Source code` → `new URL('../source/pocket-care-source.tar.gz', document.baseURI)`、`License (AGPL-3.0-only)` → `new URL('./LICENSE.txt', document.baseURI)`、`Modifications` → `new URL('./MODIFICATIONS.md', document.baseURI)`；公开 child route 固定为站点根下的 `/dammagotchi/`，所以 Source 只上移一级。三条链接可见、可 Tab 且不依赖 Hub dialog。Task 8 的 `prepare-apps.mjs` 必须把原始 LICENSE 与 MODIFICATIONS 逐字复制进最终 child 目录并校验 SHA。
- [ ] `verify-pocket-care-originals.mjs` 额外拒绝 `assets.zip`、`screens/`、`html2png/`、任何删掉媒体扩展和缺少上述 nav/MODIFICATIONS/date 的构建；它检查 `MODIFICATIONS.md` 的日期等于 profile、非未来日期，并要求输出中只有 allowlist 的 `LICENSE.txt`/`MODIFICATIONS.md` 法律文本可以包含上游专名。
- [ ] 运行：

```bash
npm run verify:pocket-care-originals
npm test -- tests/unit/pocket-care-original-assets.test.js tests/unit/synth-soundboard.test.js
npm --prefix apps/dammagotchi ci
npm --prefix apps/dammagotchi run build
```

预期：无外部请求或禁止公开名，照料、孵化、进化、小游戏、音效开关仍可用。

- [ ] 提交：

```bash
git add apps/dammagotchi/src apps/dammagotchi/static apps/dammagotchi/MODIFICATIONS.md \
  scripts/verify-pocket-care-originals.mjs \
  tests/unit/pocket-care-original-assets.test.js tests/unit/synth-soundboard.test.js package.json
git commit -m "feat(pocket-care): replace public media with original assets"
```

## Task 4：修复 BGM 循环与停止语义

**Files:**

- Create: `src/bgm-scheduler.js`
- Create: `tests/unit/bgm-scheduler.test.js`
- Create: `scripts/verify-bgm-scheduler.mjs`
- Modify: `src/bgm.js`

- [ ] 创建假时钟失败测试：

```js
import { expect, it, vi } from 'vitest';
import { createLoopScheduler } from '../../src/bgm-scheduler.js';

it('schedules every loop before its start and cancels on stop', () => {
  let now = 0;
  const schedulePattern = vi.fn(() => [Symbol('voice')]);
  const cancelScheduled = vi.fn();
  const loop = createLoopScheduler({
    getCurrentTime: () => now,
    schedulePattern,
    cancelScheduled,
    loopDuration: 19.2,
    lookAheadSeconds: 0.25,
  });
  loop.start(0.08);
  expect(schedulePattern).toHaveBeenCalledWith(0.08);
  now = 19.04; loop.tick();
  expect(schedulePattern).toHaveBeenCalledWith(19.28);
  now = 38.25; loop.tick();
  expect(schedulePattern).toHaveBeenCalledWith(38.48);
  loop.stop();
  expect(cancelScheduled).toHaveBeenCalledTimes(3);
});
```

- [ ] 运行 `npm test -- tests/unit/bgm-scheduler.test.js`，预期因模块不存在失败。
- [ ] 创建调度器：

```js
export function createLoopScheduler({
  getCurrentTime, schedulePattern, cancelScheduled, loopDuration, lookAheadSeconds,
}) {
  let nextStart = 0;
  let active = [];
  let running = false;
  const tick = () => {
    if (!running) return;
    const horizon = getCurrentTime() + lookAheadSeconds;
    while (nextStart <= horizon) {
      active.push(...schedulePattern(nextStart));
      nextStart += loopDuration;
    }
  };
  return {
    start(delaySeconds = 0.08) {
      if (running) return;
      running = true;
      nextStart = getCurrentTime() + delaySeconds;
      tick();
    },
    tick,
    stop() {
      running = false;
      for (const node of active) cancelScheduled(node);
      active = [];
    },
  };
}
```

- [ ] 重构 `bgm.js`：`playNote` 返回 oscillator，`schedulePattern(start)` 返回本轮 oscillator 数组；`stop()` 对未来和活动 oscillator 调用安全的 `stop()`，再 suspend context；删除错误条件 `loopStart + loopDuration < ahead`。
- [ ] 创建 `verify-bgm-scheduler.mjs`，静态拒绝旧条件，并运行三轮 fake-clock 断言。
- [ ] 运行：

```bash
npm test -- tests/unit/bgm-scheduler.test.js
node scripts/verify-bgm-scheduler.mjs
```

预期：三轮连续调度、stop→start 不重复、所有节点可取消。

- [ ] 提交：

```bash
git add src/bgm.js src/bgm-scheduler.js tests/unit/bgm-scheduler.test.js scripts/verify-bgm-scheduler.mjs
git commit -m "fix(audio): keep ambient loop gapless and cancellable"
```

## Task 5：消除运行时外链并提供可恢复资源错误

**Files:**

- Create: `src/runtime/load-with-timeout.js`
- Create: `tests/unit/load-with-timeout.test.js`
- Create: `tests/unit/verify-offline-build-mode.test.js`
- Create: `tests/unit/build-all-order.test.js`
- Create: `scripts/verify-offline-build.mjs`
- Modify: `scripts/lib/verify-safe-source-archive.mjs`
- Modify: `competition/source-package-members.json`
- Modify: `tests/unit/source-archive-safety.test.js`
- Modify: `src/runtime/focus-portal.js`
- Modify: `apps/game-boy/src/core/loader.ts`
- Modify: `apps/dammagotchi/src/experience/utils/resources.js`
- Modify: `scripts/build-all.mjs`
- Modify: `scripts/prepare-apps.mjs`

- [ ] 创建失败测试，覆盖成功、8 秒超时、取消和 retry：

```js
import { expect, it, vi } from 'vitest';
import { loadWithTimeout } from '../../src/runtime/load-with-timeout.js';

it('aborts a stalled load at the deadline', async () => {
  vi.useFakeTimers();
  const abort = vi.fn();
  const promise = loadWithTimeout({
    start: () => ({ promise: new Promise(() => {}), abort }),
    timeoutMs: 8_000,
  });
  await vi.advanceTimersByTimeAsync(8_000);
  await expect(promise).rejects.toMatchObject({ code: 'LOAD_TIMEOUT' });
  expect(abort).toHaveBeenCalledOnce();
  vi.useRealTimers();
});
```

- [ ] 运行该测试，预期因模块不存在失败。
- [ ] 创建 `loadWithTimeout`；内部 `Promise.race`，超时先 `abort()` 再抛带 `code` 的 Error，成功或失败均清除 timer。
- [ ] FocusPortal 使用该函数包装 iframe ready；失败 UI 固定提供 `Retry` 与 `Back to museum`，两条路径先 `release-all` 再清理 iframe。
- [ ] Game Boy loader 和 Pocket Care resources 为每个失败资源派发结构化 `resource-error`；父桥接转成 `gamex:error`，不得只写 `console.error`。
- [ ] 创建 `verify-offline-build.mjs`，CLI 必须显式且仅接受 `--mode=base|competition`，缺 mode 或未知值 fail closed。两个 mode 共用 allowlist 核心，而不是 CDN 黑名单：
  - 递归枚举 `dist/` 的所有文件路径；对 `html/js/css/json/svg/xml/webmanifest/md/txt` 解码并提取 `http(s):`、协议相对 URL、`WebSocket/EventSource/sendBeacon/XMLHttpRequest` 及动态远程 `fetch/import`。
  - 生产运行时代码只允许相对 URL、`new URL(..., import.meta.url)` 与当前同源；任何远程运行时 URL 一律失败。只有重新通过 schema/hash 的 `dist/legal/credits.json`、`dist/museum/sources.json` 与 `dist/museum/manifest.json` 可含纯文本来源/许可链接；这些链接汇总进独立的 `attributionLinks` allowlist，静态门禁同时证明运行时代码没有 import/fetch 这些外部值。
  - 两种 mode 都从阶段 02 source catalog 重算 frozen upstream path/SHA，要求 `assets/museum/upstream/{pocket-play-game-boy.glb,pocket-care-device.js,NOTICE.md}` 存在于仓库但绝不出现在 `public/`、child dist 或根 `dist/`；也拒绝任何输出文件与两个 frozen input 同 SHA。`dist/museum` 仍只能是 sources/manifest/review 与八个 approved sanitized GLB。
  - 两种 mode 都扫描文件名、路径与运行时文本，拒绝禁止词、测试注入符号和 `latest`；品牌词例外只来自重新验证的 museum manifest/source facts 与 Credits schema，不能因路径在 legal/museum 下就跳过内容校验。
- [ ] `base` mode 服务普通 `npm run build`：允许 Vite `.map`，不要求 `dist/source/`、`corresponding-source-lock.json`、`source-input-lock.json` 的发布副本或最终 source coverage；若出现 source archive、corresponding lock 或 frozen upstream input 则反而失败，避免普通包混入半成品法律 artifact。它可以验证 Task 2 当前 credits，但不把它当作 Task 8 finalized credits。
- [ ] `competition` mode 只在 Task 8 最终构建后运行：要求根与两个 child 的 `.map` 数量严格为 0；要求 `dist/legal/{CREDITS.md,credits.json,corresponding-source-lock.json,source-input-lock.json,wasmboy-third-party-notices.json}` 和 `dist/source/` 精确闭包。对每个 tar/tgz 先核对 corresponding lock artifact hash，再调用 `verifySafeSourceArchive` 与 literal member allowlist；nested archive 递归检查，任何 absolute/`..`/link/special/duplicate/Unicode collision、未列 member、未关联 rights evidence 的 media 或 ROM 均失败。
- [ ] `prepare-apps.mjs` 同样按 `VITE_GAME_X_MODE` 分支：base 明确删除/不复制 `public/source`、corresponding/source-input lock 与 finalized-only notices，只 stage 当前 credits 和普通公开资产；competition 则要求 Task 8 finalizer/credits 已完成后才复制完整 source/legal 闭包。无论 tracked lock 是否已存在，base build 都不能意外把它带入 `dist`。
- [ ] 两种 mode 的公开 runtime route 都沿用阶段 01 注册表的唯一契约：把冻结后的 Game Boy child dist 复制到 `public/game-boy/`，把 Pocket Care child dist 复制到 `public/dammagotchi/`；根 Vite 因而产出 `dist/game-boy/index.html` 与 `dist/dammagotchi/index.html`。禁止另建 `public/apps`、`dist/apps`、alias 或运行时 URL rewrite。`verify-offline-build.mjs` 必须读取真实 `DEVICE_REGISTRY`，将两个 LIVE `runtimeUrl` 在 `BASE_URL='./'` 下规范化为仓库相对 dist 路径，拒绝 absolute/cross-origin/`..`，并逐一断言命中的 regular `index.html` 存在；missing/extra LIVE route 都失败。
- [ ] 在本 Task 的 standalone/base build 即清理依赖边界并建立后续唯一顺序：`scripts/build-all.mjs` 严格执行 `game-boy ci → game-boy build → stage game-boy LICENSE/MODIFICATIONS → dammagotchi ci → dammagotchi build → stage dammagotchi LICENSE/MODIFICATIONS`；每个 stage 后对应 dist 冻结。`scripts/prepare-apps.mjs` 只复制已构建内容，删除其中所有 `npm install/npm ci/child build` 调用。单测捕获 event/spawn 顺序并拒绝 `npm install`、两次 ci 后才 build、build-before-ci、延迟 stage 与 prepare 阶段启动包管理器；Task 8 只在这个已通过的 exact child subsequence 前后增加 source history/prepare/finalizer/credits/root gate。
- [ ] `tests/unit/verify-offline-build-mode.test.js` 用临时 dist 证明：base 接受 `.map` 且不需要 corresponding lock；competition 对同一 fixture 分别因 `.map` 和缺 lock 失败；两种 mode 都拒绝外链、测试 hook、`assets/museum/upstream` 路径、冻结 input 同 SHA 副本；competition 只有在 source/legal exact closure 与 lock 全部存在时通过。
- [ ] 在 E2E 离线用例中：

```js
import {
  enterExhibit,
  exitRuntime,
  resolvePocketCareNeed,
  selectExhibit,
  startPocketPlayCartridge,
} from './helpers/runtime-actions.js';

const runtimeErrors = [];
page.on('pageerror', (error) => runtimeErrors.push(`pageerror:${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') runtimeErrors.push(`console:${message.text()}`);
});
await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (route) => route.abort());
await page.goto('/');
await expect(page.locator('.museum-canvas')).toBeVisible();
await selectExhibit(page, 'pocket-play');
await enterExhibit(page);
await startPocketPlayCartridge(page, 'ucity', 1);
await exitRuntime(page);
await selectExhibit(page, 'pocket-care');
await enterExhibit(page);
await resolvePocketCareNeed(page, 2);
await exitRuntime(page);
await expect(page.locator('[data-status="coming-soon"]')).toHaveCount(6);
expect(runtimeErrors).toEqual([]);
```

- [ ] 离线 spec 还要记录所有 `request`；除 `http://127.0.0.1:<preview-port>/...` 外不得出现网络请求。两个 iframe 都必须等待 `data-runtime-state="ready"`，完成一次正式操作并返回，不能只断言 iframe 可见。
- [ ] 运行 `npm run build && node scripts/verify-offline-build.mjs --mode=base && npm run test:e2e -- tests/e2e/offline.spec.js`，预期全部通过；此处是允许 sourcemap、无需 corresponding lock 的开发阶段回归，最终 `dist` 证据由 Task 8 的 competition mode 重新执行。
- [ ] 提交：

```bash
git add src/runtime apps/game-boy/src/core/loader.ts \
  apps/dammagotchi/src/experience/utils/resources.js scripts/prepare-apps.mjs \
  scripts/build-all.mjs \
  scripts/verify-offline-build.mjs scripts/lib/verify-safe-source-archive.mjs \
  competition/source-package-members.json tests/unit/load-with-timeout.test.js \
  tests/unit/source-archive-safety.test.js tests/unit/verify-offline-build-mode.test.js \
  tests/unit/build-all-order.test.js tests/e2e/offline.spec.js
git commit -m "feat(offline): make every runtime resource recoverable"
```

## Task 6：加入可访问偏好与可见 Credits

**Files:**

- Create: `src/settings/preferences.js`
- Create: `src/ui/create-accessibility-panel.js`
- Create: `src/ui/create-credits-dialog.js`
- Create: `tests/unit/preferences.test.js`
- Modify: `src/main.js`
- Modify: `src/styles.css`
- Modify: `src/museum/create-museum-scene.js`

- [ ] 创建偏好失败测试：损坏 JSON 返回默认值；v1 只接受 `reducedMotion/highContrast/muted` 布尔值；保存后恢复。
- [ ] 实现：

```js
const KEY = 'gamex:preferences:v1';
export const DEFAULT_PREFERENCES = Object.freeze({
  reducedMotion: false,
  highContrast: false,
  muted: false,
});
export function readPreferences(storage) {
  try {
    const value = JSON.parse(storage.getItem(KEY));
    return Object.fromEntries(Object.entries(DEFAULT_PREFERENCES)
      .map(([key, fallback]) => [key, typeof value?.[key] === 'boolean' ? value[key] : fallback]));
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}
export function writePreferences(storage, value) {
  storage.setItem(KEY, JSON.stringify({ ...DEFAULT_PREFERENCES, ...value }));
}
```

- [ ] `createAccessibilityPanel` 渲染三个有标签的开关；减少动态立即关闭惯性/相机推进/碎片轨迹，高对比在 `documentElement` 设置 `data-contrast="high"`。静音先控制 Hub BGM，再通过阶段 03 已固定并测试的 `gamex:settings { muted }` 协议发给活动 runtime；进入新 runtime 时立即同步当前值，收到同 type 的 `{ phase: 'ack', muted }` 才更新其状态指示，不在阶段 05 临时扩展协议。
- [ ] `prepare-apps.mjs` 把 `CREDITS.md` 与 `assets/legal/credits.json` 分别逐字节复制为 `public/legal/CREDITS.md` 与 `public/legal/credits.json`；`createCreditsDialog` 使用原生 `<dialog>`，提供 `Credits & source` 按钮与完整键盘焦点，首次打开时同源 fetch 该离线 JSON 并渲染每项 author/source/license、input/output/artifact hashes、notices 与可下载源码，同时提供 `Full credits (Markdown)` → `./legal/CREDITS.md`。失败时显示同源 CREDITS/source 指引。每次复制立即比较源/目标字节与 SHA-256；Task 8 finalizer 后必须重新生成并重新 stage，比赛构建再比较源、public、`dist/legal/` 三层两种文件。不得把必要署名只放在 README，也不得把第三方品牌词打进首屏 JS chunk。
- [ ] `MuseumScene` 增加 `setPreferences(preferences)`；其中 `setPreferences({ reducedMotion })` 委托阶段 02 已有的 `setReducedMotion(reducedMotion)`，不建立第二份状态。高对比把文字/轮廓提升到 WCAG AA，减少动态固定核心旋转并使用瞬时吸附。
- [ ] 在 `src/styles.css` 加可见 `:focus-visible`、`[data-contrast=high]` 和 `@media (forced-colors: active)`；Air 状态同时有文字与图标。
- [ ] 运行 `npm test -- tests/unit/preferences.test.js` 与键盘 E2E：Tab 可到八图标、设置、Credits、Enter 进入、Escape 退出。
- [ ] 提交：

```bash
git add src/settings src/ui src/main.js src/styles.css src/museum/create-museum-scene.js \
  tests/unit/preferences.test.js
git commit -m "feat(a11y): add persistent accessible museum controls"
```

## Task 7：锁定首屏、模型和并发预算

**Files:**

- Create: `scripts/verify-bundle-budget.mjs`
- Create: `src/runtime/create-concurrency-limiter.js`
- Create: `tests/unit/asset-load-limiter.test.js`
- Modify: `package.json`
- Modify: `vite.config.js`
- Modify: `src/museum/create-museum-scene.js`
- Modify: `src/museum/asset-resolver.js`
- Modify: `src/air-control/create-air-control.js`

- [ ] 在本任务开始即把根 `vite.config.js` 的 `build.manifest` 设为 `true`（保留现有 plugin/server 字段）；先执行 `npm run build`，确认 `dist/.vite/manifest.json` 存在，再运行任何 bundle verifier。Task 8 只补 competition preview 与 sourcemap 模式，不再首次启用 manifest。
- [ ] 创建预算脚本：从 Vite manifest 的 `index.html` entry 出发，递归追踪静态 `imports`、entry CSS 与它们引用的首屏字体/图片；把这些文件的压缩前字节累加为 `initialBytes`。另统计 `dist/museum/models` 八个优化模型；动态 Air Worker、WASM 和模型必须不在初始闭包中。
- [ ] 固定断言：

```js
assert.ok(museumBytes <= 4 * 1024 * 1024, `museum assets ${museumBytes} exceed 4 MiB`);
assert.ok(
  initialBytes <= profile.firstScreenBudgetBytes,
  `initial payload ${initialBytes} exceeds ${profile.firstScreenBudgetBytes}`,
);
assert.ok(!initialFiles.some((file) => /gesture_recognizer|tasks-vision|gesture-worker/.test(file)));
assert.equal(manifest.assets.length, 8);
assert.ok(manifest.assets.every((asset) => asset.triangleCount <= asset.maxTriangles));
assert.ok(manifest.assets.every((asset) => asset.triangleCount <= 50_000));
```

- [ ] 运行 `node scripts/verify-bundle-budget.mjs`，预期在尚未构建或超预算时失败并打印逐文件字节数。
- [ ] MuseumScene 继续限制 DPR≤1.5；非聚焦设备使用中景 LOD≤25k，只有聚焦设备可用≤50k；隐藏标签页暂停父 renderer。
- [ ] 先创建可执行的 limiter API；queued abort 与 task reject 都必须释放/移除槽位：

```js
// src/runtime/create-concurrency-limiter.js
function abortError(signal) {
  if (signal?.reason instanceof Error) return signal.reason;
  return Object.assign(new Error('Aborted'), { name: 'AbortError' });
}

export function createConcurrencyLimiter(limit) {
  if (!Number.isInteger(limit) || limit < 1) throw new TypeError('limit must be a positive integer');
  let active = 0;
  const queue = [];

  const drain = () => {
    while (active < limit && queue.length > 0) {
      const job = queue.shift();
      if (job.signal?.aborted) {
        job.cleanup();
        job.reject(abortError(job.signal));
        continue;
      }
      active += 1;
      Promise.resolve()
        .then(job.task)
        .then(job.resolve, job.reject)
        .finally(() => {
          active -= 1;
          job.cleanup();
          drain();
        });
    }
  };

  return (task, { signal } = {}) => new Promise((resolve, reject) => {
    const job = { task, signal, resolve, reject, cleanup: () => {} };
    const onAbort = () => {
      const index = queue.indexOf(job);
      if (index < 0) return; // running task receives the same signal and owns cancellation
      queue.splice(index, 1);
      job.cleanup();
      reject(abortError(signal));
    };
    job.cleanup = () => signal?.removeEventListener('abort', onAbort);
    signal?.addEventListener('abort', onAbort, { once: true });
    queue.push(job);
    drain();
  });
}
```

- [ ] `AssetResolver` 的注入边界固定为下面签名。download limiter 必须包住 `fetch + arrayBuffer`，完成后才把 bytes 交给独立 decode limiter，不能让 decode 占着 download slot：

```js
export class AssetResolver {
  constructor({
    fetchImpl = globalThis.fetch,
    parseGlb,
    downloadLimiter = createConcurrencyLimiter(2),
    decodeLimiter = createConcurrencyLimiter(1),
  }) {
    Object.assign(this, { fetchImpl, parseGlb, downloadLimiter, decodeLimiter });
  }

  async resolve(asset, { signal } = {}) {
    const bytes = await this.downloadLimiter(async () => {
      const response = await this.fetchImpl(asset.url, { signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${asset.url}`);
      return response.arrayBuffer();
    }, { signal });
    return this.decodeLimiter(() => this.parseGlb(bytes, asset, { signal }), { signal });
  }
}
```

- [ ] 将以下 deferred 测试先落盘并运行红灯；它在任何 gate 放行前证明只启动两个下载，全部放行后证明 decode 峰值为一、第三个失败任务不泄漏槽位，而且后续任务仍完成：

```js
import { expect, it, vi } from 'vitest';
import { AssetResolver } from '../../src/museum/asset-resolver.js';

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

it('limits eight deferred downloads to two and decodes to one', async () => {
  const fetchGates = Array.from({ length: 8 }, deferred);
  const parseGates = Array.from({ length: 8 }, deferred);
  let nextFetch = 0;
  let downloadActive = 0;
  let downloadPeak = 0;
  let decodeActive = 0;
  let decodePeak = 0;

  const fetchImpl = vi.fn(async () => {
    const index = nextFetch++;
    downloadActive += 1;
    downloadPeak = Math.max(downloadPeak, downloadActive);
    try {
      await fetchGates[index].promise;
      if (index === 2) throw new Error('fixture download failed');
      return {
        ok: true,
        arrayBuffer: async () => Uint8Array.of(index).buffer,
      };
    } finally {
      downloadActive -= 1;
    }
  });
  const parseGlb = vi.fn(async (bytes) => {
    const index = new Uint8Array(bytes)[0];
    decodeActive += 1;
    decodePeak = Math.max(decodePeak, decodeActive);
    try {
      await parseGates[index].promise;
      return `model-${index}`;
    } finally {
      decodeActive -= 1;
    }
  });

  const resolver = new AssetResolver({ fetchImpl, parseGlb });
  const pending = Array.from({ length: 8 }, (_, index) =>
    resolver.resolve({ id: `asset-${index}`, url: `/museum/models/${index}.glb` }));
  const settled = Promise.allSettled(pending);

  await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(2));
  expect(downloadActive).toBe(2);
  expect(downloadPeak).toBe(2);
  expect(decodePeak).toBe(0);

  fetchGates.forEach((gate) => gate.resolve());
  parseGates.forEach((gate) => gate.resolve());
  const results = await settled;

  expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(7);
  expect(results.filter(({ status }) => status === 'rejected')).toHaveLength(1);
  expect(fetchImpl).toHaveBeenCalledTimes(8);
  expect(downloadPeak).toBe(2);
  expect(decodePeak).toBe(1);
  expect(downloadActive).toBe(0);
  expect(decodeActive).toBe(0);
});
```

再加一个 `AbortController` 用例：limit=1 时阻塞第一项、abort 排队第二项、放行第一项、第三项仍执行；断言第二项 `AbortError` 且 active 最终为零。FocusPortal 激活时 `scene.setPaused(true)`，退出才恢复。
- [ ] Air Control 入口必须动态 `import('./air-control/create-air-control.js')`，未点击前 Network 中没有模型、WASM 或 tasks-vision chunk。
- [ ] 在 `package.json` 增加 `"verify:bundle-budget": "node scripts/verify-bundle-budget.mjs"`，运行 `npm test -- tests/unit/asset-load-limiter.test.js && npm run build && npm run verify:bundle-budget`，预期通过。
- [ ] 提交：

```bash
git add scripts/verify-bundle-budget.mjs src/runtime/create-concurrency-limiter.js \
  tests/unit/asset-load-limiter.test.js \
  package.json vite.config.js src/museum src/air-control
git commit -m "perf: enforce competition download and renderer budgets"
```

## Task 8：实现并验证 120 秒 Judge Demo

**Files:**

- Create: `src/demo/judge-demo-script.js`
- Create: `src/demo/create-judge-demo-panel.js`
- Create: `tests/e2e/competition-demo.spec.js`
- Create: `tests/e2e/memory-deadline.spec.js`
- Create: `tests/e2e/air-control-production.spec.js`
- Create: `tests/unit/memory-deadline.test.js`
- Create: `playwright.memory-deadline.config.js`
- Create: `playwright.competition.config.js`
- Create: `scripts/build-corresponding-source.mjs`
- Create: `scripts/assets/rebuild-pocket-care.mjs`
- Create: `assets/legal/corresponding-source-lock.json`
- Create: `assets/legal/source-inputs/wasmboy/wasmboy-0.7.1.filtered.tar.gz`
- Create: `assets/legal/source-inputs/wasmboy/third-party/{audiobuffer-to-wav-8878a20c,big-integer-1.6.48,idb-2.1.3,raf-3.4.1,performance-now-2.1.0,responsive-gamepad-1.1.0,uzip-6a4bbf88}.filtered.tar.gz`
- Create: `assets/legal/wasmboy-third-party-notices.json`
- Create: `scripts/verify-competition.mjs`
- Modify: `CREDITS.md`
- Modify: `assets/legal/credits.json`
- Modify: `assets/legal/source-input-lock.json`
- Modify: `scripts/generate-credits.mjs`
- Modify: `src/ui/create-credits-dialog.js`
- Modify: `src/main.js`
- Modify: `src/styles.css`
- Modify: `vite.config.js`
- Modify: `apps/game-boy/vite.config.js`
- Modify: `apps/dammagotchi/vite.config.js`
- Modify: `scripts/build-all.mjs`
- Modify: `scripts/prepare-apps.mjs`
- Modify: `tests/unit/build-all-order.test.js`
- Modify: `tests/unit/source-archive-safety.test.js`
- Modify: `competition/source-package-members.json`
- Modify: `scripts/lib/verify-safe-source-archive.mjs`
- Modify: `apps/game-boy/MODIFICATIONS.md`
- Modify: `apps/dammagotchi/MODIFICATIONS.md`
- Modify: `package.json`

- [ ] 创建不可变演示脚本：

```js
export const JUDGE_DEMO = Object.freeze([
  { at: 0, target: 'overview', label: 'Eight devices, one living museum' },
  { at: 8, target: 'pocket-play', label: 'Enter a playable artifact' },
  { at: 40, target: 'memory-core', label: 'Play changes place' },
  { at: 52, target: 'pocket-care', label: 'One protocol, another runtime' },
  { at: 86, target: 'coming-soon-tour', label: 'An extensible open-device lineage' },
  { at: 110, target: 'overview', label: 'Playable Artifacts of Childhood' },
  { at: 120, target: 'complete', label: 'Demo complete' },
]);
```

- [ ] `createJudgeDemoPanel` 在 `?demo=judge` 时显示当前段落、下一目标与倒计时；只提供 `Next cue` 和 `Restart`，不自动触发相机、游戏或摄像头，确保演示仍由评委/演示者真实操作。
- [ ] 创建 Playwright 用例并用时钟加速到 12 秒测试 cue 逻辑；真实交互复用阶段 03 的 `tests/e2e/helpers/runtime-actions.js`，进入两个实际 iframe 并完成公开操作，不创建生产或测试专用 memory 按钮：

```js
import {
  enterExhibit,
  exitRuntime,
  resolvePocketCareNeed,
  selectExhibit,
  startPocketPlayCartridge,
} from './helpers/runtime-actions.js';

test('completes the judge story with two memories and six future exhibits', async ({ page }) => {
  await page.goto('/?demo=judge');
  await expect(page.locator('[data-exhibit-id]')).toHaveCount(8);
  await selectExhibit(page, 'pocket-play');
  await enterExhibit(page);
  await startPocketPlayCartridge(page, 'tobu', 1);
  await exitRuntime(page);
  await selectExhibit(page, 'pocket-care');
  await enterExhibit(page);
  await resolvePocketCareNeed(page, 2);
  await exitRuntime(page);
  await expect(page.locator('[data-status="coming-soon"]')).toHaveCount(6);
  await expect(page.getByText('Playable Artifacts of Childhood')).toBeVisible();
});
```

`runtime-actions.js` 只操作阶段 03 暴露的正式无障碍按钮、同源 iframe 与稳定 `data-runtime-state`，不得调用 `postMessage` 伪造 memory。2 秒 API 固定如下；caller 可先等待 iframe ready/首个正式控件 enabled，但 `startedAt` 后的第一件事必须是调用会执行第一次正式 click 的 `performFormalAction`，且 runtime 状态与 Memory Core 都吃同一个剩余预算：

```js
// tests/e2e/helpers/runtime-actions.js
import { expect } from '@playwright/test';
import { performance } from 'node:perf_hooks';
import { CARE_NEED_PATTERN } from '../../../src/runtime/care-needs.js';

export function createMemoryDeadline({
  timeoutMs = 2_000,
  now = () => performance.now(),
}) {
  const startedAt = now();
  return Object.freeze({
    remaining: () => Math.max(1, timeoutMs - (now() - startedAt)),
    assertWithin() {
      const elapsed = now() - startedAt;
      if (elapsed > timeoutMs) {
        throw Object.assign(
          new Error(`Memory deadline exceeded: ${elapsed}ms > ${timeoutMs}ms`),
          { code: 'MEMORY_DEADLINE_EXCEEDED' },
        );
      }
    },
  });
}

export async function performWithinMemoryDeadline({
  page,
  performFormalAction,
  waitForRuntimeState,
  expectedMemoryCount,
  timeoutMs = 2_000,
  now = () => performance.now(),
}) {
  const deadline = createMemoryDeadline({ timeoutMs, now });
  await performFormalAction(); // 第一条语句执行正式 click；不得先等 running/resolved
  await waitForRuntimeState({ timeout: deadline.remaining() });
  await expect.poll(async () =>
    Number(await page.locator('[data-memory-count]').getAttribute('data-memory-count')), {
      timeout: deadline.remaining(),
      intervals: [25, 50, 100],
    }).toBe(expectedMemoryCount);
  deadline.assertWithin();
}

export async function startPocketPlayCartridge(page, key, expectedMemoryCount) {
  const frame = page.frameLocator('iframe[data-device-id="pocket-play"]');
  const control = frame.locator(`[data-cartridge-id="${key}"]`);
  await expect(control).toBeEnabled();
  return performWithinMemoryDeadline({
    page,
    expectedMemoryCount,
    performFormalAction: () => control.click(),
    waitForRuntimeState: ({ timeout }) => expect(frame.locator('body')).toHaveAttribute(
      'data-cartridge-state',
      'running',
      { timeout },
    ),
  });
}

export async function resolvePocketCareNeed(page, expectedMemoryCount) {
  const frame = page.frameLocator('iframe[data-device-id="pocket-care"]');
  const body = frame.locator('body');
  await expect(body).toHaveAttribute('data-active-need', CARE_NEED_PATTERN);
  const control = frame.getByRole('button', { name: 'Resolve current need' });
  await expect(control).toBeEnabled();
  return performWithinMemoryDeadline({
    page,
    expectedMemoryCount,
    performFormalAction: () => control.click(),
    waitForRuntimeState: ({ timeout }) => expect(body).toHaveAttribute(
      'data-care-state',
      'resolved',
      { timeout },
    ),
  });
}
```

两个 wrapper 在计时前只定位/验证正式控件；第一次 click、runtime completion 与 Memory Core 变化都封装在同一次 `performWithinMemoryDeadline`。两者不得返回后再由 spec 独立等待 memory，也不得内部先等待 `running/resolved`。`tests/unit/memory-deadline.test.js` 用注入的单调 fake clock 做精确边界：`1,999 ms` 与 `2,000 ms` 通过，`2,001 ms` 抛 `MEMORY_DEADLINE_EXCEEDED`；不得用真实 timer 断言毫秒边界。`tests/e2e/memory-deadline.spec.js` 的受控页面 fixture 使用有调度余量的 `1,200 ms` 成功与 `2,300 ms` 失败，证明整个 click→runtime→Memory 链接入同一预算，但不冒充精确边界测试；competition production specs 仍只测真实运行时。`verify-competition.mjs` 静态拒绝 `demo-*-memory`、直接设置 `data-memory-count`、独立 `waitForMemoryCount`，以及在 `performFormalAction` 前出现 runtime completion wait。

- [ ] 先扩展 `competition/source-package-members.json`，将 Pocket Care、WasmBoy、七个 WasmBoy bundled dependencies 与六个上游 ROM 的 tracked input 和最终 output 分别解析成逐 member `{ path, sha256, size, rightsEvidenceKey }` literal allowlist；JSON 中不得出现 `*`、`**` 或 prefix-only 规则，构建遇到一个新增/缺失 member 即失败：
  - Pocket Care child 源码部分只允许最终 `apps/dammagotchi` 的 `LICENSE`、`MODIFICATIONS.md`、`README.md`、`jsconfig.json`、`package.json`、`package-lock.json`、`vite.config.js`，`src` 树内人工确认并逐路径列出的 `.js/.glsl/.css/.html` regular file，以及原创 `static/favicon/favicon.svg`、`static/favicon/site.webmanifest`。
  - 同一个 Pocket Care source artifact 还必须含阶段 02 冻结且 SHA 匹配 source catalog 的 `assets/museum/upstream/pocket-care-device.js` 与 `assets/museum/upstream/NOTICE.md`，新建并提交的唯一重建入口 `scripts/assets/rebuild-pocket-care.mjs`，以及该入口静态 import graph 的完整本地 closure：`scripts/assets/generate-pocket-care.mjs`、`sanitize-museum-glb.mjs`、`glb-metrics.mjs`、根 `package.json`、根 `package-lock.json`、根 `LICENSE` 和生成的 `BUILDING.md`。`rebuild-pocket-care.mjs` 不读取 `assets/museum/sources.json`，而是要求 CLI 显式传入 frozen input path/SHA、output path 与 approved output SHA；它只调用上述三项闭合模块完成 generate→sanitize→inspect，并在写出前后逐字节核验。`scripts/assets/process-museum-assets.mjs` 只在 `BUILDING.md`/`NOTICE` 中以仓库路径、提交与 SHA 作为原比赛流水线的 provenance reference，不进入 source artifact，也不是重建入口；因此无需携带它对 `asset-policy.js`、`fetch-museum-assets.mjs`、八模型 raw set、rights review 或 contact sheet 的依赖。包内 `NOTICE` 分别标明冻结 AGPL input、Pocket Care child 的 AGPL-3.0-only、GameX 加工脚本的 MIT 与每个文件的构建角色；明确拒绝另一个冻结的 Pocket Play GLB、contact sheet、其他七个模型、`.cache` 和任何未列媒体。
  - WasmBoy 只允许 fixed commit 的 `LICENSE`、`README.md`、`package.json`、`package-lock.json`、九个逐字列出的 rollup 文件、`core` 树内逐路径列出的 `.ts/.js/.json` regular file 和 `lib` 树内逐路径列出的 `.js` regular file。明确拒绝 `core/example-builds`、`demo`、`docs`、`test`、`build`、`dist`、`.travis.yml` 及任何 `.gb/.gbc/.png/.jpg/.gif/.wasm/.wat/.map`。
  - 六个 ROM output 都来自 Task 2 的 tracked safe input。`ucity/minesweep/wordyl/geometrix` 加完整 GPLv3 与逐文件 notices；Tobu/GB Corp 也产生最终 artifact/member manifests，不允许因为不是 GPL 就绕过安全扫描或锁。
- [ ] `build-corresponding-source.mjs --refresh-inputs` 是 WasmBoy 与其 third-party closure 的唯一联网路径。WasmBoy source 输入逐字固定为 `https://codeload.github.com/torch2424/wasmBoy/tar.gz/8e96bcb70969d943b1ffc4028b169c835098ce04`，下载 archive SHA-256 必须为 `4382504a57a9f1c91484d24058ee64f41fc8031a768786a709ad5db305370faf`，安全读取后的根 `LICENSE` SHA-256 必须为 `3972dc9744f6499f0f9b2dbf76696f2ae7ad8af9b23dde66d6af86c9dfb36986`；URL、commit、archive SHA 与 LICENSE SHA 全部进入 source-input lock，任一漂移都在过滤前失败。该模式还下载固定 npm tarball和七个 dependency source，先核对本计划所有 upstream/integrity/license SHA，再用安全 API 从 regular-file bytes 重写 `assets/legal/source-inputs/wasmboy/wasmboy-0.7.1.filtered.tar.gz` 与文件结构中逐字列出的七个 `third-party/*.filtered.tar.gz`。npm tarball只作 publisher/binary 证据，不提交、不进入 source output。
- [ ] 扩展后的 `source-input-lock.json` 必须恰好覆盖六个 ROM、WasmBoy 和七个 bundled dependency records；每个 record 均含 upstream/filtered artifact/member manifest/right-evidence hashes。`--refresh-inputs` 是人工维护命令，绝不由 `npm ci`、`--prepare`、`npm run build` 或 `build:competition` 调用；刷新后必须显式 `git add assets/legal/source-inputs assets/legal/source-input-lock.json competition/source-package-members.json` 并提交。
- [ ] 在进入任何 normal gate 前显式执行两遍联网维护；`--determinism-report` 只写到仓库外路径，报告按固定顺序列出 WasmBoy、七项 dependency filtered archive、notices、member manifests 与最终 source-input lock 的 SHA/size。第二遍必须重新下载到新的内部临时目录而不能复用第一遍响应，两个 report 逐字节相同后立即提交 tracked inputs：

```bash
refresh_run_dir="$(mktemp -d)"
node scripts/build-corresponding-source.mjs --refresh-inputs \
  --determinism-report "$refresh_run_dir/first.json"
node scripts/build-corresponding-source.mjs --refresh-inputs \
  --determinism-report "$refresh_run_dir/second.json"
cmp "$refresh_run_dir/first.json" "$refresh_run_dir/second.json"
git add scripts/build-corresponding-source.mjs scripts/assets/rebuild-pocket-care.mjs \
  assets/legal/source-inputs/wasmboy assets/legal/source-input-lock.json \
  assets/legal/wasmboy-third-party-notices.json competition/source-package-members.json
git commit -m "build(source): pin WasmBoy corresponding source inputs"
```

  此提交之后的 `--prepare`、child build、competition build、测试与验证全部禁网且绝不调用 `--refresh-inputs`；CI/评委机只消费已提交字节。
- [ ] `build-corresponding-source.mjs --prepare` 只读取 committed `source-input-lock.json` 与 tracked filtered archives，先用 `verifySafeSourceArchive` 复核输入，再从已验证 bytes 直接重写输出 ustar；绝不下载、解到工作树或接受 cache fallback。对本地 Pocket Care literal members 执行 `lstat`，只接受 regular file，要求 `realpath` 留在对应 root、拒绝 symlink/hardlink inode reuse，并核对 path/SHA/size。所有输出按 UTF-8 path 排序、mode `0644`、mtime/uid/gid=0、gzip mtime=0，两次生成逐字节相同：
  - `pocket-care-source.tar.gz`：上述完整 child 源码、冻结 AGPL input/NOTICE、`rebuild-pocket-care.mjs` 及其三文件本地 import closure、根 lock/license 和 `BUILDING.md`。BUILDING 固定 `npm ci --offline`（只允许预热的 lockfile cache）、`npm --prefix apps/dammagotchi ci --offline`、child build、冻结 input hash check，以及单一 `node scripts/assets/rebuild-pocket-care.mjs --input assets/museum/upstream/pocket-care-device.js --input-sha <catalog-sha> --output rebuilt/pocket-care.glb --approved-sha <approved-manifest-sha>`；不要求或提及取得另外七个 raw model、review receipt 或 contact sheet。
  - `wasmboy-0.7.1-source.tar.gz`：只重包 tracked WasmBoy filtered input、七个 filtered third-party source、第三方 notices 与构建说明；
  - `source/<key>/source.tar.gz` 六包：逐一从 tracked ROM input 重包；四个 GPL 包补全 GPLv3，Tobu/GB Corp 保留各自完整 license/notices。

  `--prepare` 只写临时 staging artifacts/member manifests，明确不得创建或改写 `assets/legal/corresponding-source-lock.json`；此时最终 child binary 与最终 model 尚不存在。网络 API 被禁用的单测必须仍通过。`tests/unit/source-archive-safety.test.js` 还要把刚生成的 Pocket Care 包解到全新临时目录，核对包内无未列 member，在预热 npm cache且 `fetch/http/https/net/dns` 被禁用的环境按 `BUILDING.md` 原样运行重建入口；输出字节必须与 `assets/museum/models/pocket-care.glb` 完全相同且 SHA 等于 approved manifest，否则门禁失败。
- [ ] 固定 WasmBoy publisher/binary 对应关系。只有显式 `--refresh-inputs` 下载 `https://registry.npmjs.org/wasmboy/-/wasmboy-0.7.1.tgz`，要求 SHA-256 `77fdf75c751801c956fd9ad3f7aea73cc151ab4ca18fb807f14028a4e81d3fe9`、npm SHA-1 `5bbf0f0f386f8e9ea322a611689b889f9c3495d2`、registry integrity `sha512-qgA3bIFAqioYs8kYXtsanIvedgZlZQf382zs3gNlZHIItsAnRzV70/Vp6cJxbK4FyaiG58ah8/g7OW3orrs9Lg==`、registry `gitHead=8e96bcb70969d943b1ffc4028b169c835098ce04`。安全读取 tar member `package/dist/wasmboy.wasm.esm.js`，要求 SHA-256 `3052a7864e47384639c19ce073a194595726ebde5fe677a949e99092ab9851d9`，并与 `apps/game-boy/src/vendor/wasmboy/wasmboy.esm.js` 逐字节相等；npm tarball 只作为刷新时的验证输入/lock 证据，不提交、不原样放进 `dist/source`，避免把 dist/source maps 与预编译 WASM 伪装成对应源码。
- [ ] 从 pinned WasmBoy `package-lock.json` 与实际 `lib/**` bare-import graph 计算 bundled runtime closure，预期必须恰好为：`audiobuffer-to-wav` commit `8878a20c5cc7e457b113dabfb1781ad4178f9c62` / MIT / codeload SHA-256 `1352bbe75d923f40771ab6e24f433056f558c03dac8c1ed71bcaaced62f639c8` / license `fb153e8eaf70c10aa169bc3d7401946a9d51163cafaca23458cea8e67de972f4`；`big-integer@1.6.48` / Unlicense / tar `7cd945ce23acb3e4be2081a7be7323b44648fb2b8613c465d12a5353594a4ab9` / license `e9b0e94f628e00b5ed98046cfa041696ff89eebbbdd54108ee350625bc6d0363`；`idb@2.1.3` / ISC / tar `3caf8aee8a546909331d4d514e63e2abeab2ad825892aef49b46968c7485377c` / license `873a2f333fda393ec3464f4579209b019d98e97c3bf498b10e85f630162fd708`；`raf@3.4.1` / MIT / tar `1e808c9494d51196e026d250b4bcecbe81ce91e7d9ace1b419ff14be5319802f` / license `6b2194e178545b3dcde4a40a09b5f6c00bd9b5b695db0c826c14995c6c9b4ec5`；`performance-now@2.1.0` / MIT / tar `068f99ddeff11741bd1ebbbe3ee4c6f782731bd9ae0a2d598536cce74e289045` / license `c3af1272f30870168177e888b184c1f802e5081e75a126c794670c0b562d3783`；`responsive-gamepad@1.1.0` / Apache-2.0 / tar `ad231e03be78d387c852338d8d47e83c36133a5a3d9400d4b19483cb7fceae6d` / license `c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4`；以及 modified `lib/3p/UZIP.js` SHA-256 `754192d0623b106574cdfb64cd837325ec7200abb8a978bd966724c3d8996331`，上游 `photopea/UZIP.js` commit `6a4bbf88ff787bb6d091b187ac29fbbf5674edf5` / MIT LICENSE `786adae9320db47cd483f9a8774ebd3edab8876d714caa4fb0aee8e5b2c3edc0`。任何 extra/missing package、resolved URL/integrity/hash 漂移都失败。
- [ ] `assets/legal/wasmboy-third-party-notices.json` 对上述七项固定 `name/version-or-commit/sourceUrl/artifactSha256/licenseSpdx/copyright/licenseTextSha256/bundledBy`，`additionalProperties: false`；只从 source-input lock 已绑定的 filtered license/package/source members 生成，逐字节复制到 `dist/legal/` 并在 Credits dialog 展开。每个 third-party source 以精确 member allowlist 重包进 WasmBoy source 的 `third_party/<name>/`，不收入其 test/demo/screenshot/media；notices 中每项必须对应至少一个实际 bundled import/member。
- [ ] 两个 child 的可见法律入口也是门禁，且唯一合法顺序固定为：`npm --prefix apps/game-boy ci` → Game Boy production build → `stageChildLegalFiles('game-boy')` 并逐字节核对其 LICENSE/MODIFICATIONS → `npm --prefix apps/dammagotchi ci` → Pocket Care production build → `stageChildLegalFiles('dammagotchi')` 并逐字节核对其 LICENSE/MODIFICATIONS。每个 stage 成功后对应 child dist 立即冻结；禁止先跑两个 `ci`、先跑两个 build、`npm install`、缺 lock fallback、复用未证明的旧 `node_modules`，或在 stage 后改写 child。两者都冻结后才可进入 finalizer；`prepare-apps.mjs` 只能原样复制已锁定 child dist 到根 `dist/game-boy` 与 `dist/dammagotchi` 对应的 public staging，不得再注入/改写。Pocket Play 的 nav 链接 MIT、WasmBoy source/notices 与当前 ROM source；Pocket Care 的 nav 链接 AGPL、Pocket Care source 与 dated modifications。Playwright 用 Tab/Enter 打开这些同源 URL 并断言 HTTP 200、无需登录/费用；四个 GPL ROM 也在 child 卡带详情和根 Credits 各有直接 Source/License 链接。
- [ ] 两个 child 完成上述顺序后才运行 `build-corresponding-source.mjs --finalize --game-boy-dist apps/game-boy/dist --pocket-care-dist apps/dammagotchi/dist --pocket-care-model assets/museum/models/pocket-care.glb --generated-rom-lock apps/game-boy/tools/generated-rom-lock.json`。Game Boy Vite 用 `manualChunks` 产出独立 WasmBoy chunk；finalizer 重算 source-input lock、所有 staging artifacts/member manifests、真实 WasmBoy output chunk、Pocket Care 完整 child dist canonical tree、阶段 02 approved Pocket Care GLB，以及 `homebrew-cartridges.json` 定义的八张最终 ROM path/SHA，而不是只处理六张上游 ROM。
- [ ] finalizer 原子写 `assets/legal/corresponding-source-lock.json`，顶层固定 `version/sourceInputLockSha256/generatedRomLockSha256/homebrewRoms/components` 且 `additionalProperties: false`。`homebrewRoms` 必须按 key 排序并**恰好**是 `tobu/ucity/minesweep/wordyl/geometrix/gbcorp/orbit-curator/neon-seed` 八项；每项固定 `key/distPath/finalBinarySha256/provenanceKind/sourceComponentId/generatedBuild`，其中 `distPath` 必须位于 `game-boy/roms/`，缺一、重复或 extra 都失败。六个上游项的 `generatedBuild` 必须为 null，并链接各自 source component/artifact/member manifest；两个原创项的 `sourceComponentId` 必须为 null，`generatedBuild` 必须逐字段复制并重新核对 `generated-rom-lock.json` 的 `sourceTreeSha256/buildLogSha256/toolchainSha256/assetSha256`（native/container 细节归一进 toolchain hash），同时把该 lock 文件整体 SHA 与最终 `game-boy/roms/{orbit-curator,neon-seed}.gb` binary SHA 绑定。每个 component 固定 `componentId/artifactPath/artifactSha256/memberManifestSha256/licenseSpdx/coveredBinaries/coveredTrees/thirdPartyNoticesSha256`；四个 GPL ROM、Tobu 与 GB Corp 各有 source artifact/member-manifest/final ROM binding，WasmBoy 绑定真实 `game-boy/assets/<vendor-chunk>`，Pocket Care 绑定完整 `dammagotchi` child tree 与 `museum/models/pocket-care.glb`。所有 covered path 使用将来根 `dist/` 相对路径；若尚不存在、任何 hash 变化、input/generated lock 有 stale/extra entry、八 ROM 集合不精确或 component 集合不精确就失败。
- [ ] finalizer 成功后才再次运行 `generate-credits.mjs --finalized`。generator 必须读取批准的八模型 manifest、八 ROM manifest/generated lock、`source-input-lock.json` 与刚写入的 `corresponding-source-lock.json`，原子重写 tracked `CREDITS.md` 和 `assets/legal/credits.json`；Credits 的 homebrew 集合必须与 final lock 的 exact-eight key/path/final SHA 一一相等，六个上游项展开 source artifact/member manifest，两个原创项展开 source-tree/build-log/toolchain/asset/final-binary SHA。任一 missing/extra、顺序漂移或字段空缺都拒绝。`prepare-apps.mjs` 清空并重建 root public staging 后，必须把 `stageFinalCredits()` 作为最后一个写操作，将两份最终字节复制到 `public/legal/{CREDITS.md,credits.json}` 并核对 SHA；`create-credits-dialog.js` 只渲染这份 finalized schema。禁止在 finalizer 前 stage 旧 Credits，也禁止 stage 后或根 Vite build 后再次改写。
- [ ] 创建聚合 `scripts/verify-competition.mjs`，按顺序运行 rights、homebrew、`node scripts/apply-pocket-play-prune.mjs --mode=verify-history --post-prune auto`、source-input lock、对应源码 safe-member/final lock/covered output、Pocket Care originals、阶段 02 asset manifest/frozen-input no-leak、Air assets、`verify-offline-build.mjs --mode=competition`、BGM、bundle budget 和所有现有 verify 脚本；`auto` 必须在 baseline 第一父链中找到唯一 post-prune scope transition 并打印其完整 OID，零个或多个 transition 都失败。它先从真实 `DEVICE_REGISTRY` 得到两个 LIVE URL，要求唯一映射为 `dist/game-boy/index.html` 与 `dist/dammagotchi/index.html` 并逐字节读取成功；再从最终 `dist/game-boy/roms` 枚举 `.gb/.gbc` regular files，要求 key/path 集合恰好八项，逐项重算 SHA 与 final lock。六项核对 source component，`orbit-curator`/`neon-seed` 另核对 generated lock 整体 SHA、source tree、canonical build log、toolchain、asset 与 final binary SHA。它还从最终 `dist/game-boy` 重算 WasmBoy chunk、从 `dist/dammagotchi` 重算 Pocket Care child tree，从 `dist/museum/models/pocket-care.glb` 重算 approved model SHA，再重算 `dist/source/` artifacts/member manifests、第三方 notices、child LICENSE/MODIFICATIONS/link targets，以及 `dist/legal/{CREDITS.md,credits.json}`。root dist、final lock、generated lock、registry runtime routes 与 finalized Credits 的 exact-eight 映射必须双向相等；missing/extra/stale 一律失败，不得只验证 source artifact 自身 hash。
- [ ] 在 `package.json` 增加：

```json
{
  "build:competition": "VITE_GAME_X_MODE=competition node scripts/build-all.mjs",
  "preview:competition": "vite preview --host 127.0.0.1 --port 4173 --strictPort",
  "test:e2e:memory-deadline": "playwright test --config=playwright.memory-deadline.config.js",
  "test:e2e:competition": "playwright test --config=playwright.competition.config.js",
  "verify:competition": "node scripts/verify-competition.mjs"
}
```

`scripts/build-all.mjs` 在 competition mode 的顺序是硬约束，并由 unit/static verifier 检查 spawn log：

1. 用 manifest 中 baseline 与 unique history transition 运行 `node scripts/apply-pocket-play-prune.mjs --mode=verify-history --post-prune auto`；`auto` 只接受 baseline 第一父链上唯一一个由非 post-prune scope 过渡到 `postPruneScopeTreeSha256` 的提交；
2. 校验 tracked `source-input-lock.json` 后运行 `node scripts/build-corresponding-source.mjs --prepare`；只产生 deterministic staging source，不写 final lock，也绝不调用 `--refresh-inputs`；
3. 执行 `npm --prefix apps/game-boy ci`，成功且 lockfile 未变后立即执行 Game Boy production build；
4. Game Boy build 成功后立即记录并执行 `stageChildLegalFiles('game-boy')`，核对法律文件并冻结其 dist；
5. 只有第 4 步成功才执行 `npm --prefix apps/dammagotchi ci`，随后立即执行 Pocket Care production build；
6. Pocket Care build 成功后立即记录并执行 `stageChildLegalFiles('dammagotchi')`，核对法律文件并冻结其 dist；
7. 两个 dist 都冻结后运行 `--finalize`，此刻绑定 WasmBoy chunk、Pocket Care tree/model 与 exact-eight ROM（含两张 generated lock 原创 ROM）并写 corresponding lock；
8. 立即运行 `generate-credits.mjs --finalized`，原子重写 tracked `CREDITS.md`/`assets/legal/credits.json`；任何 lock 漂移都必须使 Credits 重生成，而不是继续使用 Task 2 版本；
9. `scripts/prepare-apps.mjs` 清空并重建 root public staging，将两个已冻结 child dist 分别复制到 `public/game-boy`、`public/dammagotchi`，并将 source artifacts、source-input/final/generated locks、notices、exact-eight ROM 与八模型公开资产复制并逐字节复核，最后且只在最后调用 `stageFinalCredits()`；不得另建 `public/apps`，不得再向 child tree 添加文件，也不得复制 `assets/museum/upstream/`；
10. 最后运行根 Vite build；根构建只能复制这些已锁定 bytes，不得再触发 child/source rebuild、安装或 Credits 改写；
11. 从根 `dist/game-boy`、`dist/dammagotchi`、`dist/museum`、`dist/source` 与 `dist/legal` 重算 SHA、LIVE route 和 exact-eight 集合，证明与第 7–8 步 locks/Credits 完全相同，再运行 competition-mode verifier。

`scripts/build-all.mjs` 的 base 与 competition 分支都必须记录同一个 child exact ordered subsequence：`game-boy ci → game-boy build → stage game-boy legal → dammagotchi ci → dammagotchi build → stage dammagotchi legal`；competition 分支在其前后再记录上述 source/history/finalize/root 步骤。`tests/unit/build-all-order.test.js` 对 event/spawn log 做逐项相邻检查，专门拒绝“两次 ci 后才 build”、两个 build 后才 stage、`npm install`、缺少 ci、refresh-inputs、stage 后改 child 或 build 后安装。所有 `spawnSync` 都显式设置 `env: { ...process.env, VITE_GAME_X_MODE: process.env.VITE_GAME_X_MODE || '' }`，让根 Hub 和两个子 Vite build 接收同一模式；不得把值写入磁盘。根 `vite.config.js` 用 `loadEnv(mode, process.cwd(), '')` 读取该值；两个子配置在顶层定义 `const competition = process.env.VITE_GAME_X_MODE === 'competition'`，并把各自 `build.sourcemap` 改为 `!competition`。Game Boy 配置用稳定 `manualChunks` 单独输出 WasmBoy vendor chunk，供 finalizer 绑定。只有 competition-mode 离线验证要求根与两个 child 的 `.map === 0`；base mode 允许 sourcemap。品牌/作者例外只允许在已通过 rights schema/hash 的 `dist/legal/credits.json`、third-party notices 与两份 LICENSE/MODIFICATIONS 法律文本中，运行时 chunk 仍不得包含删除品牌内容。

根 `vite.config.js` 保留现有 plugin/server 配置，只把导出改成：

```js
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const competition = env.VITE_GAME_X_MODE === 'competition';
  return {
    base: './',
    optimizeDeps: { entries: ['index.html'] },
    server: {
      host: true,
      fs: { allow: ['.'] },
      headers: { 'Permissions-Policy': 'camera=(self)' },
    },
    preview: {
      headers: { 'Permissions-Policy': 'camera=(self)' },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      modulePreload: { polyfill: false },
      manifest: true,
      sourcemap: competition ? false : true,
    },
    define: {
      __GAME_X_COMPETITION__: JSON.stringify(competition),
    },
  };
});
```

这就是阶段 01–05 合并后的完整根配置；若执行时已有额外 plugin，只允许在 `return` 中增加 `plugins`，上述字段保持不变。

- [ ] 创建 `playwright.memory-deadline.config.js`，只运行受控页面 fixture 的 deadline E2E；它没有 `webServer`、不服务/访问 candidate `dist`，也绝不加入下面的 production-safe `testMatch`：

```js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['**/memory-deadline.spec.js'],
  forbidOnly: true,
  retries: 0,
  workers: 1,
  fullyParallel: false,
  use: {
    ...devices['Desktop Chrome'],
    trace: 'retain-on-failure',
  },
});
```

  `memory-deadline.spec.js` 只能用 `page.setContent()` 安装本地受控按钮/runtime-state/Memory fixture，执行既定 `1,200 ms` 通过与 `2,300 ms` 失败用例；static gate 拒绝该 config 的 `webServer/baseURL` 和 spec 的外部导航。最终门禁必须在 `build:competition` **之前**单独运行 `npm run test:e2e:memory-deadline`，避免受控 fixture 被误认为 production candidate 证据。

- [ ] 创建只服务候选 `dist/`、绝不触发 `prepare-apps` 或子应用重建的 `playwright.competition.config.js`：

```js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: [
    '**/competition-demo.spec.js',
    '**/offline.spec.js',
    '**/pocket-play-cartridges.spec.js',
    '**/air-control-production.spec.js',
  ],
  testIgnore: [
    '**/asset-review-page.spec.js',
    '**/air-control.spec.js',
  ],
  forbidOnly: true,
  retries: 0,
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'competition-chromium',
      use: {
        ...devices['Desktop Chrome'],
        permissions: ['camera'],
        launchOptions: {
          args: [
            '--use-fake-device-for-media-stream',
          ],
        },
      },
    },
  ],
  webServer: {
    command: 'npm run preview:competition',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
```

- [ ] 上述默认 project 是 allowed-camera production path：Playwright `permissions: ['camera']` 提供站点授权，Chromium 只用 `--use-fake-device-for-media-stream` 提供稳定本地视频；严禁 `--use-fake-ui-for-media-stream`，因为它会绕过真正的 permission state。denied path 必须在同一 production spec 内另建无预授权 context/page，并通过 Chromium CDP 对 preview origin 显式设为 denied：

```js
const previewOrigin = 'http://127.0.0.1:4173';
const deniedContext = await browser.newContext({ baseURL: previewOrigin });
const deniedPage = await deniedContext.newPage();
const cdp = await deniedContext.newCDPSession(deniedPage);
const { targetInfo } = await cdp.send('Target.getTargetInfo');
const browserContextId = targetInfo.browserContextId;
expect(typeof browserContextId).toBe('string');
expect(browserContextId.length).toBeGreaterThan(0);
await cdp.send('Browser.setPermission', {
  browserContextId,
  origin: previewOrigin,
  permission: { name: 'videoCapture' },
  setting: 'denied',
});
await deniedPage.goto('/');

try {
  // 只在这里执行 denied-camera production assertions。
} finally {
  await cdp.send('Browser.resetPermissions', { browserContextId });
  await cdp.detach();
  await deniedContext.close();
}
```

`Target.getTargetInfo` 返回的 `browserContextId` 必须非空，并且 `setPermission` 与 finally 中的 `resetPermissions` 必须使用同一个 ID；即使断言失败也先 reset 再关闭 context。不得以覆盖 `getUserMedia`、注入 fake camera factory、默认 browser context 或仅清空 permission list 代替显式 denied。

- [ ] `verify-competition.mjs` 解析 competition config，要求 `testMatch` 与上述四项集合逐字一致，显式证明 `memory-deadline.spec.js` 不在其中，且 test-only `asset-review-page.spec.js`、`air-control.spec.js` 同时在 `testIgnore`；另解析受控 config，要求它只匹配 memory-deadline 且没有 webServer/baseURL。扫描 `dist` 拒绝这些受控/test-only spec 使用的 asset-review route、mock model、synthetic memory、`__GAME_X_TEST__` 等符号。`test:e2e:competition` 不允许 CLI 追加宽泛目录覆盖 `testMatch`。
- [ ] 创建 `air-control-production.spec.js`，只操作 production `dist` 的可见 Air Control start/stop 控件：点击前记录 Network 并断言没有 tasks-vision/gesture worker/WASM；安装的唯一 route 是 abort 外网，禁止 fulfill/修改任何模型、WASM、视频帧或 gesture 结果。allowed path 点击 Start 后只允许同源加载真实 chunk/worker/model/WASM；初始化完成的稳定判据允许阶段 04 的两种真实结果之一：`data-state="tracking"` 配正式文字 `Hand tracking active`，或无可识别手时 `data-state="lost"` 配 `Hand not detected`。不得因 fake video 没有手而把 lost 当失败，也不得接受 requesting/error 作为初始化成功。无论 tracking/lost，点击 Stop 后都必须等待 `data-state="off"` 与 `Camera off`、摄像头 UI indicator 消失、`release-all` 后无 held state。
- [ ] 同一 spec 的 denied path 使用上一条带 `baseURL` 的独立 context+CDP explicit denied，先断言非空 `browserContextId`，点击正式 Enable 后等待 `data-state="error"` 与 `Camera unavailable`，断言没有 Worker/model/WASM request、仍可用鼠标返回 museum；finally 中必须对同一 ID `Browser.resetPermissions` 后再关闭 context。它仍不使用 test hook、不新增 `Ready/Off` 别名，也不复用 allowed page。
- [ ] 上述四个 production-safe specs 在此配置下执行。完整离线用例先安装外网阻断和 `request/pageerror/console.error` 监听，再依次等待 Pocket Play ready、调用 `startPocketPlayCartridge(page, 'ucity', 1)`，由 wrapper 从第一次正式 click 起在单一 2 秒 deadline 内等待 running 与第一条 Memory、退出；等待 Pocket Care ready、调用 `resolvePocketCareNeed(page, 2)`，由 wrapper 在单一 deadline 内等待 resolved 与第二条 Memory、退出；逐一选择六个 Coming Soon 并断言没有 iframe；最后断言请求全部同源且错误数组为空。它同时成为验收项 5、6、7、12 的候选版证据。

- [ ] 运行最终自动门禁：

```bash
npm ci
npm test
npm run test:e2e:memory-deadline
npm run build:competition
npm run test:e2e:competition
npm run verify:competition
```

预期：所有命令通过；受控 `memory-deadline` E2E 在 competition build 前单独完成且不属于 production config。`build:competition` 的受检 event/spawn log 必须唯一证明 `game-boy ci → build → stage legal → dammagotchi ci → build → stage legal → finalize`，不得因根 `npm ci` 或已有 `node_modules` 跳过 child `ci`。production Playwright 只服务已经生成的 competition `dist/`，不会在验证前后重建子应用；`verify:competition` 最后调用 offline competition mode，确认根和两个子应用 `.map === 0`、finalized Credits 与 locks/根 dist 的 exact-eight 映射相等、frozen upstream 未泄漏。`dist/` 无禁止公开词、外部运行时 URL、来源不明素材或生产测试钩子。

- [ ] 提交：

```bash
git add src/demo src/main.js src/styles.css tests/e2e/competition-demo.spec.js \
  tests/e2e/offline.spec.js tests/e2e/air-control-production.spec.js \
  tests/e2e/memory-deadline.spec.js tests/unit/memory-deadline.test.js \
  tests/unit/build-all-order.test.js \
  tests/unit/source-archive-safety.test.js tests/e2e/helpers/runtime-actions.js \
  playwright.memory-deadline.config.js playwright.competition.config.js \
  scripts/build-corresponding-source.mjs scripts/verify-competition.mjs \
  scripts/assets/rebuild-pocket-care.mjs scripts/apply-pocket-play-prune.mjs \
  scripts/generate-credits.mjs src/ui/create-credits-dialog.js CREDITS.md \
  scripts/lib/verify-safe-source-archive.mjs competition/source-package-members.json \
  scripts/build-all.mjs scripts/prepare-apps.mjs assets/legal/corresponding-source-lock.json \
  assets/legal/source-input-lock.json assets/legal/source-inputs/wasmboy \
  assets/legal/credits.json assets/legal/wasmboy-third-party-notices.json \
  apps/game-boy/MODIFICATIONS.md apps/dammagotchi/MODIFICATIONS.md \
  vite.config.js apps/game-boy/vite.config.js apps/dammagotchi/vite.config.js package.json
git commit -m "feat(demo): lock the 120 second competition story"
```

## 最终预览与人工验收

- [ ] 运行 `npm run preview:competition`，保留输出的 `http://127.0.0.1:4173/` 供用户预览；不得在此步骤重新 build。
- [ ] 桌面鼠标路径：拖满 360°，依次点击八图标，进入/退出两个运行时，确认第一次互动后 2 秒内核心变化。
- [ ] 390×844 触摸路径：横向滚动八图标，拖动环形展馆，不发生页面滚动或控件遮挡。
- [ ] 键盘路径：Tab、左右键、Enter、Escape 完成完整主流程；焦点始终可见。
- [ ] 减少动态与高对比路径：不出现大幅推进/惯性，文字与轮廓仍清晰。
- [ ] Air Control 允许、拒绝、停止、丢手、切换运行时五条路径；每次异常都释放 held 状态，关闭后摄像头指示灯熄灭。
- [ ] DevTools Network 设为 Offline 后刷新，除 Air Control 冷启动提示外，120 秒核心演示完整可用。
- [ ] DevTools Console 从刷新到演示结束没有未处理异常；Network 没有图像帧、关键点或第三方运行时请求。
- [ ] 按 120 秒真实计时演示两遍；两遍都在 115–120 秒回到全景和主张文字，再标记比赛候选版。
