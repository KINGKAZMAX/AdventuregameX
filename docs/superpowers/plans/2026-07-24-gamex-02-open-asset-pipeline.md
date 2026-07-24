# GameX 开放资产管线实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 为八个首发展位交付可离线、可复现、可核验的开放许可 GLB 资产管线，并让运行时在许可、哈希、体积或解析失败时安全保留玻璃替身。

**架构：** `sources.json` 固定来源事实与原始哈希，维护者显式执行下载、程序化生成和无纹理 Meshopt 加工；候选 GLB 先生成四视图 contact sheet，并由人工审查回执把输出哈希与“无 Logo、无产品文字、无第三方屏幕、几何已检查”绑定，之后才允许产出提交到仓库的 `manifest.json`、八个 GLB 与注册表权利记录。普通开发和比赛构建不访问网络。浏览器端 `AssetResolver` 在发起模型请求前先执行权利校验，随后核对响应体积与 SHA-256，再交给 `GLTFLoader`；任一展品失败只影响该展品，场景中原有玻璃替身始终保留。

**技术栈：** Node.js 24、Vite 6、Three.js 0.185.1、glTF Transform 4.4.1、Meshoptimizer 0.24.0、Vitest 4.1.10、Playwright 1.61.1、Web Crypto SHA-256、glTF 2.0 / GLB。

---

## 执行边界与前置条件

- 先完成 `docs/superpowers/plans/2026-07-24-gamex-01-museum-foundation.md`；本计划直接扩展其中的 `DEVICE_REGISTRY`、`MuseumScene` 和 `createMuseumApp`。
- 本计划只处理八个展馆外壳、来源许可、加工、加载和失败降级，不创建 FocusPortal、Memory Core 或 Air Control。
- 维护者命令 `npm run assets:refresh` 可以联网；`npm run dev`、`npm run build` 与 `npm run preview` 只能使用仓库内已发布资产。
- `public/` 与 `dist/` 仍是生成目录。源事实、两个固定上游输入和发布 GLB 放在 `assets/museum/`，下载缓存只放在 `/.cache/museum-assets/`。`assets/museum/upstream/` 永不复制到浏览器构建；它只保证阶段 03 修改 Pocket Care、阶段 05 删除 Pocket Play 旧 public 模型后，资产管线仍可从相同原始字节重建。
- CC BY 只证明模型作者授予的著作权许可；管线仍会删除纹理、动画、名称和品牌节点。`sources.json` 的八项记录必须永久保持 `trademarkRemoved: null`、`reviewStatus: "pending"`、`reviewedOn: null`，不得预先声称人工结论；只有输出哈希匹配且四项视觉检查全部通过的人工 `rights-review.json`，才能让发布器派生 `trademarkRemoved: true`、`reviewStatus: "approved"` 与真实 `reviewedOn`。

## 固定的 8/8 资产映射

| 展位 | 输入资产 | 权利依据 | 已核实原始 SHA-256 |
| --- | --- | --- | --- |
| Pocket Play | 从现有模型冻结的 `assets/museum/upstream/pocket-play-game-boy.glb`；原 public 副本后续可删除 | Andrii Babintsev，MIT，模型由上游作者从零制作 | `c5131750ac5527af6ff894074683563e25d65a7e60a7e4d98fc1755ce3fb680b` |
| Pocket Care | 从现有程序化几何冻结的 `assets/museum/upstream/pocket-care-device.js`；阶段 03 不再改变此输入 | Francesco Dammacco，AGPL-3.0-only | `5ddf051d24fca41b46b510d8878c76b969afc9dbb6b3c5266f766a7b00dfb52f` |
| Retro Learning Computer | [Keyboard / Poly by Google](https://poly.pizza/m/3oFfQCSsUmQ) | CC BY 3.0 | `ea47924f14af012329aeb68a3c3648bf5e59669a0528ad375cf301b459abc66c` |
| Cartridge Home Console | [Videogame / Poly by Google](https://poly.pizza/m/7jHiQIMZkRs) | CC BY 3.0 | `507f5516871a63cfca4a90c00f9deb36f1449a7d412f9fa407ec628e0a83f411` |
| Wide Handheld | [Retro Handheld / Michael Fuchs](https://poly.pizza/m/2nwiJ7W4kkz) | CC BY 3.0 | `8fb9b55bacb9d4fc82e80c2e657b8ad556d5351bc640f05d8389c4e52e9a101a` |
| Dual LCD Pocket | [Handheld videogame console / Poly by Google](https://poly.pizza/m/5kxD7n4F3lv) | CC BY 3.0 | `d71f8bc3d42f14d649739dbf70d01e7bc8ea5e1075883e80523862504e191d46` |
| Block Matrix Handheld | [Handheld game console / Poly by Google](https://poly.pizza/m/fw194G1mJA9) | CC BY 3.0 | `09037dde8141c744108ecaf25181f47fd3c7d88ad6dec64a0d92aca146b2e8ca` |
| Arcade Terminal | [Arcade Machine / J-Toastie](https://poly.pizza/m/GLDkMhiynM) | CC BY 3.0 | `9ccd74162ba5a6d996ba09198f49e8c784d76f2db7b020c1567b8b6311ec5c7c` |

六个远程输入当前合计 `1,113,532` bytes；Pocket Play 输入为 `355,628` bytes。发布管线仍以加工后的实际数字执行 4 MiB 总门禁，不能把这组调研数字当成验收结果。

## 文件结构

### 修改

- `.gitignore`：忽略可重新生成的下载缓存。
- `package.json`、`package-lock.json`：锁定 glTF Transform 与 Meshoptimizer，增加资产刷新、校验脚本。
- `src/museum/device-registry.js`：合并生成的八项权利与模型记录。
- `src/museum/registry-validator.js`：正式模型必须通过 fail-closed 权利字段校验。
- `src/museum/create-museum-scene.js`：为每个展位保留玻璃替身槽位并支持真实模型淡入。
- `src/museum/create-museum-app.js`：首屏立即启动，随后并行水合八项资产并公开可访问状态。
- `src/main.js`：为 `?asset-review=1` 提供真实、可执行且与普通展馆互斥的审查入口。
- `scripts/prepare-apps.mjs`：把已发布博物馆资产复制到生成的 `public/museum/`。

### 创建

- `assets/museum/sources.json`：八个输入的作者、来源、许可、直链、原始哈希、改作与审查事实。
- `assets/museum/upstream/pocket-play-game-boy.glb`：Pocket Play 的固定 MIT 原始输入；只供离线加工，不进入 `public/` 或 `dist/`。
- `assets/museum/upstream/pocket-care-device.js`：Pocket Care 的固定 AGPL 程序化输入；只供离线生成，不随子应用源码变化。
- `assets/museum/upstream/NOTICE.md`：上述两项的上游、许可、原路径、固定 SHA 与“不发布原始输入”边界。
- `assets/museum/manifest.json`：加工脚本生成并提交的发布清单。
- `assets/museum/review/contact-sheet.png`：八项候选模型的前、左、后、右四视图审查图。
- `assets/museum/review/rights-review.json`：与候选输出 SHA-256 绑定的人工审查回执。
- `assets/museum/models/pocket-play.glb`
- `assets/museum/models/pocket-care.glb`
- `assets/museum/models/learning-computer.glb`
- `assets/museum/models/home-console.glb`
- `assets/museum/models/wide-handheld.glb`
- `assets/museum/models/dual-lcd-pocket.glb`
- `assets/museum/models/block-handheld.glb`
- `assets/museum/models/arcade-terminal.glb`
- `src/museum/generated-asset-records.js`：加工脚本生成并提交、供注册表静态导入的权利字段。
- `src/museum/asset-policy.js`：来源与发布记录的 fail-closed 纯校验。
- `src/museum/asset-resolver.js`：浏览器端权利、响应、体积、哈希和解析门禁。
- `src/museum/create-glb-parser.js`：配置 Meshopt 的 `GLTFLoader` 与运行时尺度标准化。
- `src/museum/hydrate-museum-assets.js`：八项独立水合，不让单项失败中断其余展位。
- `src/museum/asset-review-page.js`：只在 `?asset-review=1` 显示 8×4 固定视角审查网格。
- `src/museum/create-coming-soon-overlay.js`：六个原创屏幕与控制件叠层。
- `src/museum/coming-soon-motion.js`：可测试、可减少动态的六类微交互采样。
- `scripts/assets/fetch-museum-assets.mjs`：下载或复制输入并验证原始哈希。
- `scripts/assets/generate-pocket-care.mjs`：从已核验 AGPL 程序化源生成无品牌 GLB 和来源回执。
- `scripts/assets/glb-metrics.mjs`：不解码几何即可读取 GLB 结构、三角形和纹理计数。
- `scripts/assets/sanitize-museum-glb.mjs`：删除纹理、动画、品牌名称并做 Meshopt 加工。
- `scripts/assets/process-museum-assets.mjs`：生成八个发布 GLB、manifest 和注册表记录。
- `scripts/assets/render-contact-sheet.mjs`：启动本地审查页并输出确定尺寸 contact sheet。
- `scripts/assets/generate-museum-review-fixture.mjs`：确定性生成无品牌、无文字、无纹理的审查页 GLB fixture。
- `scripts/verify-museum-assets.mjs`：验证 8/8、许可、文件哈希、单项与 4 MiB 总预算。
- `scripts/lib/copy-museum-assets.mjs`：只复制已发布资产到构建目录。
- `tests/unit/asset-policy.test.js`
- `tests/unit/fetch-museum-assets.test.js`
- `tests/unit/generate-pocket-care.test.js`
- `tests/unit/sanitize-museum-glb.test.js`
- `tests/unit/museum-review-fixture.test.js`
- `tests/unit/process-museum-assets.test.js`
- `tests/unit/asset-rights-review.test.js`
- `tests/unit/verify-museum-assets.test.js`
- `tests/unit/asset-resolver.test.js`
- `tests/unit/hydrate-museum-assets.test.js`
- `tests/unit/coming-soon-motion.test.js`
- `tests/unit/copy-museum-assets.test.js`
- `tests/e2e/asset-review-page.spec.js`
- `tests/e2e/museum-assets.spec.js`
- `tests/fixtures/museum-review.glb`：提交到仓库的稳定中性 GLB；测试不依赖阶段 05 的发布模型。

## 任务 1：锁定八项来源事实并建立 fail-closed 权利策略

**文件：**

- 创建：`assets/museum/sources.json`
- 创建：`assets/museum/upstream/pocket-play-game-boy.glb`
- 创建：`assets/museum/upstream/pocket-care-device.js`
- 创建：`assets/museum/upstream/NOTICE.md`
- 创建：`src/museum/asset-policy.js`
- 创建：`tests/unit/asset-policy.test.js`

- [ ] **步骤 1：编写失败的权利策略测试**

创建 `tests/unit/asset-policy.test.js`：

```js
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  validatePublishedAsset,
  validateSourceCatalog,
} from '../../src/museum/asset-policy.js';

const catalog = JSON.parse(readFileSync(
  new URL('../../assets/museum/sources.json', import.meta.url),
  'utf8',
));

describe('museum asset policy', () => {
  it('accepts the fixed eight-source catalog', () => {
    expect(validateSourceCatalog(catalog)).toEqual([]);
    expect(catalog.assets.map((asset) => asset.deviceId)).toEqual([
      'pocket-play',
      'pocket-care',
      'learning-computer',
      'home-console',
      'wide-handheld',
      'dual-lcd-pocket',
      'block-handheld',
      'arcade-terminal',
    ]);
    expect(catalog.assets.every((asset) =>
      asset.trademarkRemoved === null
      && asset.reviewStatus === 'pending'
      && asset.reviewedOn === null)).toBe(true);
    expect(catalog.assets[0].input.path).toBe(
      'assets/museum/upstream/pocket-play-game-boy.glb',
    );
    expect(catalog.assets[1].input.sourcePath).toBe(
      'assets/museum/upstream/pocket-care-device.js',
    );
    expect(JSON.stringify(catalog)).not.toMatch(
      /apps\/(?:game-boy|dammagotchi)\/(?:public|src)\//,
    );
  });

  it('rejects self-approved claims in the source catalog', () => {
    const invalid = structuredClone(catalog);
    invalid.assets[0].trademarkRemoved = true;
    invalid.assets[0].reviewStatus = 'approved';
    invalid.assets[0].reviewedOn = '2026-07-24';
    expect(validateSourceCatalog(invalid)).toEqual(expect.arrayContaining([
      'pocket-play: source trademarkRemoved must be null',
      'pocket-play: source reviewStatus must be pending',
      'pocket-play: source reviewedOn must be null',
    ]));
  });

  it('fails closed when published rights are incomplete', () => {
    const invalid = {
      assetId: 'x',
      deviceId: 'x',
      title: 'X',
      creator: 'Author',
      sourceUrl: 'https://example.test/model',
      license: 'CC BY 3.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
      downloadedAt: '2026-07-24',
      originalSha256: 'a'.repeat(64),
      modifications: ['Removed source textures'],
      outputFile: 'models/x.glb',
      outputSha256: 'b'.repeat(64),
      byteLength: 100,
      triangleCount: 10,
      maxBytes: 200,
      maxTriangles: 100,
      trademarkRemoved: false,
      reviewStatus: 'approved',
      reviewedOn: '2026-07-24',
      presentation: { maxSpan: 2, yawDegrees: 0, lift: 0 },
    };

    expect(validatePublishedAsset(invalid)).toContain(
      'x: trademarkRemoved must be true',
    );
    invalid.trademarkRemoved = true;
    invalid.reviewStatus = 'pending';
    expect(validatePublishedAsset(invalid)).toContain(
      'x: reviewStatus must be approved',
    );
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：`npm test -- tests/unit/asset-policy.test.js`

预期：FAIL，错误包含 `Failed to resolve import "../../src/museum/asset-policy.js"`。

- [ ] **步骤 3：先冻结两个不会被后续阶段删除或改写的原始输入**

运行：

```bash
mkdir -p assets/museum/upstream
cp apps/game-boy/public/models/game-boy.glb \
  assets/museum/upstream/pocket-play-game-boy.glb
cp apps/dammagotchi/src/experience/device/device.js \
  assets/museum/upstream/pocket-care-device.js
printf '%s  %s\n' \
  'c5131750ac5527af6ff894074683563e25d65a7e60a7e4d98fc1755ce3fb680b' \
  'assets/museum/upstream/pocket-play-game-boy.glb' \
  | shasum -a 256 -c -
printf '%s  %s\n' \
  '5ddf051d24fca41b46b510d8878c76b969afc9dbb6b3c5266f766a7b00dfb52f' \
  'assets/museum/upstream/pocket-care-device.js' \
  | shasum -a 256 -c -
```

预期：两个校验都输出 `OK`。创建 `NOTICE.md`，逐项记录上游 URL、作者、MIT/AGPL-3.0-only、原仓库路径、上述 SHA，以及“只作为加工输入，不得由 `copyMuseumAssets` 复制到浏览器构建”。禁止使用 symlink；提交的是实际固定字节。

- [ ] **步骤 4：写入固定来源清单与最小权利校验**

创建 `assets/museum/sources.json`：

```json
{
  "schemaVersion": 1,
  "downloadedAt": "2026-07-24",
  "assets": [
    {
      "assetId": "pocket-play-shell",
      "deviceId": "pocket-play",
      "title": "Interactive Game Boy model",
      "creator": "Andrii Babintsev",
      "sourceUrl": "https://github.com/Snokke/game-boy-challenge",
      "license": "MIT",
      "licenseUrl": "https://opensource.org/license/mit",
      "input": {
        "kind": "local",
        "path": "assets/museum/upstream/pocket-play-game-boy.glb",
        "sha256": "c5131750ac5527af6ff894074683563e25d65a7e60a7e4d98fc1755ce3fb680b"
      },
      "modifications": [
        "Removed all source textures, animations, metadata names and screen imagery",
        "Applied a neutral pearl-and-lime material palette",
        "Presented under the generic Pocket Play exhibit name"
      ],
      "presentation": { "maxSpan": 2.15, "yawDegrees": 180, "lift": 0 },
      "maxBytes": 786432,
      "maxTriangles": 25000,
      "trademarkRemoved": null,
      "reviewStatus": "pending",
      "reviewedOn": null
    },
    {
      "assetId": "pocket-care-shell",
      "deviceId": "pocket-care",
      "title": "Dammagotchi procedural device shell",
      "creator": "Francesco Dammacco",
      "sourceUrl": "https://github.com/dammafra/dammagotchi",
      "license": "AGPL-3.0-only",
      "licenseUrl": "https://www.gnu.org/licenses/agpl-3.0.html",
      "input": {
        "kind": "generated",
        "sourcePath": "assets/museum/upstream/pocket-care-device.js",
        "sha256": "5ddf051d24fca41b46b510d8878c76b969afc9dbb6b3c5266f766a7b00dfb52f"
      },
      "modifications": [
        "Re-authored a low-poly egg shell from the open procedural geometry approach",
        "Excluded upstream sprites, characters, logos and screen content",
        "Used three generic unlabeled controls and an original color system"
      ],
      "presentation": { "maxSpan": 1.85, "yawDegrees": 180, "lift": 0 },
      "maxBytes": 262144,
      "maxTriangles": 25000,
      "trademarkRemoved": null,
      "reviewStatus": "pending",
      "reviewedOn": null
    },
    {
      "assetId": "learning-keyboard",
      "deviceId": "learning-computer",
      "title": "Keyboard",
      "creator": "Poly by Google",
      "sourceUrl": "https://poly.pizza/m/3oFfQCSsUmQ",
      "license": "CC BY 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/3.0/",
      "input": {
        "kind": "remote",
        "url": "https://static.poly.pizza/8dc7a33e-9ed8-4e01-a7a1-b3717ac35c51.glb",
        "sha256": "ea47924f14af012329aeb68a3c3648bf5e59669a0528ad375cf301b459abc66c"
      },
      "modifications": [
        "Removed source textures, animation, labels and metadata names",
        "Recolored as an unbranded keyboard-computer base",
        "Combined visually with the original GameX learning-card silhouette"
      ],
      "presentation": { "maxSpan": 2.35, "yawDegrees": 180, "lift": 0 },
      "maxBytes": 393216,
      "maxTriangles": 25000,
      "trademarkRemoved": null,
      "reviewStatus": "pending",
      "reviewedOn": null
    },
    {
      "assetId": "cartridge-console-shell",
      "deviceId": "home-console",
      "title": "Videogame",
      "creator": "Poly by Google",
      "sourceUrl": "https://poly.pizza/m/7jHiQIMZkRs",
      "license": "CC BY 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/3.0/",
      "input": {
        "kind": "remote",
        "url": "https://static.poly.pizza/4dc4bf08-d3fa-4c89-8638-9bc86ac3a2c3.glb",
        "sha256": "507f5516871a63cfca4a90c00f9deb36f1449a7d412f9fa407ec628e0a83f411"
      },
      "modifications": [
        "Removed source textures, animation, labels and metadata names",
        "Applied an unbranded cartridge-console material system",
        "Replaced all screen and logo expression with solid museum colors"
      ],
      "presentation": { "maxSpan": 2.25, "yawDegrees": 180, "lift": 0 },
      "maxBytes": 786432,
      "maxTriangles": 25000,
      "trademarkRemoved": null,
      "reviewStatus": "pending",
      "reviewedOn": null
    },
    {
      "assetId": "wide-handheld-shell",
      "deviceId": "wide-handheld",
      "title": "Retro Handheld",
      "creator": "Michael Fuchs",
      "sourceUrl": "https://poly.pizza/m/2nwiJ7W4kkz",
      "license": "CC BY 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/3.0/",
      "input": {
        "kind": "remote",
        "url": "https://static.poly.pizza/323dac9a-876f-4228-9f18-9963c72fec14.glb",
        "sha256": "8fb9b55bacb9d4fc82e80c2e657b8ad556d5351bc640f05d8389c4e52e9a101a"
      },
      "modifications": [
        "Removed source textures, animation, labels and metadata names",
        "Applied original cyan-and-pearl materials",
        "Replaced screen expression with a solid neutral surface"
      ],
      "presentation": { "maxSpan": 2.25, "yawDegrees": 180, "lift": 0 },
      "maxBytes": 393216,
      "maxTriangles": 25000,
      "trademarkRemoved": null,
      "reviewStatus": "pending",
      "reviewedOn": null
    },
    {
      "assetId": "dual-lcd-shell",
      "deviceId": "dual-lcd-pocket",
      "title": "Handheld videogame console",
      "creator": "Poly by Google",
      "sourceUrl": "https://poly.pizza/m/5kxD7n4F3lv",
      "license": "CC BY 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/3.0/",
      "input": {
        "kind": "remote",
        "url": "https://static.poly.pizza/fe464a15-02e0-4bec-b5ff-dc4353f3d8d3.glb",
        "sha256": "d71f8bc3d42f14d649739dbf70d01e7bc8ea5e1075883e80523862504e191d46"
      },
      "modifications": [
        "Removed source textures, animation, labels and metadata names",
        "Applied a generic dual-display palette",
        "Removed all authored screen imagery"
      ],
      "presentation": { "maxSpan": 2.05, "yawDegrees": 180, "lift": 0 },
      "maxBytes": 262144,
      "maxTriangles": 25000,
      "trademarkRemoved": null,
      "reviewStatus": "pending",
      "reviewedOn": null
    },
    {
      "assetId": "block-matrix-shell",
      "deviceId": "block-handheld",
      "title": "Handheld game console",
      "creator": "Poly by Google",
      "sourceUrl": "https://poly.pizza/m/fw194G1mJA9",
      "license": "CC BY 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/3.0/",
      "input": {
        "kind": "remote",
        "url": "https://static.poly.pizza/9d670a21-5e87-4b1e-b324-68c5735528c9.glb",
        "sha256": "09037dde8141c744108ecaf25181f47fd3c7d88ad6dec64a0d92aca146b2e8ca"
      },
      "modifications": [
        "Removed source textures, animation, labels and metadata names",
        "Rotated into an original vertical block-matrix presentation",
        "Replaced screen expression with GameX procedural matrix graphics"
      ],
      "presentation": { "maxSpan": 2.2, "yawDegrees": 90, "lift": 0 },
      "maxBytes": 393216,
      "maxTriangles": 25000,
      "trademarkRemoved": null,
      "reviewStatus": "pending",
      "reviewedOn": null
    },
    {
      "assetId": "arcade-terminal-shell",
      "deviceId": "arcade-terminal",
      "title": "Arcade Machine",
      "creator": "J-Toastie",
      "sourceUrl": "https://poly.pizza/m/GLDkMhiynM",
      "license": "CC BY 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/3.0/",
      "input": {
        "kind": "remote",
        "url": "https://static.poly.pizza/e45e15cd-7b22-4b5d-ba19-e29fe9d5811a.glb",
        "sha256": "9ccd74162ba5a6d996ba09198f49e8c784d76f2db7b020c1567b8b6311ec5c7c"
      },
      "modifications": [
        "Removed source textures, animation, labels and metadata names",
        "Applied an original violet-and-pearl cabinet palette",
        "Reserved the screen for an original GameX CanvasTexture"
      ],
      "presentation": { "maxSpan": 2.55, "yawDegrees": 180, "lift": 0 },
      "maxBytes": 393216,
      "maxTriangles": 25000,
      "trademarkRemoved": null,
      "reviewStatus": "pending",
      "reviewedOn": null
    }
  ]
}
```

创建 `src/museum/asset-policy.js`：

```js
const SHA256 = /^[a-f0-9]{64}$/;
const ALLOWED_LICENSES = new Set(['MIT', 'AGPL-3.0-only', 'CC BY 3.0']);
const INPUT_KINDS = new Set(['local', 'remote', 'generated']);
const REQUIRED_PUBLISHED_STRINGS = [
  'assetId',
  'deviceId',
  'title',
  'creator',
  'sourceUrl',
  'license',
  'licenseUrl',
  'downloadedAt',
  'originalSha256',
  'outputFile',
  'modelUrl',
  'outputSha256',
  'reviewedOn',
];

const isUrl = (value) => {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

export function validateSourceCatalog(catalog) {
  const errors = [];
  if (catalog?.schemaVersion !== 1) errors.push('catalog: schemaVersion must be 1');
  if (!Array.isArray(catalog?.assets) || catalog.assets.length !== 8) {
    return [...errors, 'catalog: assets must contain exactly 8 records'];
  }

  const assetIds = new Set();
  const deviceIds = new Set();
  for (const asset of catalog.assets) {
    const prefix = asset.deviceId || asset.assetId || 'unknown';
    if (!asset.assetId || assetIds.has(asset.assetId)) {
      errors.push(`${prefix}: assetId must be unique`);
    }
    if (!asset.deviceId || deviceIds.has(asset.deviceId)) {
      errors.push(`${prefix}: deviceId must be unique`);
    }
    if (!asset.creator) errors.push(`${prefix}: creator is required`);
    if (!isUrl(asset.sourceUrl)) errors.push(`${prefix}: sourceUrl must be https`);
    if (!ALLOWED_LICENSES.has(asset.license)) {
      errors.push(`${prefix}: license is not allowlisted`);
    }
    if (!isUrl(asset.licenseUrl)) errors.push(`${prefix}: licenseUrl must be https`);
    if (!INPUT_KINDS.has(asset.input?.kind)) errors.push(`${prefix}: invalid input kind`);
    if (!SHA256.test(asset.input?.sha256 || '')) {
      errors.push(`${prefix}: input sha256 must be 64 lowercase hex characters`);
    }
    if (asset.input?.kind === 'remote' && !isUrl(asset.input.url)) {
      errors.push(`${prefix}: remote input requires an https url`);
    }
    if (asset.input?.kind === 'local' && !asset.input.path) {
      errors.push(`${prefix}: local input requires path`);
    }
    if (asset.input?.kind === 'generated' && !asset.input.sourcePath) {
      errors.push(`${prefix}: generated input requires sourcePath`);
    }
    if (!Array.isArray(asset.modifications) || asset.modifications.length === 0) {
      errors.push(`${prefix}: modifications must be non-empty`);
    }
    if (asset.trademarkRemoved !== null) {
      errors.push(`${prefix}: source trademarkRemoved must be null`);
    }
    if (asset.reviewStatus !== 'pending') {
      errors.push(`${prefix}: source reviewStatus must be pending`);
    }
    if (asset.reviewedOn !== null) {
      errors.push(`${prefix}: source reviewedOn must be null`);
    }
    if (!Number.isInteger(asset.maxBytes) || asset.maxBytes <= 0) {
      errors.push(`${prefix}: maxBytes must be a positive integer`);
    }
    if (!Number.isInteger(asset.maxTriangles) || asset.maxTriangles <= 0) {
      errors.push(`${prefix}: maxTriangles must be a positive integer`);
    }
    assetIds.add(asset.assetId);
    deviceIds.add(asset.deviceId);
  }
  return errors;
}

export function validatePublishedAsset(asset) {
  const prefix = asset?.deviceId || asset?.assetId || 'unknown';
  const errors = [];
  for (const key of REQUIRED_PUBLISHED_STRINGS) {
    if (typeof asset?.[key] !== 'string' || asset[key].length === 0) {
      errors.push(`${prefix}: ${key} is required`);
    }
  }
  if (!ALLOWED_LICENSES.has(asset?.license)) {
    errors.push(`${prefix}: license is not allowlisted`);
  }
  if (!isUrl(asset?.sourceUrl)) errors.push(`${prefix}: sourceUrl must be https`);
  if (!isUrl(asset?.licenseUrl)) errors.push(`${prefix}: licenseUrl must be https`);
  if (!SHA256.test(asset?.originalSha256 || '')) {
    errors.push(`${prefix}: originalSha256 must be 64 lowercase hex characters`);
  }
  if (!SHA256.test(asset?.outputSha256 || '')) {
    errors.push(`${prefix}: outputSha256 must be 64 lowercase hex characters`);
  }
  if (!/^models\/[a-z0-9-]+\.glb$/.test(asset?.outputFile || '')) {
    errors.push(`${prefix}: outputFile must be a models/*.glb path`);
  }
  if (asset?.modelUrl !== `./museum/${asset?.outputFile}`) {
    errors.push(`${prefix}: modelUrl must match outputFile`);
  }
  if (!Array.isArray(asset?.modifications) || asset.modifications.length === 0) {
    errors.push(`${prefix}: modifications must be non-empty`);
  }
  if (asset?.trademarkRemoved !== true) {
    errors.push(`${prefix}: trademarkRemoved must be true`);
  }
  if (asset?.reviewStatus !== 'approved') {
    errors.push(`${prefix}: reviewStatus must be approved`);
  }
  if (!Array.isArray(asset?.reviewNotes)
    || asset.reviewNotes.length === 0
    || asset.reviewNotes.some((note) =>
      typeof note !== 'string' || note.trim().length === 0 || note !== note.trim())) {
    errors.push(`${prefix}: reviewNotes must contain trimmed non-empty strings`);
  }
  const reviewedDate = new Date(`${asset?.reviewedOn}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asset?.reviewedOn || '')
    || Number.isNaN(reviewedDate.valueOf())
    || reviewedDate.toISOString().slice(0, 10) !== asset.reviewedOn) {
    errors.push(`${prefix}: reviewedOn must be a real ISO date`);
  }
  for (const key of ['byteLength', 'triangleCount', 'maxBytes', 'maxTriangles']) {
    if (!Number.isInteger(asset?.[key]) || asset[key] <= 0) {
      errors.push(`${prefix}: ${key} must be a positive integer`);
    }
  }
  const p = asset?.presentation;
  if (!p || !Number.isFinite(p.maxSpan) || !Number.isFinite(p.yawDegrees)
    || !Number.isFinite(p.lift)) {
    errors.push(`${prefix}: presentation must contain finite maxSpan, yawDegrees and lift`);
  }
  return errors;
}

export function validatePublishedManifest(manifest) {
  if (manifest?.schemaVersion !== 1) return ['manifest: schemaVersion must be 1'];
  if (!Array.isArray(manifest?.assets) || manifest.assets.length !== 8) {
    return ['manifest: assets must contain exactly 8 records'];
  }
  const errors = manifest.assets.flatMap(validatePublishedAsset);
  if (new Set(manifest.assets.map((asset) => asset.deviceId)).size !== 8) {
    errors.push('manifest: deviceId must be unique');
  }
  if (new Set(manifest.assets.map((asset) => asset.assetId)).size !== 8) {
    errors.push('manifest: assetId must be unique');
  }
  return errors;
}
```

- [ ] **步骤 5：运行测试验证通过**

运行：`npm test -- tests/unit/asset-policy.test.js`

预期：PASS，输出 `3 passed`；八项来源记录仍全部为 pending/null，只有 `validatePublishedAsset` 接受由回执派生的 approved 记录。

- [ ] **步骤 6：提交来源事实与权利策略**

```bash
git add assets/museum/sources.json assets/museum/upstream \
  src/museum/asset-policy.js tests/unit/asset-policy.test.js
git commit -m "feat(assets): lock open model sources and rights policy"
```

## 任务 2：实现可重复下载、复制与原始哈希验证

**文件：**

- 修改：`.gitignore`
- 修改：`package.json`
- 修改：`package-lock.json`
- 创建：`scripts/assets/fetch-museum-assets.mjs`
- 创建：`tests/unit/fetch-museum-assets.test.js`

- [ ] **步骤 1：编写失败的下载器测试**

创建 `tests/unit/fetch-museum-assets.test.js`：

```js
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { fetchMuseumAssetInputs } from '../../scripts/assets/fetch-museum-assets.mjs';

const tempRoots = [];
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map(
    (root) => rm(root, { recursive: true, force: true }),
  ));
});

it('copies local input, downloads remote input and rejects changed bytes', async () => {
  const root = await mkdtemp(join(tmpdir(), 'gamex-asset-fetch-'));
  tempRoots.push(root);
  const cacheRoot = join(root, 'cache');
  const localBytes = Buffer.from('local-glb');
  const remoteBytes = Buffer.from('remote-glb');
  await writeFile(join(root, 'local.glb'), localBytes);

  const catalog = {
    assets: [
      {
        deviceId: 'local-device',
        input: { kind: 'local', path: 'local.glb', sha256: sha256(localBytes) },
      },
      {
        deviceId: 'remote-device',
        input: {
          kind: 'remote',
          url: 'https://assets.test/remote.glb',
          sha256: sha256(remoteBytes),
        },
      },
      {
        deviceId: 'generated-device',
        input: { kind: 'generated', sourcePath: 'source.js', sha256: 'a'.repeat(64) },
      },
    ],
  };
  const fetchImpl = vi.fn(async () => new Response(remoteBytes, { status: 200 }));

  const result = await fetchMuseumAssetInputs({
    catalog,
    projectRoot: root,
    cacheRoot,
    fetchImpl,
  });

  expect(result).toEqual([
    { deviceId: 'local-device', state: 'verified' },
    { deviceId: 'remote-device', state: 'verified' },
    { deviceId: 'generated-device', state: 'generated-input' },
  ]);
  expect(await readFile(join(cacheRoot, 'local-device.glb'))).toEqual(localBytes);
  expect(await readFile(join(cacheRoot, 'remote-device.glb'))).toEqual(remoteBytes);

  await expect(fetchMuseumAssetInputs({
    catalog: { assets: [catalog.assets[1]] },
    projectRoot: root,
    cacheRoot,
    fetchImpl: async () => new Response('changed', { status: 200 }),
  })).rejects.toThrow('remote-device: original SHA-256 mismatch');
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：`npm test -- tests/unit/fetch-museum-assets.test.js`

预期：FAIL，错误包含 `Failed to resolve import "../../scripts/assets/fetch-museum-assets.mjs"`。

- [ ] **步骤 3：实现哈希锁定下载器与缓存命令**

创建 `scripts/assets/fetch-museum-assets.mjs`：

```js
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSourceCatalog } from '../../src/museum/asset-policy.js';

export const sha256Hex = (bytes) =>
  createHash('sha256').update(bytes).digest('hex');

export async function fetchMuseumAssetInputs({
  catalog,
  projectRoot,
  cacheRoot,
  fetchImpl = fetch,
}) {
  await mkdir(cacheRoot, { recursive: true });
  const results = [];

  for (const asset of catalog.assets) {
    if (asset.input.kind === 'generated') {
      results.push({ deviceId: asset.deviceId, state: 'generated-input' });
      continue;
    }

    let bytes;
    if (asset.input.kind === 'local') {
      bytes = await readFile(resolve(projectRoot, asset.input.path));
    } else {
      const response = await fetchImpl(asset.input.url, { redirect: 'follow' });
      if (!response.ok) {
        throw new Error(`${asset.deviceId}: download failed with HTTP ${response.status}`);
      }
      bytes = Buffer.from(await response.arrayBuffer());
    }

    if (sha256Hex(bytes) !== asset.input.sha256) {
      throw new Error(`${asset.deviceId}: original SHA-256 mismatch`);
    }
    await writeFile(join(cacheRoot, `${asset.deviceId}.glb`), bytes);
    results.push({ deviceId: asset.deviceId, state: 'verified' });
  }
  return results;
}

async function main() {
  const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const catalog = JSON.parse(await readFile(
    join(projectRoot, 'assets/museum/sources.json'),
    'utf8',
  ));
  const policyErrors = validateSourceCatalog(catalog);
  if (policyErrors.length) throw new Error(policyErrors.join('\n'));
  const results = await fetchMuseumAssetInputs({
    catalog,
    projectRoot,
    cacheRoot: join(projectRoot, '.cache/museum-assets/raw'),
  });
  for (const result of results) {
    console.log(`${result.deviceId}: ${result.state}`);
  }
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
```

在 `.gitignore` 增加：

```gitignore
# Reproducible museum asset input cache; published outputs live in assets/museum.
/.cache/museum-assets/
```

在 `package.json` 的 `scripts` 增加：

```json
{
  "assets:fetch": "node scripts/assets/fetch-museum-assets.mjs"
}
```

运行 `npm install --package-lock-only` 让 `package-lock.json` 同步根包脚本元数据。

- [ ] **步骤 4：运行测试与真实来源校验**

运行：

```bash
npm test -- tests/unit/fetch-museum-assets.test.js
npm run assets:fetch
```

预期：测试输出 `1 passed`；真实命令输出七行 `verified` 与一行 `pocket-care: generated-input`，退出状态为 0。

- [ ] **步骤 5：提交下载器**

```bash
git add .gitignore package.json package-lock.json scripts/assets/fetch-museum-assets.mjs tests/unit/fetch-museum-assets.test.js
git commit -m "build(assets): add checksum-locked model fetcher"
```

## 任务 3：生成 Pocket Care 开放程序化 GLB 并读取 GLB 指标

**文件：**

- 修改：`package.json`
- 修改：`package-lock.json`
- 创建：`scripts/assets/glb-metrics.mjs`
- 创建：`scripts/assets/generate-pocket-care.mjs`
- 创建：`tests/unit/generate-pocket-care.test.js`

- [ ] **步骤 1：编写失败的程序化模型测试**

创建 `tests/unit/generate-pocket-care.test.js`：

```js
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { generatePocketCareGlb } from '../../scripts/assets/generate-pocket-care.mjs';
import { inspectGlb } from '../../scripts/assets/glb-metrics.mjs';

const tempRoots = [];
afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map(
    (root) => rm(root, { recursive: true, force: true }),
  ));
});

it('exports a texture-free, low-poly Pocket Care GLB and source receipt', async () => {
  const root = await mkdtemp(join(tmpdir(), 'gamex-pocket-care-'));
  tempRoots.push(root);
  const outputPath = join(root, 'pocket-care.glb');
  const receiptPath = join(root, 'pocket-care.source-receipt.json');
  const sourcePath = new URL(
    '../../assets/museum/upstream/pocket-care-device.js',
    import.meta.url,
  );

  await generatePocketCareGlb({
    sourcePath,
    expectedSourceSha256:
      '5ddf051d24fca41b46b510d8878c76b969afc9dbb6b3c5266f766a7b00dfb52f',
    outputPath,
    receiptPath,
  });

  const bytes = await readFile(outputPath);
  const metrics = inspectGlb(bytes);
  const receipt = JSON.parse(await readFile(receiptPath, 'utf8'));
  expect(metrics.version).toBe(2);
  expect(metrics.triangleCount).toBeGreaterThan(1000);
  expect(metrics.triangleCount).toBeLessThan(25000);
  expect(metrics.imageCount).toBe(0);
  expect(metrics.animationCount).toBe(0);
  expect(receipt.sourceSha256).toBe(
    '5ddf051d24fca41b46b510d8878c76b969afc9dbb6b3c5266f766a7b00dfb52f',
  );
  expect(receipt.generatedSha256).toMatch(/^[a-f0-9]{64}$/);
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：`npm test -- tests/unit/generate-pocket-care.test.js`

预期：FAIL，错误包含 `Failed to resolve import "../../scripts/assets/generate-pocket-care.mjs"`。

- [ ] **步骤 3：实现 GLB 指标读取器与确定性 Pocket Care 生成器**

创建 `scripts/assets/glb-metrics.mjs`：

```js
const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;

export function inspectGlb(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.byteLength < 20 || view.getUint32(0, true) !== GLB_MAGIC) {
    throw new Error('invalid GLB magic');
  }
  const version = view.getUint32(4, true);
  const declaredLength = view.getUint32(8, true);
  const jsonLength = view.getUint32(12, true);
  const chunkType = view.getUint32(16, true);
  if (version !== 2 || declaredLength !== bytes.byteLength || chunkType !== JSON_CHUNK) {
    throw new Error('invalid GLB 2 container');
  }
  const jsonBytes = bytes.subarray(20, 20 + jsonLength);
  const json = JSON.parse(new TextDecoder().decode(jsonBytes).replace(/\u0000+$/g, '').trim());
  let triangleCount = 0;
  for (const mesh of json.meshes || []) {
    for (const primitive of mesh.primitives || []) {
      if ((primitive.mode ?? 4) !== 4) continue;
      const accessorIndex = primitive.indices ?? primitive.attributes?.POSITION;
      const count = json.accessors?.[accessorIndex]?.count || 0;
      triangleCount += Math.floor(count / 3);
    }
  }
  const names = [
    ...(json.nodes || []).map((item) => item.name),
    ...(json.meshes || []).map((item) => item.name),
    ...(json.materials || []).map((item) => item.name),
  ].filter(Boolean);
  return {
    version,
    byteLength: bytes.byteLength,
    triangleCount,
    imageCount: (json.images || []).length,
    textureCount: (json.textures || []).length,
    animationCount: (json.animations || []).length,
    names,
  };
}
```

创建 `scripts/assets/generate-pocket-care.mjs`：

```js
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
} from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

class NodeFileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.({ target: this });
    });
  }
}

function addMesh(root, geometry, material, position, scale = [1, 1, 1]) {
  const mesh = new Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  root.add(mesh);
}

function createPocketCareGeometry() {
  const root = new Group();
  root.name = 'pocket-care-shell';
  const pearl = new MeshStandardMaterial({
    color: 0xf0f1ec,
    roughness: 0.42,
    metalness: 0.06,
  });
  const ink = new MeshStandardMaterial({
    color: 0x25282d,
    roughness: 0.65,
  });
  const lime = new MeshStandardMaterial({
    color: 0xd9ff57,
    roughness: 0.5,
  });

  addMesh(root, new SphereGeometry(0.78, 32, 24), pearl, [0, 0.92, 0], [0.88, 1.14, 0.34]);
  addMesh(root, new TorusGeometry(0.22, 0.055, 12, 36), lime, [0, 2.04, 0], [1, 1.2, 0.75]);
  addMesh(root, new BoxGeometry(0.82, 0.58, 0.08), ink, [0, 1.16, -0.29]);
  addMesh(root, new BoxGeometry(0.68, 0.44, 0.025), lime, [0, 1.16, -0.34]);
  for (const x of [-0.34, 0, 0.34]) {
    addMesh(root, new SphereGeometry(0.105, 18, 12), ink, [x, 0.55, -0.32], [1, 0.7, 0.38]);
  }
  return root;
}

export async function generatePocketCareGlb({
  sourcePath,
  expectedSourceSha256,
  outputPath,
  receiptPath,
}) {
  const sourceBytes = await readFile(sourcePath);
  const sourceSha256 = sha256(sourceBytes);
  if (sourceSha256 !== expectedSourceSha256) {
    throw new Error('pocket-care: procedural source SHA-256 mismatch');
  }
  if (!globalThis.FileReader) globalThis.FileReader = NodeFileReader;
  const exporter = new GLTFExporter();
  const arrayBuffer = await exporter.parseAsync(createPocketCareGeometry(), {
    binary: true,
    onlyVisible: true,
    trs: false,
  });
  const bytes = Buffer.from(arrayBuffer);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, bytes);
  await writeFile(receiptPath, `${JSON.stringify({
    assetId: 'pocket-care-shell',
    sourceSha256,
    generatedSha256: sha256(bytes),
  }, null, 2)}\n`);
}

async function main() {
  const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const catalog = JSON.parse(await readFile(
    join(projectRoot, 'assets/museum/sources.json'),
    'utf8',
  ));
  const record = catalog.assets.find((asset) => asset.deviceId === 'pocket-care');
  const cacheRoot = join(projectRoot, '.cache/museum-assets/raw');
  await generatePocketCareGlb({
    sourcePath: join(projectRoot, record.input.sourcePath),
    expectedSourceSha256: record.input.sha256,
    outputPath: join(cacheRoot, 'pocket-care.glb'),
    receiptPath: join(cacheRoot, 'pocket-care.source-receipt.json'),
  });
  console.log('pocket-care: generated and source-verified');
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
```

在 `package.json` 的 `scripts` 增加：

```json
{
  "assets:generate": "node scripts/assets/generate-pocket-care.mjs"
}
```

运行 `npm install --package-lock-only` 更新锁文件。

- [ ] **步骤 4：运行测试与真实生成命令**

运行：

```bash
npm test -- tests/unit/generate-pocket-care.test.js
npm run assets:generate
```

预期：测试输出 `1 passed`；生成命令输出 `pocket-care: generated and source-verified`。

- [ ] **步骤 5：提交程序化输入生成器**

```bash
git add package.json package-lock.json scripts/assets/glb-metrics.mjs scripts/assets/generate-pocket-care.mjs tests/unit/generate-pocket-care.test.js
git commit -m "build(assets): generate open Pocket Care shell"
```

## 任务 4：删除不安全表现并执行确定性 Meshopt 加工

**文件：**

- 修改：`package.json`
- 修改：`package-lock.json`
- 修改：`src/main.js`
- 修改：`scripts/assets/glb-metrics.mjs`
- 创建：`scripts/assets/sanitize-museum-glb.mjs`
- 创建：`scripts/assets/render-contact-sheet.mjs`
- 创建：`scripts/assets/generate-museum-review-fixture.mjs`
- 创建：`src/museum/asset-review-page.js`
- 创建：`tests/unit/sanitize-museum-glb.test.js`
- 创建：`tests/unit/museum-review-fixture.test.js`
- 生成并提交：`tests/fixtures/museum-review.glb`
- 创建：`tests/e2e/asset-review-page.spec.js`

- [ ] **步骤 0：先用 TDD 建立不依赖发布资产的稳定 fixture**

先创建下方完整的 `tests/unit/museum-review-fixture.test.js`，运行
`npm test -- tests/unit/museum-review-fixture.test.js`，预期因
`generate-museum-review-fixture.mjs` 不存在而 FAIL。随后实现本任务步骤 3
给出的确定性生成器，并先在 `package.json` 加入：

```json
{
  "assets:review-fixture": "node scripts/assets/generate-museum-review-fixture.mjs"
}
```

运行 `npm install --package-lock-only` 同步锁文件后执行：

```bash
npm run assets:review-fixture
printf '%s  %s\n' \
  '6cfe35284ca242fd3bc24531edb8fd4d678a4f1962e7cedf824c0c68662171d2' \
  'tests/fixtures/museum-review.glb' \
  | shasum -a 256 -c -
npm test -- tests/unit/museum-review-fixture.test.js
```

预期：先红后绿，最终输出固定 `992 bytes` 与上述 SHA-256。必须在创建
`sanitize-museum-glb.test.js` 和 `asset-review-page.spec.js` 前先提交 fixture：

```bash
git add package.json package-lock.json \
  scripts/assets/generate-museum-review-fixture.mjs \
  tests/unit/museum-review-fixture.test.js tests/fixtures/museum-review.glb
git commit -m "test(assets): add stable neutral GLB fixture"
```

此提交是阶段 02 后续所有 GLB 单测/E2E 的稳定前置；阶段 05 的生成与清理范围
只能是 `.cache/museum-assets/`、`public/__asset-review__/`、`assets/museum/`
和 `src/museum/generated-asset-records.js`，不得触碰 `tests/fixtures/`。

- [ ] **步骤 1：编写失败的 GLB 清理测试**

创建 `tests/unit/sanitize-museum-glb.test.js`：

```js
import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';
import { sanitizeMuseumGlb } from '../../scripts/assets/sanitize-museum-glb.mjs';
import { inspectGlb } from '../../scripts/assets/glb-metrics.mjs';

it('removes source expression and emits a generic Meshopt GLB', async () => {
  const inputBytes = await readFile(new URL(
    '../fixtures/museum-review.glb',
    import.meta.url,
  ));
  const outputBytes = await sanitizeMuseumGlb({
    inputBytes,
    deviceId: 'pocket-play',
  });
  const metrics = inspectGlb(outputBytes);

  expect(metrics.imageCount).toBe(0);
  expect(metrics.textureCount).toBe(0);
  expect(metrics.animationCount).toBe(0);
  expect(metrics.extensionsUsed).toContain('EXT_meshopt_compression');
  expect(metrics.names.every((name) =>
    /^(node|mesh|material)-\d{3}$/.test(name))).toBe(true);
  expect(metrics.names.join(' ').toLowerCase()).not.toMatch(
    /nintendo|bandai|tamagotchi|tetris|game boy|subor/,
  );
});
```

步骤 0 已创建并提交 `tests/unit/museum-review-fixture.test.js`；其完整内容如下，后续不得改成读取任何 `apps/*/public/models` 或 `assets/museum/models` 路径：

```js
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';
import {
  buildMuseumReviewFixtureGlb,
  MUSEUM_REVIEW_FIXTURE_SHA256,
} from '../../scripts/assets/generate-museum-review-fixture.mjs';
import { inspectGlb } from '../../scripts/assets/glb-metrics.mjs';

const sha256 = (bytes) =>
  createHash('sha256').update(bytes).digest('hex');

it('keeps the committed neutral review GLB byte-for-byte reproducible', async () => {
  const generated = buildMuseumReviewFixtureGlb();
  const committed = await readFile(new URL(
    '../fixtures/museum-review.glb',
    import.meta.url,
  ));
  expect(generated.byteLength).toBe(992);
  expect(sha256(generated)).toBe(MUSEUM_REVIEW_FIXTURE_SHA256);
  expect(MUSEUM_REVIEW_FIXTURE_SHA256).toBe(
    '6cfe35284ca242fd3bc24531edb8fd4d678a4f1962e7cedf824c0c68662171d2',
  );
  expect(committed).toEqual(generated);
  expect(inspectGlb(committed)).toMatchObject({
    version: 2,
    triangleCount: 12,
    imageCount: 0,
    textureCount: 0,
    animationCount: 0,
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
npm test -- tests/unit/sanitize-museum-glb.test.js \
  tests/unit/museum-review-fixture.test.js
```

预期：fixture 测试 PASS；sanitize 测试 FAIL，且唯一失败原因是缺少 `sanitize-museum-glb.mjs`，不得出现读取 GLB 的 ENOENT。

- [ ] **步骤 3：锁定加工依赖并实现清理函数**

运行：

```bash
npm install --save-dev --save-exact @gltf-transform/core@4.4.1 @gltf-transform/functions@4.4.1 @gltf-transform/extensions@4.4.1 meshoptimizer@0.24.0
```

预期：`package.json` 和 `package-lock.json` 更新，四个包均为精确版本。

在 `scripts/assets/glb-metrics.mjs` 返回对象中加入扩展字段：

```text
extensionsUsed: [...(json.extensionsUsed || [])],
```

创建 `scripts/assets/sanitize-museum-glb.mjs`：

```js
import { NodeIO } from '@gltf-transform/core';
import {
  ALL_EXTENSIONS,
} from '@gltf-transform/extensions';
import {
  center,
  dedup,
  meshopt,
  prune,
  weld,
} from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

const PALETTES = {
  'pocket-play': ['#e9eadf', '#29303a', '#d9ff57'],
  'pocket-care': ['#f1efe8', '#29303a', '#d9ff57'],
  'learning-computer': ['#e9e5db', '#2c3138', '#a9f5ff'],
  'home-console': ['#e8e9e6', '#30343a', '#d9ff57'],
  'wide-handheld': ['#edf6f5', '#25323a', '#72e8f2'],
  'dual-lcd-pocket': ['#f0edf5', '#2f2d39', '#b99cff'],
  'block-handheld': ['#eef0e8', '#28322c', '#d9ff57'],
  'arcade-terminal': ['#eeeaf4', '#30283b', '#bb8cff'],
};

const factor = (hex) => {
  const value = Number.parseInt(hex.slice(1), 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
    1,
  ];
};

const serial = (prefix, index) =>
  `${prefix}-${String(index + 1).padStart(3, '0')}`;

function createIo() {
  return new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'meshopt.decoder': MeshoptDecoder,
      'meshopt.encoder': MeshoptEncoder,
    });
}

function replaceMaterials(document, deviceId) {
  const root = document.getRoot();
  const palette = PALETTES[deviceId];
  if (!palette) throw new Error(`${deviceId}: no approved material palette`);
  const replacements = new Map();
  const sourceMaterials = [...root.listMaterials()];

  for (const mesh of root.listMeshes()) {
    for (const primitive of mesh.listPrimitives()) {
      const source = primitive.getMaterial();
      const key = source || null;
      if (!replacements.has(key)) {
        const index = replacements.size;
        const material = document.createMaterial(serial('material', index))
          .setBaseColorFactor(factor(palette[index % palette.length]))
          .setMetallicFactor(index % 3 === 1 ? 0.08 : 0.02)
          .setRoughnessFactor(index % 3 === 1 ? 0.68 : 0.44)
          .setDoubleSided(false);
        replacements.set(key, material);
      }
      primitive.setMaterial(replacements.get(key));
    }
  }
  for (const material of sourceMaterials) material.dispose();
  for (const texture of [...root.listTextures()]) texture.dispose();
}

function stripMetadata(document) {
  const root = document.getRoot();
  for (const animation of [...root.listAnimations()]) animation.dispose();
  for (const camera of [...root.listCameras()]) camera.dispose();
  root.listNodes().forEach((node, index) => {
    node.setName(serial('node', index));
    node.setExtras({});
  });
  root.listMeshes().forEach((mesh, index) => {
    mesh.setName(serial('mesh', index));
    mesh.setExtras({});
  });
  root.listMaterials().forEach((material, index) => {
    material.setName(serial('material', index));
    material.setExtras({});
  });
  root.listScenes().forEach((scene) => {
    scene.setName('');
    scene.setExtras({});
  });
}

export async function sanitizeMuseumGlb({ inputBytes, deviceId }) {
  await MeshoptEncoder.ready;
  await MeshoptDecoder.ready;
  const io = createIo();
  const document = await io.readBinary(new Uint8Array(
    inputBytes.buffer,
    inputBytes.byteOffset,
    inputBytes.byteLength,
  ));
  replaceMaterials(document, deviceId);
  stripMetadata(document);
  await document.transform(
    center({ pivot: 'below' }),
    dedup(),
    prune(),
    weld(),
    meshopt({
      encoder: MeshoptEncoder,
      level: 'medium',
      quantizePosition: 14,
      quantizeNormal: 10,
      quantizeTexcoord: 12,
    }),
  );
  return Buffer.from(await io.writeBinary(document));
}
```

步骤 0 使用的 `scripts/assets/generate-museum-review-fixture.mjs` 完整内容如下。它不读取任何发布模型或网络资源，所有浮点数与索引都显式按 little-endian 写入，因此相同 Node 版本和不同机器生成完全相同的 992 bytes：

```js
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const MUSEUM_REVIEW_FIXTURE_SHA256 =
  '6cfe35284ca242fd3bc24531edb8fd4d678a4f1962e7cedf824c0c68662171d2';

const POSITIONS = Object.freeze([
  -0.5, -0.5, -0.5,  0.5, -0.5, -0.5,
   0.5,  0.5, -0.5, -0.5,  0.5, -0.5,
  -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,
   0.5,  0.5,  0.5, -0.5,  0.5,  0.5,
]);
const INDICES = Object.freeze([
  0, 2, 1, 0, 3, 2,  4, 5, 6, 4, 6, 7,
  0, 1, 5, 0, 5, 4,  3, 7, 6, 3, 6, 2,
  0, 4, 7, 0, 7, 3,  1, 2, 6, 1, 6, 5,
]);

const sha256 = (bytes) =>
  createHash('sha256').update(bytes).digest('hex');

function encodeFloat32(values) {
  const bytes = Buffer.alloc(values.length * 4);
  values.forEach((value, index) => bytes.writeFloatLE(value, index * 4));
  return bytes;
}

function encodeUint16(values) {
  const bytes = Buffer.alloc(values.length * 2);
  values.forEach((value, index) => bytes.writeUInt16LE(value, index * 2));
  return bytes;
}

export function buildMuseumReviewFixtureGlb() {
  const positions = encodeFloat32(POSITIONS);
  const indices = encodeUint16(INDICES);
  const bin = Buffer.concat([positions, indices]);
  const gltf = {
    asset: { version: '2.0', generator: 'GameX neutral review fixture v1' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: 'fixture-neutral-node' }],
    meshes: [{
      name: 'fixture-neutral-mesh',
      primitives: [{ attributes: { POSITION: 0 }, indices: 1, material: 0 }],
    }],
    materials: [{
      name: 'fixture-neutral-material',
      pbrMetallicRoughness: {
        baseColorFactor: [0.82, 0.86, 0.88, 1],
        metallicFactor: 0,
        roughnessFactor: 0.7,
      },
    }],
    buffers: [{ byteLength: bin.byteLength }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: positions.byteLength, target: 34962 },
      {
        buffer: 0,
        byteOffset: positions.byteLength,
        byteLength: indices.byteLength,
        target: 34963,
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 8,
        type: 'VEC3',
        min: [-0.5, -0.5, -0.5],
        max: [0.5, 0.5, 0.5],
      },
      {
        bufferView: 1,
        componentType: 5123,
        count: 36,
        type: 'SCALAR',
        min: [0],
        max: [7],
      },
    ],
  };
  const rawJson = Buffer.from(JSON.stringify(gltf));
  const jsonPadding = (4 - rawJson.byteLength % 4) % 4;
  const json = Buffer.concat([rawJson, Buffer.alloc(jsonPadding, 0x20)]);
  const totalLength = 12 + 8 + json.byteLength + 8 + bin.byteLength;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(json.byteLength, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(bin.byteLength, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, json, binHeader, bin]);
}

async function main() {
  const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const outputPath = join(projectRoot, 'tests/fixtures/museum-review.glb');
  const bytes = buildMuseumReviewFixtureGlb();
  const actual = sha256(bytes);
  if (bytes.byteLength !== 992 || actual !== MUSEUM_REVIEW_FIXTURE_SHA256) {
    throw new Error(
      `museum review fixture drift: ${bytes.byteLength} bytes, SHA-256 ${actual}`,
    );
  }
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, bytes);
  console.log(`museum review fixture: 992 bytes, SHA-256 ${actual}`);
}

if (process.argv[1]
  && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
```

步骤 0 已在 `package.json` 的 `scripts` 加入并锁定：

```json
{
  "assets:review-fixture": "node scripts/assets/generate-museum-review-fixture.mjs"
}
```

- [ ] **步骤 4：运行测试验证通过**

先生成并独立核对提交 fixture，再运行测试：

```bash
npm run assets:review-fixture
printf '%s  %s\n' \
  '6cfe35284ca242fd3bc24531edb8fd4d678a4f1962e7cedf824c0c68662171d2' \
  'tests/fixtures/museum-review.glb' \
  | shasum -a 256 -c -
npm test -- tests/unit/sanitize-museum-glb.test.js \
  tests/unit/museum-review-fixture.test.js
```

预期：hash 命令输出 `tests/fixtures/museum-review.glb: OK`；两个测试 PASS，且没有 glTF Transform 警告升级为异常。fixture 从此是普通受版本控制文件，阶段 05 只写 `assets/museum/` 与 `src/museum/generated-asset-records.js`，不得删除或重建 `tests/fixtures/museum-review.glb`。

- [ ] **步骤 5：编写审查入口 smoke test**

创建 `tests/e2e/asset-review-page.spec.js`：

```js
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const glbFixture = readFileSync(
  new URL('../fixtures/museum-review.glb', import.meta.url),
);

test('asset-review query mounts the executable 8 by 4 review grid', async ({ page }) => {
  await page.route('**/__asset-review__/*.glb', (route) => route.fulfill({
    status: 200,
    contentType: 'model/gltf-binary',
    body: glbFixture,
  }));
  await page.goto('/?asset-review=1');
  await expect(page.locator('#app')).toHaveAttribute('data-review-ready', '8');
  await expect(page.locator('#asset-review-grid [data-review-view]')).toHaveCount(32);
  await expect(page.locator('.museum-canvas')).toHaveCount(0);
});
```

运行：`npm run test:e2e -- tests/e2e/asset-review-page.spec.js`

预期：FAIL；`#app` 没有 `data-review-ready="8"`，因为阶段 1 的 `src/main.js` 尚未分派审查入口。

- [ ] **步骤 6：接通 `?asset-review=1` 的真实入口并验证通过**

`src/museum/asset-review-page.js` 导出 `mountAssetReviewPage({ root })`。该函数使用一个 `WebGLRenderer` 渲染 32 个固定槽位；八个设备各按 `front/left/back/right = 0/90/180/270°` 重复四次，白底、统一包围盒、无随机灯光。全部解析后执行：

```js
root.dataset.reviewReady = '8';
```

任一加载失败时执行：

```js
root.dataset.reviewError = error instanceof Error ? error.message : String(error);
throw error;
```

把阶段 1 的 `src/main.js` 组合根替换为以下互斥入口；审查模式不得先创建普通 `MuseumScene`：

```js
import './styles.css';
import { initBgmToggle } from './bgm.js';
import { createMuseumApp } from './museum/create-museum-app.js';

const root = document.querySelector('#app');
const reviewMode = new URLSearchParams(window.location.search)
  .get('asset-review') === '1';
let dispose;

if (reviewMode) {
  const { mountAssetReviewPage } = await import('./museum/asset-review-page.js');
  const reviewPage = await mountAssetReviewPage({ root });
  dispose = () => reviewPage.dispose();
} else {
  const museum = createMuseumApp({ root });
  museum.start();
  initBgmToggle();
  dispose = () => museum.dispose();
}

if (import.meta.hot) import.meta.hot.dispose(() => dispose());
```

再次运行：

```bash
npm run test:e2e -- tests/e2e/asset-review-page.spec.js
```

预期：输出 `1 passed`，并证明查询参数实际执行审查页面而非普通展馆。

- [ ] **步骤 7：生成四视图审查图与严格失败回执**

创建 `scripts/assets/render-contact-sheet.mjs`：先对 `.cache/museum-assets/raw/*.glb` 调用同一个 `sanitizeMuseumGlb`，把八个确定性候选临时写到精确目录 `public/__asset-review__/`；用固定端口 `4175` 启动 `vite --mode asset-review`，Playwright Chromium 打开 `http://127.0.0.1:4175/?asset-review=1`，viewport 固定 `1600×1200`，等待 `[data-review-ready="8"]`，把 `#asset-review-grid` 截图到 `assets/museum/review/contact-sheet.png`。`asset-review-page.js` 只从 `/__asset-review__/` 读取候选。脚本在 `finally` 终止 Vite 子进程并删除这个精确临时目录，禁止把它提交。

截图成功后，脚本计算 contact sheet SHA-256，并按 `sources.json` 的设备顺序计算 `candidateSetSha256 = sha256(deviceId + ":" + outputSha256 + "\n" 的串联结果)`。它写出严格、fail-closed 的回执草稿：

```json
{
  "schemaVersion": 1,
  "contactSheetSha256": "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
  "candidateSetSha256": "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  "reviews": [
    {
      "deviceId": "pocket-play",
      "outputSha256": "0000000000000000000000000000000000000000000000000000000000000000",
      "reviewedBy": "",
      "reviewedOn": "",
      "checks": {
        "noLogo": false,
        "noProductText": false,
        "noThirdPartyScreen": false,
        "geometryReviewed": false
      },
      "notes": []
    }
  ]
}
```

上面的 `f…`、`e…` 与全零值是**文档中的占位测试值**，只展示字段宽度；实际脚本必须分别写入 contact sheet、候选集合和每个候选 GLB 的真实哈希。草稿必须恰好包含来源清单中的八个唯一 `deviceId`。维护者查看四视图后，才可将四项检查改为 `true`，填写去除首尾空格后的 reviewer、真实 ISO 日期和至少一条具体改作 note；脚本和实现代理不得自动批准。

- [ ] **步骤 8：提交确定性加工与审查工具**

```bash
git add package.json package-lock.json scripts/assets/glb-metrics.mjs \
  scripts/assets/sanitize-museum-glb.mjs scripts/assets/render-contact-sheet.mjs \
  src/main.js src/museum/asset-review-page.js \
  tests/unit/sanitize-museum-glb.test.js tests/e2e/asset-review-page.spec.js
git commit -m "build(assets): sanitize and meshopt museum models"
```

## 任务 5：发布八个 GLB、清单与生成式注册表记录

**文件：**

- 修改：`package.json`
- 修改：`package-lock.json`
- 创建：`scripts/assets/process-museum-assets.mjs`
- 创建：`tests/unit/process-museum-assets.test.js`
- 创建：`tests/unit/asset-rights-review.test.js`
- 生成并人工确认：`assets/museum/review/contact-sheet.png`
- 生成并人工确认：`assets/museum/review/rights-review.json`
- 生成：`assets/museum/manifest.json`
- 生成：`assets/museum/models/*.glb`
- 生成：`src/museum/generated-asset-records.js`

- [ ] **步骤 1：编写失败的单资产发布测试**

创建 `tests/unit/process-museum-assets.test.js`：

```js
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { generatePocketCareGlb } from '../../scripts/assets/generate-pocket-care.mjs';
import {
  buildGeneratedRegistryRecords,
  processOneMuseumAsset,
} from '../../scripts/assets/process-museum-assets.mjs';
import { sanitizeMuseumGlb } from '../../scripts/assets/sanitize-museum-glb.mjs';
import { sha256Hex } from '../../scripts/assets/fetch-museum-assets.mjs';

const tempRoots = [];
afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map(
    (root) => rm(root, { recursive: true, force: true }),
  ));
});

it('publishes identical bytes and metadata from identical generated input', async () => {
  const root = await mkdtemp(join(tmpdir(), 'gamex-asset-process-'));
  tempRoots.push(root);
  const rawPath = join(root, 'pocket-care.glb');
  const receiptPath = join(root, 'pocket-care.source-receipt.json');
  const catalog = JSON.parse(await readFile(new URL(
    '../../assets/museum/sources.json',
    import.meta.url,
  ), 'utf8'));
  const record = catalog.assets.find((asset) => asset.deviceId === 'pocket-care');

  await generatePocketCareGlb({
    sourcePath: new URL(record.input.sourcePath, new URL('../../', import.meta.url)),
    expectedSourceSha256: record.input.sha256,
    outputPath: rawPath,
    receiptPath,
  });
  const candidate = await sanitizeMuseumGlb({
    inputBytes: await readFile(rawPath),
    deviceId: record.deviceId,
  });
  const rightsReview = {
    deviceId: record.deviceId,
    outputSha256: sha256Hex(candidate),
    reviewedBy: 'Unit test reviewer',
    reviewedOn: '2026-07-24',
    checks: {
      noLogo: true,
      noProductText: true,
      noThirdPartyScreen: true,
      geometryReviewed: true,
    },
    notes: ['Programmatic shell fixture reviewed from four fixed views'],
  };
  const first = await processOneMuseumAsset({
    record,
    downloadedAt: catalog.downloadedAt,
    rawPath,
    receiptPath,
    rightsReview,
  });
  const second = await processOneMuseumAsset({
    record,
    downloadedAt: catalog.downloadedAt,
    rawPath,
    receiptPath,
    rightsReview,
  });

  expect(first.outputBytes).toEqual(second.outputBytes);
  expect(first.published.outputSha256).toBe(second.published.outputSha256);
  expect(first.published.originalSha256).toBe(record.input.sha256);
  expect(record).toMatchObject({
    trademarkRemoved: null,
    reviewStatus: 'pending',
    reviewedOn: null,
  });
  expect(first.published).toMatchObject({
    trademarkRemoved: true,
    reviewStatus: 'approved',
    reviewedOn: rightsReview.reviewedOn,
    reviewNotes: rightsReview.notes,
  });
  expect(first.published.byteLength).toBeLessThanOrEqual(record.maxBytes);
  expect(first.published.triangleCount).toBeLessThanOrEqual(record.maxTriangles);
  expect(first.published.outputFile).toBe('models/pocket-care.glb');
  expect(buildGeneratedRegistryRecords([first.published])).toEqual({
    'pocket-care': Object.fromEntries(
      Object.entries(first.published).filter(([key]) => key !== 'deviceId'),
    ),
  });
});
```

创建 `tests/unit/asset-rights-review.test.js`；测试中的字符串经哈希后才成为 64 位值，不冒充真实候选资产：

```js
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import {
  buildCandidateSetSha256,
  verifyRightsReviewReceipt,
} from '../../scripts/assets/process-museum-assets.mjs';
import { sha256Hex } from '../../scripts/assets/fetch-museum-assets.mjs';

const catalog = JSON.parse(readFileSync(new URL(
  '../../assets/museum/sources.json',
  import.meta.url,
), 'utf8'));
const contactSheetBytes = Buffer.from('unit-test contact sheet bytes');
const candidates = catalog.assets.map(({ deviceId }) => ({
  deviceId,
  outputSha256: sha256Hex(Buffer.from(`unit-test candidate:${deviceId}`)),
}));
const receipt = {
  schemaVersion: 1,
  contactSheetSha256: sha256Hex(contactSheetBytes),
  candidateSetSha256: buildCandidateSetSha256(candidates),
  reviews: candidates.map((candidate) => ({
    ...candidate,
    reviewedBy: 'GameX maintainer',
    reviewedOn: '2026-07-24',
    checks: {
      noLogo: true,
      noProductText: true,
      noThirdPartyScreen: true,
      geometryReviewed: true,
    },
    notes: ['Reviewed all four fixed views and removed source marks'],
  })),
};

it('requires a strict eight-item receipt bound to contact sheet and candidates', () => {
  const verify = (value, nextCandidates = candidates) => () =>
    verifyRightsReviewReceipt({
      catalog,
      candidates: nextCandidates,
      receipt: value,
      contactSheetBytes,
      today: '2026-07-24',
    });

  expect(verify(receipt)).not.toThrow();
  expect(verify({ ...receipt, extra: true })).toThrow('rights review: unexpected keys');
  expect(verify({
    ...receipt,
    reviews: [...receipt.reviews.slice(0, 7), receipt.reviews[0]],
  })).toThrow('rights review: reviews must contain exactly 8 unique expected device IDs');
  expect(verify({
    ...receipt,
    reviews: receipt.reviews.map((review, index) =>
      index === 0 ? { ...review, reviewedBy: ' GameX maintainer ' } : review),
  })).toThrow('pocket-play: reviewedBy must be trimmed');
  expect(verify({
    ...receipt,
    reviews: receipt.reviews.map((review, index) =>
      index === 0 ? { ...review, notes: ['   '] } : review),
  })).toThrow('pocket-play: notes must contain trimmed non-empty strings');
  expect(verify({
    ...receipt,
    reviews: receipt.reviews.map((review, index) =>
      index === 0 ? { ...review, reviewedOn: '2026-02-30' } : review),
  })).toThrow('pocket-play: reviewedOn must be a real non-future ISO date');
  expect(verify({
    ...receipt,
    contactSheetSha256: '0'.repeat(64),
  })).toThrow('rights review: contact sheet SHA-256 mismatch');
  expect(verify(receipt, candidates.map((candidate, index) => index === 0
    ? { ...candidate, outputSha256: 'f'.repeat(64) }
    : candidate))).toThrow('rights review: candidate set SHA-256 mismatch');
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
npm test -- tests/unit/process-museum-assets.test.js \
  tests/unit/asset-rights-review.test.js
```

预期：FAIL，错误包含 `Failed to resolve import "../../scripts/assets/process-museum-assets.mjs"`。

- [ ] **步骤 3：实现发布器与生成式清单**

创建 `scripts/assets/process-museum-assets.mjs`：

```js
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validatePublishedManifest,
  validateSourceCatalog,
} from '../../src/museum/asset-policy.js';
import { inspectGlb } from './glb-metrics.mjs';
import { sanitizeMuseumGlb } from './sanitize-museum-glb.mjs';
import { sha256Hex } from './fetch-museum-assets.mjs';

const TOTAL_BUDGET_BYTES = 4 * 1024 * 1024;
const REQUIRED_REVIEW_CHECKS = Object.freeze([
  'noLogo',
  'noProductText',
  'noThirdPartyScreen',
  'geometryReviewed',
]);
const REVIEW_RECEIPT_KEYS = Object.freeze([
  'schemaVersion',
  'contactSheetSha256',
  'candidateSetSha256',
  'reviews',
]);
const REVIEW_KEYS = Object.freeze([
  'deviceId',
  'outputSha256',
  'reviewedBy',
  'reviewedOn',
  'checks',
  'notes',
]);
const SHA256 = /^[a-f0-9]{64}$/;

function exactKeys(value, expected) {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.keys(value).sort().join('\n') === [...expected].sort().join('\n');
}

function realNonFutureIsoDate(value, today) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf())
    && parsed.toISOString().slice(0, 10) === value
    && value <= today;
}

export function buildCandidateSetSha256(candidates) {
  return sha256Hex(Buffer.from(candidates
    .map(({ deviceId, outputSha256 }) => `${deviceId}:${outputSha256}\n`)
    .join('')));
}

export function verifyRightsReview({
  record,
  outputSha256,
  review,
  today = new Date().toISOString().slice(0, 10),
}) {
  if (!exactKeys(review, REVIEW_KEYS)) {
    throw new Error(`${record.deviceId}: review has unexpected keys`);
  }
  if (!exactKeys(review.checks, REQUIRED_REVIEW_CHECKS)) {
    throw new Error(`${record.deviceId}: checks must use the exact schema`);
  }
  if (review.deviceId !== record.deviceId
    || review.outputSha256 !== outputSha256
    || !SHA256.test(review.outputSha256)) {
    throw new Error(`${record.deviceId}: missing matching approved visual review`);
  }
  if (typeof review.reviewedBy !== 'string'
    || review.reviewedBy.trim().length < 2
    || review.reviewedBy !== review.reviewedBy.trim()) {
    throw new Error(`${record.deviceId}: reviewedBy must be trimmed`);
  }
  if (!realNonFutureIsoDate(review.reviewedOn, today)) {
    throw new Error(
      `${record.deviceId}: reviewedOn must be a real non-future ISO date`,
    );
  }
  if (!Array.isArray(review.notes)
    || review.notes.length === 0
    || review.notes.some((note) =>
      typeof note !== 'string' || note.trim().length === 0 || note !== note.trim())) {
    throw new Error(
      `${record.deviceId}: notes must contain trimmed non-empty strings`,
    );
  }
  if (!REQUIRED_REVIEW_CHECKS.every((key) => review.checks[key] === true)) {
    throw new Error(`${record.deviceId}: missing matching approved visual review`);
  }
  return Object.freeze({
    trademarkRemoved: true,
    reviewStatus: 'approved',
    reviewedOn: review.reviewedOn,
    reviewNotes: Object.freeze([...review.notes]),
  });
}

export function verifyRightsReviewReceipt({
  catalog,
  candidates,
  receipt,
  contactSheetBytes,
  today = new Date().toISOString().slice(0, 10),
}) {
  if (!exactKeys(receipt, REVIEW_RECEIPT_KEYS) || receipt.schemaVersion !== 1) {
    throw new Error('rights review: unexpected keys or schemaVersion');
  }
  const expectedIds = catalog.assets.map((asset) => asset.deviceId);
  const reviewedIds = Array.isArray(receipt.reviews)
    ? receipt.reviews.map((review) => review.deviceId)
    : [];
  if (reviewedIds.length !== 8
    || new Set(reviewedIds).size !== 8
    || expectedIds.some((id) => !reviewedIds.includes(id))) {
    throw new Error(
      'rights review: reviews must contain exactly 8 unique expected device IDs',
    );
  }
  if (receipt.contactSheetSha256 !== sha256Hex(contactSheetBytes)) {
    throw new Error('rights review: contact sheet SHA-256 mismatch');
  }
  if (receipt.candidateSetSha256 !== buildCandidateSetSha256(candidates)) {
    throw new Error('rights review: candidate set SHA-256 mismatch');
  }
  for (const record of catalog.assets) {
    const candidate = candidates.find((item) => item.deviceId === record.deviceId);
    const review = receipt.reviews.find((item) => item.deviceId === record.deviceId);
    if (!candidate || !SHA256.test(candidate.outputSha256)) {
      throw new Error(`${record.deviceId}: candidate hash is missing`);
    }
    verifyRightsReview({
      record,
      outputSha256: candidate.outputSha256,
      review,
      today,
    });
  }
}

async function verifyInput({ record, rawBytes, receiptPath }) {
  if (record.input.kind !== 'generated') {
    if (sha256Hex(rawBytes) !== record.input.sha256) {
      throw new Error(`${record.deviceId}: raw input SHA-256 mismatch`);
    }
    return;
  }
  const receipt = JSON.parse(await readFile(receiptPath, 'utf8'));
  if (receipt.assetId !== record.assetId
    || receipt.sourceSha256 !== record.input.sha256
    || receipt.generatedSha256 !== sha256Hex(rawBytes)) {
    throw new Error(`${record.deviceId}: generated source receipt mismatch`);
  }
}

export async function buildMuseumCandidate({ record, rawPath, receiptPath }) {
  const rawBytes = await readFile(rawPath);
  await verifyInput({ record, rawBytes, receiptPath });
  const outputBytes = await sanitizeMuseumGlb({
    inputBytes: rawBytes,
    deviceId: record.deviceId,
  });
  const outputSha256 = sha256Hex(outputBytes);
  const metrics = inspectGlb(outputBytes);
  if (metrics.byteLength > record.maxBytes) {
    throw new Error(
      `${record.deviceId}: ${metrics.byteLength} bytes exceeds ${record.maxBytes}`,
    );
  }
  if (metrics.triangleCount > record.maxTriangles) {
    throw new Error(
      `${record.deviceId}: ${metrics.triangleCount} triangles exceeds ${record.maxTriangles}`,
    );
  }
  if (metrics.imageCount !== 0 || metrics.textureCount !== 0
    || metrics.animationCount !== 0) {
    throw new Error(`${record.deviceId}: sanitized GLB contains source expression`);
  }
  return Object.freeze({ outputBytes, outputSha256, metrics });
}

export function publishReviewedCandidate({
  record,
  downloadedAt,
  candidate,
  rightsReview,
  today,
}) {
  const reviewDerived = verifyRightsReview({
    record,
    outputSha256: candidate.outputSha256,
    review: rightsReview,
    today,
  });
  const outputFile = `models/${record.deviceId}.glb`;
  return {
    outputBytes: candidate.outputBytes,
    published: {
      assetId: record.assetId,
      deviceId: record.deviceId,
      title: record.title,
      creator: record.creator,
      sourceUrl: record.sourceUrl,
      license: record.license,
      licenseUrl: record.licenseUrl,
      downloadedAt,
      originalSha256: record.input.sha256,
      modifications: record.modifications,
      outputFile,
      modelUrl: `./museum/${outputFile}`,
      outputSha256: candidate.outputSha256,
      byteLength: candidate.metrics.byteLength,
      triangleCount: candidate.metrics.triangleCount,
      maxBytes: record.maxBytes,
      maxTriangles: record.maxTriangles,
      ...reviewDerived,
      presentation: record.presentation,
    },
  };
}

export async function processOneMuseumAsset({
  record,
  downloadedAt,
  rawPath,
  receiptPath,
  rightsReview,
  today,
}) {
  const candidate = await buildMuseumCandidate({ record, rawPath, receiptPath });
  return publishReviewedCandidate({
    record,
    downloadedAt,
    candidate,
    rightsReview,
    today,
  });
}

export function buildGeneratedRegistryRecords(assets) {
  return Object.fromEntries(assets.map(({ deviceId, ...publishedFields }) => [
    deviceId,
    publishedFields,
  ]));
}

function generatedRegistrySource(assets) {
  const records = buildGeneratedRegistryRecords(assets);
  return `// Generated by scripts/assets/process-museum-assets.mjs.\n`
    + `// Regenerate with npm run assets:refresh; do not edit by hand.\n`
    + `export const ASSET_RECORDS_BY_DEVICE = Object.freeze(`
    + `${JSON.stringify(records, null, 2)});\n`;
}

export async function processMuseumAssets({
  catalog,
  rightsReviewReceipt,
  contactSheetBytes,
  rawRoot,
  publishedRoot,
  generatedRecordsPath,
  today = new Date().toISOString().slice(0, 10),
}) {
  const catalogErrors = validateSourceCatalog(catalog);
  if (catalogErrors.length) throw new Error(catalogErrors.join('\n'));
  await mkdir(join(publishedRoot, 'models'), { recursive: true });
  const prepared = [];

  for (const record of catalog.assets) {
    const candidate = await buildMuseumCandidate({
      record,
      rawPath: join(rawRoot, `${record.deviceId}.glb`),
      receiptPath: record.input.kind === 'generated'
        ? join(rawRoot, `${record.deviceId}.source-receipt.json`)
        : undefined,
    });
    prepared.push({ record, candidate });
  }

  const candidates = prepared.map(({ record, candidate }) => ({
    deviceId: record.deviceId,
    outputSha256: candidate.outputSha256,
  }));
  verifyRightsReviewReceipt({
    catalog,
    candidates,
    receipt: rightsReviewReceipt,
    contactSheetBytes,
    today,
  });

  // Approval fields are created only after the complete contact-sheet and
  // candidate-set receipt has passed. Source catalog values are never copied.
  const processed = prepared.map(({ record, candidate }) =>
    publishReviewedCandidate({
      record,
      downloadedAt: catalog.downloadedAt,
      candidate,
      rightsReview: rightsReviewReceipt.reviews.find(
        (review) => review.deviceId === record.deviceId,
      ),
      today,
    }));
  const published = [];
  for (const result of processed) {
    await writeFile(
      join(publishedRoot, result.published.outputFile),
      result.outputBytes,
    );
    published.push(result.published);
    console.log(
      `${result.published.deviceId}: ${result.published.byteLength} bytes, `
      + `${result.published.triangleCount} triangles`,
    );
  }

  const totalByteLength = published.reduce(
    (total, asset) => total + asset.byteLength,
    0,
  );
  if (totalByteLength > TOTAL_BUDGET_BYTES) {
    throw new Error(
      `museum assets: ${totalByteLength} bytes exceeds ${TOTAL_BUDGET_BYTES}`,
    );
  }
  const manifest = {
    schemaVersion: 1,
    generatedFrom: 'assets/museum/sources.json',
    downloadedAt: catalog.downloadedAt,
    totalByteLength,
    assets: published,
  };
  const manifestErrors = validatePublishedManifest(manifest);
  if (manifestErrors.length) throw new Error(manifestErrors.join('\n'));
  await writeFile(
    join(publishedRoot, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  await mkdir(dirname(generatedRecordsPath), { recursive: true });
  await writeFile(generatedRecordsPath, generatedRegistrySource(published));
  return manifest;
}

async function main() {
  const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const catalog = JSON.parse(await readFile(
    join(projectRoot, 'assets/museum/sources.json'),
    'utf8',
  ));
  const rightsReview = JSON.parse(await readFile(
    join(projectRoot, 'assets/museum/review/rights-review.json'),
    'utf8',
  ));
  const manifest = await processMuseumAssets({
    catalog,
    rightsReviewReceipt: rightsReview,
    contactSheetBytes: await readFile(
      join(projectRoot, 'assets/museum/review/contact-sheet.png'),
    ),
    rawRoot: join(projectRoot, '.cache/museum-assets/raw'),
    publishedRoot: join(projectRoot, 'assets/museum'),
    generatedRecordsPath: join(
      projectRoot,
      'src/museum/generated-asset-records.js',
    ),
  });
  console.log(
    `museum assets: ${manifest.assets.length} published, `
    + `${manifest.totalByteLength} bytes total`,
  );
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
```

发布顺序是不可放宽的两阶段事务：先只生成 `{ outputBytes, outputSha256, metrics }`
候选，不含任何 approved/trademark/date 字段；再用 contact-sheet SHA 与
candidate-set SHA 验证完整回执；最后 `publishReviewedCandidate` 只能使用
`verifyRightsReview()` 的返回值派生
`trademarkRemoved/reviewStatus/reviewedOn/reviewNotes`。禁止从 `sources.json`
复制这四项，也禁止保留 `verifyReview: false` 之类可产出“未审先批” manifest
的旁路。

在 `package.json` 的 `scripts` 增加：

```json
{
  "assets:review": "node scripts/assets/render-contact-sheet.mjs",
  "assets:build": "node scripts/assets/process-museum-assets.mjs",
  "assets:refresh": "npm run assets:fetch && npm run assets:generate && npm run assets:build"
}
```

运行 `npm install --package-lock-only` 更新锁文件。

- [ ] **步骤 4：先生成候选审查包，再发布八个资产**

第一次执行：

```bash
npm test -- tests/unit/process-museum-assets.test.js \
  tests/unit/asset-rights-review.test.js
npm run assets:fetch
npm run assets:generate
npm run assets:review
```

预期：两个测试文件合计输出 `2 passed`；审查命令生成 8×4 contact sheet 和全部检查为 false 的回执草稿。人工核对并批准八项后运行：

```bash
npm run assets:build
```

预期：未批准、回执 schema 多/少字段、重复设备 ID、contact sheet 或候选哈希漂移、reviewer/notes 含首尾空格、非法或未来日期时失败；批准后逐项输出八个设备的 bytes 与 triangles，最后输出 `museum assets: 8 published`，并生成八个 GLB、`assets/museum/manifest.json` 和 `src/museum/generated-asset-records.js`。`verify:assets` 要到任务 6 才创建，因此本任务不得提前调用。

- [ ] **步骤 5：提交发布产物**

```bash
git add package.json package-lock.json scripts/assets/process-museum-assets.mjs \
  tests/unit/process-museum-assets.test.js tests/unit/asset-rights-review.test.js \
  assets/museum/review assets/museum/manifest.json assets/museum/models \
  src/museum/generated-asset-records.js
git commit -m "feat(assets): publish eight audited museum models"
```

## 任务 6：把发布清单、文件和注册表纳入同一门禁

**文件：**

- 修改：`package.json`
- 修改：`package-lock.json`
- 修改：`src/museum/device-registry.js`
- 修改：`src/museum/registry-validator.js`
- 修改：`tests/unit/device-registry.test.js`
- 创建：`scripts/verify-museum-assets.mjs`
- 创建：`tests/unit/verify-museum-assets.test.js`

- [ ] **步骤 1：编写失败的发布门禁测试**

创建 `tests/unit/verify-museum-assets.test.js`：

```js
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ASSET_RECORDS_BY_DEVICE } from '../../src/museum/generated-asset-records.js';
import {
  verifyAssetLayerConsistency,
  verifyMuseumAssets,
  verifyPinnedSourceInputs,
  verifyReviewDerivedFields,
} from '../../scripts/verify-museum-assets.mjs';

const catalog = JSON.parse(readFileSync(new URL(
  '../../assets/museum/sources.json',
  import.meta.url,
), 'utf8'));
const manifest = JSON.parse(readFileSync(new URL(
  '../../assets/museum/manifest.json',
  import.meta.url,
), 'utf8'));
const rightsReview = JSON.parse(readFileSync(new URL(
  '../../assets/museum/review/rights-review.json',
  import.meta.url,
), 'utf8'));

describe('museum asset release gate', () => {
  it('verifies eight approved files inside the four MiB budget', async () => {
    const report = await verifyMuseumAssets({
      publishedRoot: new URL('../../assets/museum/', import.meta.url),
    });
    expect(report.assetCount).toBe(8);
    expect(report.totalByteLength).toBeLessThanOrEqual(4 * 1024 * 1024);
  });

  it('rehashes both frozen upstream inputs from non-public paths', async () => {
    expect(await verifyPinnedSourceInputs({
      catalog,
      projectRoot: new URL('../../', import.meta.url),
    })).toEqual([]);
    const changed = structuredClone(catalog);
    changed.assets[0].input.sha256 = '0'.repeat(64);
    expect(await verifyPinnedSourceInputs({
      catalog: changed,
      projectRoot: new URL('../../', import.meta.url),
    })).toContain('pocket-play: frozen source SHA-256 mismatch');
  });

  it('rejects drift between catalog, manifest and generated registry', () => {
    expect(verifyAssetLayerConsistency({
      catalog,
      manifest,
      generatedRecords: ASSET_RECORDS_BY_DEVICE,
    })).toEqual([]);
    const changed = structuredClone(ASSET_RECORDS_BY_DEVICE);
    changed['pocket-play'].creator = 'Different creator';
    expect(verifyAssetLayerConsistency({
      catalog,
      manifest,
      generatedRecords: changed,
    })).toContain('pocket-play: generated registry differs from manifest');
  });

  it('keeps source review claims pending and derives publication from receipt', () => {
    expect(catalog.assets.every((asset) =>
      asset.trademarkRemoved === null
      && asset.reviewStatus === 'pending'
      && asset.reviewedOn === null)).toBe(true);
    expect(verifyReviewDerivedFields({
      manifest,
      receipt: rightsReview,
    })).toEqual([]);
    const changed = structuredClone(manifest);
    changed.assets[0].reviewedOn = '1999-01-01';
    expect(verifyReviewDerivedFields({
      manifest: changed,
      receipt: rightsReview,
    })).toContain('pocket-play: review-derived manifest fields differ from receipt');
  });
});
```

并在 `tests/unit/device-registry.test.js` 增加：

```js
it('promotes all eight exhibits to approved, hashed model records', () => {
  expect(DEVICE_REGISTRY.every((record) =>
    record.modelUrl
    && record.reviewStatus === 'approved'
    && record.trademarkRemoved
    && /^[a-f0-9]{64}$/.test(record.originalSha256)
    && /^[a-f0-9]{64}$/.test(record.outputSha256))).toBe(true);
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：`npm test -- tests/unit/verify-museum-assets.test.js tests/unit/device-registry.test.js`

预期：FAIL；前者缺少 `verify-museum-assets.mjs`，后者仍读到阶段 1 的 `pending` 记录。

- [ ] **步骤 3：实现静态门禁并提升注册表**

创建 `scripts/verify-museum-assets.mjs`：

```js
import { lstat, readdir, readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join, resolve } from 'node:path';
import {
  validatePublishedManifest,
  validateSourceCatalog,
} from '../src/museum/asset-policy.js';
import { ASSET_RECORDS_BY_DEVICE } from '../src/museum/generated-asset-records.js';
import { inspectGlb } from './assets/glb-metrics.mjs';
import { sha256Hex } from './assets/fetch-museum-assets.mjs';
import {
  verifyRightsReviewReceipt,
} from './assets/process-museum-assets.mjs';

const TOTAL_BUDGET = 4 * 1024 * 1024;
const asPath = (value) => value instanceof URL ? fileURLToPath(value) : value;
const FROZEN_INPUT_ROOT = 'assets/museum/upstream/';
const FROZEN_INPUT_BY_DEVICE = Object.freeze({
  'pocket-play': `${FROZEN_INPUT_ROOT}pocket-play-game-boy.glb`,
  'pocket-care': `${FROZEN_INPUT_ROOT}pocket-care-device.js`,
});

const SOURCE_BOUND_FIELDS = Object.freeze([
  'assetId',
  'deviceId',
  'title',
  'creator',
  'sourceUrl',
  'license',
  'licenseUrl',
  'modifications',
  'maxBytes',
  'maxTriangles',
  'presentation',
]);
// trademarkRemoved/reviewStatus/reviewedOn/reviewNotes are intentionally absent:
// they must match rights-review.json, never sources.json.

export async function verifyPinnedSourceInputs({
  catalog,
  projectRoot = process.cwd(),
}) {
  const root = asPath(projectRoot);
  const errors = [];
  for (const record of catalog.assets || []) {
    if (!['local', 'generated'].includes(record.input?.kind)) continue;
    const relativePath = record.input.kind === 'local'
      ? record.input.path
      : record.input.sourcePath;
    if (relativePath !== FROZEN_INPUT_BY_DEVICE[record.deviceId]) {
      errors.push(`${record.deviceId}: frozen source path is not the approved input`);
      continue;
    }
    try {
      const fullPath = resolve(root, relativePath);
      if ((await lstat(fullPath)).isSymbolicLink()) {
        errors.push(`${record.deviceId}: frozen source must not be a symlink`);
        continue;
      }
      const bytes = await readFile(fullPath);
      if (sha256Hex(bytes) !== record.input.sha256) {
        errors.push(`${record.deviceId}: frozen source SHA-256 mismatch`);
      }
    } catch {
      errors.push(`${record.deviceId}: frozen source is missing`);
    }
  }
  return errors;
}

export function verifyReviewDerivedFields({ manifest, receipt }) {
  const errors = [];
  for (const published of manifest.assets || []) {
    const review = receipt.reviews?.find(
      (item) => item.deviceId === published.deviceId,
    );
    if (!review
      || published.trademarkRemoved !== true
      || published.reviewStatus !== 'approved'
      || published.reviewedOn !== review.reviewedOn
      || JSON.stringify(published.reviewNotes) !== JSON.stringify(review.notes)) {
      errors.push(
        `${published.deviceId}: review-derived manifest fields differ from receipt`,
      );
    }
  }
  return errors;
}

export function verifyAssetLayerConsistency({
  catalog,
  manifest,
  generatedRecords,
}) {
  const errors = [];
  const sourceIds = catalog.assets.map((asset) => asset.deviceId);
  const manifestIds = manifest.assets.map((asset) => asset.deviceId);
  if (sourceIds.length !== 8
    || new Set(sourceIds).size !== 8
    || JSON.stringify(manifestIds) !== JSON.stringify(sourceIds)) {
    errors.push('asset layers: ordered device IDs must match the eight-source catalog');
  }
  if (manifest.generatedFrom !== 'assets/museum/sources.json'
    || manifest.downloadedAt !== catalog.downloadedAt) {
    errors.push('asset layers: manifest provenance differs from source catalog');
  }
  for (const source of catalog.assets) {
    const published = manifest.assets.find(
      (asset) => asset.deviceId === source.deviceId,
    );
    if (!published) {
      errors.push(`${source.deviceId}: missing from manifest`);
      continue;
    }
    for (const field of SOURCE_BOUND_FIELDS) {
      if (JSON.stringify(published[field]) !== JSON.stringify(source[field])) {
        errors.push(`${source.deviceId}: ${field} differs from source catalog`);
      }
    }
    if (published.downloadedAt !== catalog.downloadedAt
      || published.originalSha256 !== source.input.sha256
      || published.outputFile !== `models/${source.deviceId}.glb`
      || published.modelUrl !== `./museum/models/${source.deviceId}.glb`) {
      errors.push(`${source.deviceId}: derived manifest fields are inconsistent`);
    }
    const generated = generatedRecords[source.deviceId];
    const expectedGenerated = Object.fromEntries(
      Object.entries(published).filter(([key]) => key !== 'deviceId'),
    );
    if (JSON.stringify(generated) !== JSON.stringify(expectedGenerated)) {
      errors.push(`${source.deviceId}: generated registry differs from manifest`);
    }
  }
  if (Object.keys(generatedRecords).length !== 8) {
    errors.push('asset layers: generated registry must contain exactly 8 records');
  }
  return errors;
}

export async function verifyMuseumAssets({
  publishedRoot,
  generatedRecords = ASSET_RECORDS_BY_DEVICE,
  sourceProjectRoot = process.cwd(),
}) {
  const root = asPath(publishedRoot);
  const catalog = JSON.parse(await readFile(join(root, 'sources.json'), 'utf8'));
  const manifest = JSON.parse(await readFile(join(root, 'manifest.json'), 'utf8'));
  const rightsReview = JSON.parse(await readFile(
    join(root, 'review/rights-review.json'),
    'utf8',
  ));
  const contactSheetBytes = await readFile(join(root, 'review/contact-sheet.png'));
  const policyErrors = [
    ...validateSourceCatalog(catalog),
    ...validatePublishedManifest(manifest),
    ...verifyAssetLayerConsistency({
      catalog,
      manifest,
      generatedRecords,
    }),
    ...verifyReviewDerivedFields({
      manifest,
      receipt: rightsReview,
    }),
    ...await verifyPinnedSourceInputs({
      catalog,
      projectRoot: sourceProjectRoot,
    }),
  ];
  if (policyErrors.length) throw new Error(policyErrors.join('\n'));
  verifyRightsReviewReceipt({
    catalog,
    candidates: manifest.assets.map(({ deviceId, outputSha256 }) => ({
      deviceId,
      outputSha256,
    })),
    receipt: rightsReview,
    contactSheetBytes,
  });
  const expectedFiles = manifest.assets.map((asset) => asset.outputFile.slice(7)).sort();
  const actualFiles = (await readdir(join(root, 'models')))
    .filter((name) => name.endsWith('.glb'))
    .sort();
  if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) {
    throw new Error('models directory does not exactly match manifest');
  }

  let totalByteLength = 0;
  for (const asset of manifest.assets) {
    const bytes = await readFile(join(root, asset.outputFile));
    const metrics = inspectGlb(bytes);
    if (sha256Hex(bytes) !== asset.outputSha256) {
      throw new Error(`${asset.deviceId}: output SHA-256 mismatch`);
    }
    if (metrics.byteLength !== asset.byteLength
      || metrics.byteLength > asset.maxBytes
      || metrics.triangleCount !== asset.triangleCount
      || metrics.triangleCount > asset.maxTriangles
      || metrics.imageCount !== 0
      || metrics.textureCount !== 0
      || metrics.animationCount !== 0) {
      throw new Error(`${asset.deviceId}: metrics do not match approved manifest`);
    }
    totalByteLength += metrics.byteLength;
  }
  if (totalByteLength !== manifest.totalByteLength || totalByteLength > TOTAL_BUDGET) {
    throw new Error('museum asset total exceeds or disagrees with manifest');
  }
  return { assetCount: manifest.assets.length, totalByteLength };
}

async function main() {
  const rootArg = process.argv.indexOf('--root');
  const publishedRoot = rootArg >= 0
    ? resolve(process.argv[rootArg + 1])
    : resolve('assets/museum');
  const report = await verifyMuseumAssets({ publishedRoot });
  console.log(
    `museum assets verified: ${report.assetCount} assets, `
    + `${report.totalByteLength} bytes`,
  );
}

if (process.argv[1]
  && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
```

在 `src/museum/device-registry.js` 顶部导入：

```js
import { ASSET_RECORDS_BY_DEVICE } from './generated-asset-records.js';
```

把阶段 1 映射函数中的十个资产默认字段替换为生成记录：

```text
const asset = ASSET_RECORDS_BY_DEVICE[id];
return Object.freeze({
  id,
  exhibitNumber,
  name,
  year,
  status,
  azimuth,
  icon,
  ...asset,
  runtimeUrl,
  runtimeCapabilities,
  interactionHint: status === 'live' ? 'Enter to play' : 'Archive opening soon',
});
```

在 `src/museum/registry-validator.js` 的循环中加入：

```js
if (!record.modelUrl || record.reviewStatus !== 'approved') {
  errors.push(`${record.id}: museum asset must be approved`);
}
if (record.trademarkRemoved !== true) {
  errors.push(`${record.id}: trademarkRemoved must be true`);
}
```

在 `package.json` 的 `scripts` 增加：

```json
{
  "verify:assets": "node scripts/verify-museum-assets.mjs"
}
```

运行 `npm install --package-lock-only` 更新锁文件。

- [ ] **步骤 4：运行测试与资产门禁**

运行：

```bash
npm test -- tests/unit/verify-museum-assets.test.js tests/unit/device-registry.test.js
npm run verify:assets
```

预期：全部 PASS；命令输出 `museum assets verified: 8 assets`。

- [ ] **步骤 5：提交门禁和注册表提升**

```bash
git add package.json package-lock.json src/museum/device-registry.js src/museum/registry-validator.js tests/unit/device-registry.test.js scripts/verify-museum-assets.mjs tests/unit/verify-museum-assets.test.js
git commit -m "feat(registry): require eight verified museum assets"
```

## 任务 7：实现浏览器端 AssetResolver 的许可、哈希和解析降级

**文件：**

- 创建：`src/museum/asset-resolver.js`
- 创建：`src/museum/create-glb-parser.js`
- 创建：`tests/unit/asset-resolver.test.js`

- [ ] **步骤 1：编写失败的 AssetResolver 测试**

创建 `tests/unit/asset-resolver.test.js`：

```js
import { expect, it, vi } from 'vitest';
import { createAssetResolver } from '../../src/museum/asset-resolver.js';

const approved = {
  assetId: 'approved-shell',
  deviceId: 'approved',
  title: 'Approved',
  creator: 'Author',
  sourceUrl: 'https://example.test/source',
  license: 'CC BY 3.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
  downloadedAt: '2026-07-24',
  originalSha256: 'a'.repeat(64),
  modifications: ['Removed source expression'],
  outputFile: 'models/approved.glb',
  modelUrl: './museum/models/approved.glb',
  outputSha256: 'b'.repeat(64),
  byteLength: 4,
  triangleCount: 1,
  maxBytes: 8,
  maxTriangles: 10,
  trademarkRemoved: true,
  reviewStatus: 'approved',
  presentation: { maxSpan: 2, yawDegrees: 0, lift: 0 },
};

it('loads verified bytes but fails closed for rights, HTTP and hash errors', async () => {
  const object3D = { name: 'model' };
  const fetchImpl = vi.fn(async () => new Response(new Uint8Array([1, 2, 3, 4])));
  const resolver = createAssetResolver({
    manifest: { assets: [approved] },
    fetchImpl,
    digestSha256: async () => 'b'.repeat(64),
    parseGlb: async () => object3D,
    baseUrl: 'https://gamex.test/',
  });
  await expect(resolver.resolve('approved')).resolves.toMatchObject({
    state: 'ready',
    object3D,
  });

  const pending = { ...approved, deviceId: 'pending', reviewStatus: 'pending' };
  const pendingResolver = createAssetResolver({
    manifest: { assets: [pending] },
    fetchImpl,
    digestSha256: async () => 'b'.repeat(64),
    parseGlb: async () => object3D,
    baseUrl: 'https://gamex.test/',
  });
  await expect(pendingResolver.resolve('pending')).resolves.toMatchObject({
    state: 'fallback',
    reason: 'rights-invalid',
  });

  const notFound = createAssetResolver({
    manifest: { assets: [approved] },
    fetchImpl: async () => new Response('', { status: 404 }),
    digestSha256: async () => 'b'.repeat(64),
    parseGlb: async () => object3D,
    baseUrl: 'https://gamex.test/',
  });
  await expect(notFound.resolve('approved')).resolves.toMatchObject({
    state: 'fallback',
    reason: 'http-error',
  });

  const changed = createAssetResolver({
    manifest: { assets: [approved] },
    fetchImpl,
    digestSha256: async () => 'c'.repeat(64),
    parseGlb: async () => object3D,
    baseUrl: 'https://gamex.test/',
  });
  await expect(changed.resolve('approved')).resolves.toMatchObject({
    state: 'fallback',
    reason: 'hash-mismatch',
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：`npm test -- tests/unit/asset-resolver.test.js`

预期：FAIL，错误包含 `Failed to resolve import "../../src/museum/asset-resolver.js"`。

- [ ] **步骤 3：实现 AssetResolver 与 Meshopt GLB 解析器**

创建 `src/museum/asset-resolver.js`：

```js
import { validatePublishedAsset } from './asset-policy.js';

export async function sha256ArrayBuffer(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

export function createAssetResolver({
  manifest,
  fetchImpl = fetch,
  digestSha256 = sha256ArrayBuffer,
  parseGlb,
  baseUrl = document.baseURI,
}) {
  const byDevice = new Map(
    (manifest?.assets || []).map((asset) => [asset.deviceId, asset]),
  );
  return {
    async resolve(deviceId) {
      const asset = byDevice.get(deviceId);
      if (!asset || validatePublishedAsset(asset).length) {
        return { state: 'fallback', reason: 'rights-invalid', asset };
      }
      try {
        const response = await fetchImpl(new URL(asset.modelUrl, baseUrl));
        if (!response.ok) return { state: 'fallback', reason: 'http-error', asset };
        const buffer = await response.arrayBuffer();
        if (buffer.byteLength !== asset.byteLength
          || buffer.byteLength > asset.maxBytes) {
          return { state: 'fallback', reason: 'budget-error', asset };
        }
        if (await digestSha256(buffer) !== asset.outputSha256) {
          return { state: 'fallback', reason: 'hash-mismatch', asset };
        }
        const object3D = await parseGlb(buffer, asset);
        return { state: 'ready', object3D, asset };
      } catch (error) {
        return {
          state: 'fallback',
          reason: 'decode-error',
          asset,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  };
}
```

创建 `src/museum/create-glb-parser.js`：

```js
import { Box3, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

export function createGlbParser() {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  return (buffer, asset) => new Promise((resolve, reject) => {
    loader.parse(buffer, '', (gltf) => {
      const root = gltf.scene;
      const bounds = new Box3().setFromObject(root);
      const size = bounds.getSize(new Vector3());
      const center = bounds.getCenter(new Vector3());
      const span = Math.max(size.x, size.y, size.z);
      if (!Number.isFinite(span) || span <= 0) {
        reject(new Error(`${asset.deviceId}: empty GLB bounds`));
        return;
      }
      root.scale.setScalar(asset.presentation.maxSpan / span);
      root.position.set(
        -center.x * root.scale.x,
        -bounds.min.y * root.scale.y + asset.presentation.lift,
        -center.z * root.scale.z,
      );
      root.rotation.y = asset.presentation.yawDegrees * Math.PI / 180;
      root.userData.assetId = asset.assetId;
      resolve(root);
    }, reject);
  });
}
```

- [ ] **步骤 4：运行测试验证通过**

运行：`npm test -- tests/unit/asset-resolver.test.js`

预期：PASS，输出 `1 passed`。

- [ ] **步骤 5：提交运行时解析门禁**

```bash
git add src/museum/asset-resolver.js src/museum/create-glb-parser.js tests/unit/asset-resolver.test.js
git commit -m "feat(assets): resolve verified GLBs with safe fallback"
```

## 任务 8：让八项模型独立水合并保留玻璃替身

**文件：**

- 修改：`src/museum/create-museum-scene.js`
- 修改：`src/museum/create-museum-app.js`
- 创建：`src/museum/hydrate-museum-assets.js`
- 创建：`tests/unit/hydrate-museum-assets.test.js`

- [ ] **步骤 1：编写失败的独立水合测试**

创建 `tests/unit/hydrate-museum-assets.test.js`：

```js
import { expect, it, vi } from 'vitest';
import { hydrateMuseumAssets } from '../../src/museum/hydrate-museum-assets.js';

it('mounts successful models and leaves each failed exhibit on its own fallback', async () => {
  const scene = {
    replaceExhibitModel: vi.fn(),
    setExhibitAssetState: vi.fn(),
  };
  const resolver = {
    resolve: vi.fn(async (id) => id === 'good'
      ? { state: 'ready', object3D: { id } }
      : { state: 'fallback', reason: 'http-error' }),
  };
  const onState = vi.fn();
  await hydrateMuseumAssets({
    records: [{ id: 'good' }, { id: 'bad' }],
    resolver,
    scene,
    onState,
  });
  expect(scene.replaceExhibitModel).toHaveBeenCalledTimes(1);
  expect(scene.setExhibitAssetState).toHaveBeenCalledWith(
    'bad',
    'fallback',
    'http-error',
  );
  expect(onState).toHaveBeenCalledWith('good', 'ready');
  expect(onState).toHaveBeenCalledWith('bad', 'fallback');
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：`npm test -- tests/unit/hydrate-museum-assets.test.js`

预期：FAIL，错误包含 `Failed to resolve import "../../src/museum/hydrate-museum-assets.js"`。

- [ ] **步骤 3：实现独立水合并扩展场景组合根**

创建 `src/museum/hydrate-museum-assets.js`：

```js
export async function hydrateMuseumAssets({
  records,
  resolver,
  scene,
  onState = () => {},
}) {
  await Promise.all(records.map(async (record) => {
    onState(record.id, 'loading');
    const result = await resolver.resolve(record.id);
    if (result.state === 'ready') {
      scene.replaceExhibitModel(record.id, result.object3D);
      scene.setExhibitAssetState(record.id, 'ready', '');
    } else {
      scene.setExhibitAssetState(record.id, 'fallback', result.reason);
    }
    onState(record.id, result.state);
  }));
}
```

在 `src/museum/create-museum-scene.js` 中复用阶段 01 已创建的 `exhibitSlots`；严禁重新声明 slot map、重新 new slot `Group` 或重新生成 proxy/screen anchor。每个稳定 entry 保持 `{ slot, visualRoot, placeholder, proxy, screenAnchor, model, state, reason }`，本阶段只增加淡入状态：

```js
const transitions = [];
const prepareFadeMaterials = (root) => root.traverse((node) => {
  if (!node.isMesh) return;
  const materials = Array.isArray(node.material) ? node.material : [node.material];
  node.material = materials.map((material) => material.clone());
});
const setOpacity = (root, opacity) => root.traverse((node) => {
  if (!node.isMesh) return;
  const materials = Array.isArray(node.material) ? node.material : [node.material];
  for (const material of materials) {
    material.transparent = opacity < 1;
    material.opacity = opacity;
  }
});
```

阶段 01 的 `layout.forEach` 已把稳定 `slot/proxy/screenAnchor/visualRoot` 加入 orbit；本阶段不得替换该循环或 slot map。初始化每项发布模型状态时，只补充既有 entry：

```js
const entry = exhibitSlots.get(records[index].id);
if (!entry) throw new Error(`${records[index].id}: phase-01 exhibit slot missing`);
entry.model = null;
entry.state = 'fallback';
entry.reason = 'loading';
```

把 `render` 改成接收时间并推进淡入：

```js
const render = (time = 0) => {
  if (!running) return;
  rafId = requestAnimationFrame(render);
  for (let index = transitions.length - 1; index >= 0; index -= 1) {
    const transition = transitions[index];
    const progress = Math.min(1, (time - transition.startedAt) / 260);
    setOpacity(transition.model, progress);
    setOpacity(transition.placeholder, 1 - progress);
    if (progress === 1) {
      transition.placeholder.visible = false;
      transitions.splice(index, 1);
    }
  }
  if (!paused) {
    core.rotation.z += 0.003;
    renderer.render(scene, camera);
  }
};
```

在场景返回对象中加入：

```text
replaceExhibitModel(id, model) {
  const entry = exhibitSlots.get(id);
  if (!entry) throw new Error(`${id}: exhibit slot missing`);
  if (entry.model) entry.visualRoot.remove(entry.model);
  entry.model = model;
  prepareFadeMaterials(model);
  prepareFadeMaterials(entry.placeholder);
  setOpacity(model, 0);
  entry.visualRoot.add(model);
  transitions.push({
    model,
    placeholder: entry.placeholder,
    startedAt: performance.now(),
  });
},
setExhibitAssetState(id, state, reason) {
  const entry = exhibitSlots.get(id);
  if (!entry) return;
  entry.state = state;
  entry.reason = reason;
  entry.slot.userData.assetState = state;
  entry.slot.userData.assetReason = reason;
},
```

`replaceExhibitModel` 只能修改 `entry.visualRoot` 下的 model/placeholder；不得 remove/reparent `entry.proxy`、`entry.screenAnchor` 或 `entry.slot`，不得把 GLB 加入 `proxyMeshes`，也不得改变阶段 01 的 `hitTestExhibit/focusExhibit/restoreOverview/getProjectedScreenRect` 闭包引用。

在 `src/museum/create-museum-app.js` 顶部加入：

```js
import { createAssetResolver } from './asset-resolver.js';
import { createGlbParser } from './create-glb-parser.js';
import { hydrateMuseumAssets } from './hydrate-museum-assets.js';
```

在组合根创建场景后加入以下状态与函数：

```js
const assetStates = new Map();
const setAssetState = (id, state) => {
  assetStates.set(id, state);
  const button = root.querySelector(`[data-exhibit-id="${id}"]`);
  if (button) button.dataset.assetState = state;
  const settled = [...assetStates.values()]
    .filter((value) => value === 'ready' || value === 'fallback').length;
  root.dataset.assetSettled = String(settled);
  root.dataset.assetFallbacks = String(
    [...assetStates.values()].filter((value) => value === 'fallback').length,
  );
};
const loadAssets = async () => {
  try {
    const response = await fetch(new URL('./museum/manifest.json', document.baseURI));
    if (!response.ok) throw new Error(`manifest HTTP ${response.status}`);
    const manifest = await response.json();
    const resolver = createAssetResolver({
      manifest,
      parseGlb: createGlbParser(),
    });
    await hydrateMuseumAssets({
      records,
      resolver,
      scene,
      onState: setAssetState,
    });
  } catch {
    for (const record of records) {
      scene.setExhibitAssetState(record.id, 'fallback', 'manifest-error');
      setAssetState(record.id, 'fallback');
    }
  }
};
```

把返回对象的 `start` 改为：

```text
start() {
  scene.start();
  void loadAssets();
},
```

- [ ] 扩展 `tests/unit/hydrate-museum-assets.test.js`（或同 Task 的真实 scene fixture）：水合前保存 Pocket Play/Pocket Care 的 slot、proxy 与 screen-anchor object identity；分别执行成功替换与 resolver fallback 后，断言三者仍为严格同一对象。成功模型的 `raycast` 设为一旦调用即抛错，随后真实 `hitTestExhibit` 仍只命中原 proxy；两个设备的 `focusExhibit → getProjectedScreenRect → restoreOverview` 在成功/失败水合后都继续通过。测试同时断言 model 只成为原 `visualRoot` child，失败项仍保留 placeholder。

- [ ] **步骤 4：运行单元测试和 production build**

运行：

```bash
npm test -- tests/unit/hydrate-museum-assets.test.js
npm run build
```

预期：测试 PASS；构建退出状态 0，未出现未处理 Promise rejection。

- [ ] **步骤 5：提交场景水合**

```bash
git add src/museum/create-museum-scene.js src/museum/create-museum-app.js src/museum/hydrate-museum-assets.js tests/unit/hydrate-museum-assets.test.js
git commit -m "feat(scene): hydrate eight models without losing fallbacks"
```

## 任务 9：让六个 Coming Soon 各自具有可辨识微交互

**文件：**

- 创建：`src/museum/coming-soon-motion.js`
- 创建：`src/museum/create-coming-soon-overlay.js`
- 修改：`src/museum/create-museum-scene.js`
- 创建：`tests/unit/coming-soon-motion.test.js`

- [ ] **步骤 1：编写六类动作与减少动态的失败测试**

创建 `tests/unit/coming-soon-motion.test.js`：

```js
import { expect, it } from 'vitest';
import { sampleComingSoonMotion } from '../../src/museum/coming-soon-motion.js';
import { createComingSoonOverlay } from '../../src/museum/create-coming-soon-overlay.js';

it('gives every coming-soon exhibit its own deterministic motion signature', () => {
  expect(sampleComingSoonMotion('learning-computer', 0.6)).toHaveProperty('keyWave');
  expect(sampleComingSoonMotion('home-console', 0.6)).toHaveProperty('doorAngle');
  expect(sampleComingSoonMotion('wide-handheld', 0.6)).toHaveProperty('scanY');
  expect(sampleComingSoonMotion('dual-lcd-pocket', 0.6)).toHaveProperty('lidAngle');
  expect(sampleComingSoonMotion('block-handheld', 0.6)).toHaveProperty('matrixPhase');
  expect(sampleComingSoonMotion('arcade-terminal', 0.6)).toHaveProperty('joystickTilt');
});

it('returns a still, readable pose when reduced motion is enabled', () => {
  expect(sampleComingSoonMotion('dual-lcd-pocket', 12, true)).toEqual({
    lidAngle: 0.68,
    topGlyph: 1,
    bottomGlyph: 2,
  });
  expect(sampleComingSoonMotion('arcade-terminal', 12, true)).toEqual({
    joystickTilt: 0,
    attractFrame: 1,
  });
});

it('gives future synthetic records a generic non-throwing overlay and motion', () => {
  for (const id of ['synthetic-9', 'synthetic-10']) {
    expect(sampleComingSoonMotion(id, 0.6)).toHaveProperty('genericPulse');
    const overlay = createComingSoonOverlay({
      id,
      status: 'coming-soon',
      icon: 'generic',
    });
    expect(overlay.root.userData.exhibitId).toBe(id);
    expect(() => overlay.update(sampleComingSoonMotion(id, 0.6))).not.toThrow();
    overlay.dispose();
  }
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：`npm test -- tests/unit/coming-soon-motion.test.js`

预期：FAIL，错误包含 `Failed to resolve import "../../src/museum/coming-soon-motion.js"`。

- [ ] **步骤 3：实现纯动作采样器**

创建 `src/museum/coming-soon-motion.js`：

```js
const wave = (seconds, speed = 1) =>
  (Math.sin(seconds * speed * Math.PI * 2) + 1) / 2;

export function sampleComingSoonMotion(id, seconds, reducedMotion = false) {
  if (id === 'learning-computer') {
    return {
      keyWave: reducedMotion ? 0.55 : wave(seconds, 0.32),
      cardLift: reducedMotion ? 0.08 : wave(seconds, 0.18) * 0.16,
    };
  }
  if (id === 'home-console') {
    return {
      doorAngle: reducedMotion ? 0.18 : wave(seconds, 0.14) * 0.42,
      controllerPulse: reducedMotion ? 0.65 : wave(seconds, 0.45),
    };
  }
  if (id === 'wide-handheld') {
    return {
      scanY: reducedMotion ? 0.5 : seconds * 0.24 % 1,
      stickTilt: reducedMotion ? 0 : Math.sin(seconds * 1.7) * 0.08,
    };
  }
  if (id === 'dual-lcd-pocket') {
    return reducedMotion
      ? { lidAngle: 0.68, topGlyph: 1, bottomGlyph: 2 }
      : {
        lidAngle: 0.52 + wave(seconds, 0.12) * 0.34,
        topGlyph: Math.floor(seconds) % 4,
        bottomGlyph: (Math.floor(seconds) + 2) % 4,
      };
  }
  if (id === 'block-handheld') {
    return { matrixPhase: reducedMotion ? 1 : Math.floor(seconds * 2) % 4 };
  }
  if (id === 'arcade-terminal') {
    return reducedMotion
      ? { joystickTilt: 0, attractFrame: 1 }
      : {
        joystickTilt: Math.sin(seconds * 1.4) * 0.12,
        attractFrame: Math.floor(seconds * 3) % 6,
      };
  }
  return { genericPulse: reducedMotion ? 0.6 : wave(seconds, 0.2) };
}
```

- [ ] **步骤 4：创建原创叠层并接入场景循环**

`createComingSoonOverlay(record)` 只使用 Three.js 基础几何与 `CanvasTexture`，按 `record.id` 返回 `{ root, update(sample), dispose() }`：

- `learning-computer`：12 个无字母键帽灯和一张透明学习卡；`keyWave` 逐列点亮，`cardLift` 控制卡片高度。
- `home-console`：无标志仓门与两枚抽象圆环控制器；应用 `doorAngle/controllerPulse`。
- `wide-handheld`：原创网格屏幕扫描线和非对称摇杆；应用 `scanY/stickTilt`。
- `dual-lcd-pocket`：自制铰链、上下两张 16×12 段码 `CanvasTexture`；应用 `lidAngle/topGlyph/bottomGlyph`。
- `block-handheld`：10×16 点阵把 `COMING SOON` 的六个自制 5×7 字形分四阶段重组。
- `arcade-terminal`：无商标摇杆与原创三色几何吸引画面；应用 `joystickTilt/attractFrame`。

叠层材质只使用 `#d9ff57`、`#7de7ff`、`#9a86ff` 与深灰；Canvas 固定最大 256×256，不引用下载图片、厂商字形或游戏画面。

创建 `src/museum/create-coming-soon-overlay.js` 的实际结构如下；每个 builder 返回 update 所需的命名部件，不允许通过节点名称猜测：

```js
import {
  BoxGeometry, CanvasTexture, CircleGeometry, DoubleSide, Group,
  Mesh, MeshBasicMaterial, PlaneGeometry,
} from 'three';

const COLORS = ['#d9ff57', '#7de7ff', '#9a86ff'];
const material = (color, options = {}) =>
  new MeshBasicMaterial({ color, transparent: true, opacity: 0.88, ...options });
const box = (size, color) =>
  new Mesh(new BoxGeometry(...size), material(color));
const plane = (size, color) =>
  new Mesh(new PlaneGeometry(...size), material(color, { side: DoubleSide }));

function panelTexture(seed) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  context.fillStyle = '#202427';
  context.fillRect(0, 0, 64, 64);
  for (let index = 0; index < 16; index += 1) {
    context.fillStyle = COLORS[(index + seed) % COLORS.length];
    context.fillRect(6 + index % 4 * 14, 6 + Math.floor(index / 4) * 14, 8, 8);
  }
  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const BUILDERS = {
  'learning-computer': (root) => {
    const keys = Array.from({ length: 12 }, (_, index) => {
      const key = box([0.14, 0.04, 0.12], '#7de7ff');
      key.position.set((index % 6 - 2.5) * 0.17, 0, Math.floor(index / 6) * 0.17);
      root.add(key);
      return key;
    });
    const card = plane([0.7, 0.34], '#9a86ff');
    card.rotation.x = -Math.PI / 2;
    card.position.z = -0.22;
    root.add(card);
    return { keys, card };
  },
  'home-console': (root) => {
    const door = plane([0.72, 0.34], '#d9ff57');
    door.position.y = 0.18;
    root.add(door);
    const rings = [-1, 1].map((side) => {
      const ring = new Mesh(
        new CircleGeometry(0.12, 24),
        material(side < 0 ? '#7de7ff' : '#9a86ff'),
      );
      ring.position.set(side * 0.32, -0.2, 0);
      root.add(ring);
      return ring;
    });
    return { door, rings };
  },
  'wide-handheld': (root) => {
    const screen = plane([0.9, 0.42], '#202427');
    const scan = plane([0.82, 0.02], '#7de7ff');
    scan.position.z = 0.01;
    const stick = box([0.12, 0.12, 0.08], '#d9ff57');
    stick.position.set(-0.58, -0.06, 0.04);
    root.add(screen, scan, stick);
    return { scan, stick };
  },
  'dual-lcd-pocket': (root) => {
    const lower = plane([0.62, 0.42], '#202427');
    lower.material.map = panelTexture(2);
    const lid = new Group();
    const upper = plane([0.62, 0.42], '#202427');
    upper.material.map = panelTexture(0);
    upper.position.y = 0.22;
    lid.position.y = 0.22;
    lid.add(upper);
    root.add(lower, lid);
    return { lid, upper, lower };
  },
  'block-handheld': (root) => {
    const cells = Array.from({ length: 40 }, (_, index) => {
      const cell = box([0.045, 0.045, 0.025], COLORS[index % 3]);
      cell.position.set((index % 8 - 3.5) * 0.06, (Math.floor(index / 8) - 2) * 0.06, 0);
      root.add(cell);
      return cell;
    });
    return { cells };
  },
  'arcade-terminal': (root) => {
    const screen = plane([0.64, 0.46], '#202427');
    screen.material.map = panelTexture(1);
    const joystick = box([0.08, 0.3, 0.08], '#d9ff57');
    joystick.position.set(-0.3, -0.36, 0);
    root.add(screen, joystick);
    return { joystick, screen };
  },
};

const UPDATERS = {
  'learning-computer': ({ keys, card }, value) => {
    keys.forEach((key, index) => {
      key.material.opacity = index / keys.length <= value.keyWave ? 1 : 0.3;
    });
    card.position.y = value.cardLift;
  },
  'home-console': ({ door, rings }, value) => {
    door.rotation.x = value.doorAngle;
    rings.forEach((ring) => { ring.scale.setScalar(0.85 + value.controllerPulse * 0.2); });
  },
  'wide-handheld': ({ scan, stick }, value) => {
    scan.position.y = -0.18 + value.scanY * 0.36;
    stick.rotation.z = value.stickTilt;
  },
  'dual-lcd-pocket': ({ lid, upper, lower }, value) => {
    lid.rotation.x = -value.lidAngle;
    upper.material.opacity = 0.55 + value.topGlyph * 0.1;
    lower.material.opacity = 0.55 + value.bottomGlyph * 0.1;
  },
  'block-handheld': ({ cells }, value) => {
    cells.forEach((cell, index) => { cell.visible = index % 4 !== value.matrixPhase; });
  },
  'arcade-terminal': ({ joystick, screen }, value) => {
    joystick.rotation.z = value.joystickTilt;
    screen.material.opacity = 0.55 + value.attractFrame * 0.07;
  },
};

const buildGeneric = (root) => {
  const panel = plane([0.72, 0.46], '#202427');
  const signal = box([0.18, 0.18, 0.06], '#d9ff57');
  signal.position.z = 0.04;
  root.add(panel, signal);
  return { signal };
};
const updateGeneric = ({ signal }, value) => {
  signal.scale.setScalar(0.9 + value.genericPulse * 0.16);
};

export function createComingSoonOverlay(record) {
  const build = BUILDERS[record.id] ?? buildGeneric;
  const update = UPDATERS[record.id] ?? updateGeneric;
  const root = new Group();
  root.userData.exhibitId = record.id;
  const parts = build(root);
  return {
    root,
    update(sample) { update(parts, sample); },
    dispose() {
      root.traverse((object) => {
        object.geometry?.dispose();
        object.material?.map?.dispose();
        object.material?.dispose();
      });
      root.clear();
    },
  };
}
```

八个首发展位仍由 `sources.json/manifest/verify:assets` 固定执行 8/8 fail-closed；generic overlay/motion 只保证未来 `records.length > 8` 的 UI 原语不崩，不生成模型权利记录，也不得让第 9/10 项绕过正式资产审批或本轮发布计数门禁。

在 `create-museum-scene.js` 创建展位槽时遍历 `records.filter((record) => record.status === 'coming-soon')` 挂载叠层（首发数据恰为 6 个），禁止硬编码六个 ID 或长度；render loop 用同一个 elapsed seconds 调用：

```js
for (const [id, overlay] of comingSoonOverlays) {
  overlay.update(sampleComingSoonMotion(id, elapsedSeconds, reducedMotion));
}
```

场景公开 `setReducedMotion(value)` 并在 `dispose()` 调用每个叠层的 `dispose()`。

用 10 条 synthetic registry scene fixture（2 LIVE + 8 COMING SOON）断言产生 `records.length === 10` 个稳定 slot/proxy/anchor 和 8 个 overlay，`synthetic-9/synthetic-10` 均使用 generic builder/motion 且 render/update/dispose 不抛。该测试只证明 UI 原语扩展性；默认 registry、asset manifest 和比赛发布仍严格为 8 条。

- [ ] **步骤 5：运行测试、构建并提交**

```bash
npm test -- tests/unit/coming-soon-motion.test.js
npm run build
git add src/museum/coming-soon-motion.js src/museum/create-coming-soon-overlay.js \
  src/museum/create-museum-scene.js tests/unit/coming-soon-motion.test.js
git commit -m "feat(exhibits): animate six distinct future devices"
```

预期：测试 PASS；production build 通过；减少动态模式仍保留六种静态可辨识信息。

## 任务 10：复制离线资产并覆盖成功与 404 的浏览器路径

**文件：**

- 修改：`scripts/prepare-apps.mjs`
- 创建：`scripts/lib/copy-museum-assets.mjs`
- 创建：`tests/unit/copy-museum-assets.test.js`
- 创建：`tests/e2e/museum-assets.spec.js`

- [ ] **步骤 1：编写失败的复制与浏览器测试**

创建 `tests/unit/copy-museum-assets.test.js`：

```js
import { access, mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { copyMuseumAssets } from '../../scripts/lib/copy-museum-assets.mjs';

const roots = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map(
    (root) => rm(root, { recursive: true, force: true }),
  ));
});

it('copies the complete audit receipt and exactly eight GLBs', async () => {
  const root = await mkdtemp(join(tmpdir(), 'gamex-copy-assets-'));
  roots.push(root);
  const result = copyMuseumAssets({
    sourceRoot: new URL('../../assets/museum/', import.meta.url),
    targetRoot: join(root, 'museum'),
  });
  expect(result.assetCount).toBe(8);
  await expect(access(join(root, 'museum/manifest.json'))).resolves.toBeUndefined();
  await expect(access(join(root, 'museum/sources.json'))).resolves.toBeUndefined();
  await expect(access(
    join(root, 'museum/review/contact-sheet.png'),
  )).resolves.toBeUndefined();
  await expect(access(
    join(root, 'museum/review/rights-review.json'),
  )).resolves.toBeUndefined();
  expect((await readdir(join(root, 'museum'))).sort()).toEqual([
    'manifest.json',
    'models',
    'review',
    'sources.json',
  ]);
  await expect(access(join(root, 'museum/upstream'))).rejects.toThrow();
  expect((await readdir(join(root, 'museum/models')))
    .filter((name) => name.endsWith('.glb'))).toHaveLength(8);
});
```

创建 `tests/e2e/museum-assets.spec.js`：

```js
import { expect, test } from '@playwright/test';

test('settles all eight approved museum assets', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#app')).toHaveAttribute('data-asset-settled', '8');
  await expect(page.locator('[data-asset-state="ready"]')).toHaveCount(8);
  expect(errors).toEqual([]);
});

test('keeps one glass shell when its GLB returns 404', async ({ page }) => {
  await page.route('**/museum/models/home-console.glb', (route) =>
    route.fulfill({ status: 404, body: 'missing' }));
  await page.goto('/');
  await expect(page.locator('#app')).toHaveAttribute('data-asset-settled', '8');
  await expect(page.locator(
    '[data-exhibit-id="home-console"][data-asset-state="fallback"]',
  )).toHaveCount(1);
  await expect(page.locator('.museum-canvas')).toBeVisible();
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：`npm test -- tests/unit/copy-museum-assets.test.js`

预期：FAIL，错误包含 `Failed to resolve import "../../scripts/lib/copy-museum-assets.mjs"`。

- [ ] **步骤 3：实现只复制已发布资产的离线步骤**

创建 `scripts/lib/copy-museum-assets.mjs`：

```js
import { cpSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const asPath = (value) => value instanceof URL ? fileURLToPath(value) : value;

export function copyMuseumAssets({ sourceRoot, targetRoot }) {
  const source = asPath(sourceRoot);
  const manifest = JSON.parse(readFileSync(join(source, 'manifest.json'), 'utf8'));
  if (!Array.isArray(manifest.assets) || manifest.assets.length !== 8) {
    throw new Error('published museum manifest must contain exactly 8 assets');
  }
  const expectedModels = manifest.assets
    .map((asset) => asset.outputFile.slice('models/'.length))
    .sort();
  const actualModels = readdirSync(join(source, 'models'))
    .filter((name) => name.endsWith('.glb'))
    .sort();
  if (JSON.stringify(actualModels) !== JSON.stringify(expectedModels)) {
    throw new Error('source models must exactly match the published manifest');
  }
  mkdirSync(join(targetRoot, 'review'), { recursive: true });
  mkdirSync(join(targetRoot, 'models'), { recursive: true });
  cpSync(join(source, 'sources.json'), join(targetRoot, 'sources.json'));
  cpSync(join(source, 'manifest.json'), join(targetRoot, 'manifest.json'));
  for (const model of expectedModels) {
    cpSync(join(source, 'models', model), join(targetRoot, 'models', model));
  }
  cpSync(
    join(source, 'review/contact-sheet.png'),
    join(targetRoot, 'review/contact-sheet.png'),
  );
  cpSync(
    join(source, 'review/rights-review.json'),
    join(targetRoot, 'review/rights-review.json'),
  );
  return { assetCount: manifest.assets.length };
}
```

在 `scripts/prepare-apps.mjs` 顶部加入：

```js
import { copyMuseumAssets } from './lib/copy-museum-assets.mjs';
```

在两个子应用 `copyTree` 调用之后加入：

```js
copyMuseumAssets({
  sourceRoot: 'assets/museum',
  targetRoot: `${targetRoot}/museum`,
});
```

- [ ] **步骤 4：运行离线、构建和浏览器门禁**

运行：

```bash
npm test -- tests/unit/copy-museum-assets.test.js
npm run verify:assets
npm run build
node scripts/verify-museum-assets.mjs --root dist/museum
npm run test:e2e -- tests/e2e/museum-assets.spec.js
```

预期：单元测试 PASS；`dist/museum` 精确包含 `sources.json`、`manifest.json`、八个 GLB、`review/contact-sheet.png` 和 `review/rights-review.json`；源目录与 `dist/museum` 均输出 `8 assets`；Playwright 输出 `2 passed`，404 用例仍显示展馆 canvas。`assets/museum/upstream/`、原始 Pocket Play GLB 与冻结的 Pocket Care 源码不得出现在 `public/museum` 或 `dist/museum`；competition 离线门禁也必须拒绝这三类泄漏。

- [ ] **步骤 5：提交离线发布闭环**

```bash
git add scripts/prepare-apps.mjs scripts/lib/copy-museum-assets.mjs tests/unit/copy-museum-assets.test.js tests/e2e/museum-assets.spec.js
git commit -m "test(assets): prove offline copy and GLB fallback"
```

## 阶段完成门禁

依次运行：

```bash
printf '%s  %s\n' \
  '6cfe35284ca242fd3bc24531edb8fd4d678a4f1962e7cedf824c0c68662171d2' \
  'tests/fixtures/museum-review.glb' \
  | shasum -a 256 -c -
npm test
npm run verify:assets
npm run build
node scripts/verify-museum-assets.mjs --root dist/museum
npm run test:e2e -- tests/e2e/museum-assets.spec.js
git status --short
```

预期：

- Vitest 全部通过。
- 稳定审查 fixture 存在且 SHA-256 匹配；sanitize 单测与 asset-review Playwright 均只读取 `tests/fixtures/museum-review.glb`，最终 `npm test` 不会因阶段 05 资产删除出现 ENOENT。
- 源资产与构建资产均为 8/8、所有权利字段 approved、哈希一致、单项不超过 25k triangles、合计不超过 4 MiB。
- 正常浏览器路径八项均为 `ready`；拦截一个 GLB 为 404 时，只有对应展位进入 `fallback`，白色展馆和其余七项继续运行。
- `git status --short` 不包含 `public/`、`dist/`、`/.cache/museum-assets/`，也不新增 `sources/research_*.json`。
