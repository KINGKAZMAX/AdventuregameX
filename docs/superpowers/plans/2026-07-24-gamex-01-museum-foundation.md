# GameX 白色环形展馆基础实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 在不加载真实 GLB、不打开子运行时的前提下，交付一个可生产构建的白色 Three.js 单场景：八个可辨识程序化设备位于 360° 环形展台，右上玻璃图标、鼠标/触摸拖动、键盘切换与 45° 吸附共用同一控制器。

**架构：** `DeviceRegistry` 是首发八个展位的唯一事实来源；发布门禁固定检查 8/8，但注册表校验、环形布局、`ExhibitController`、场景实例与玻璃导航原语全部按 `records.length` 工作。纯函数负责角度、布局、点击阈值和相机过渡，`MuseumScene` 只负责 Three.js 生命周期、proxy-only Raycaster 与可等待的聚焦 API；DOM 玻璃导航和 Pointer Events 通过组合根 `createMuseumApp` 接入。真实模型、FocusPortal、Memory 事件和 Air Control 保留为后续计划的扩展点。

**技术栈：** Vite 6、Three.js 0.185.1、Vitest 4.1.10、happy-dom 20.11.1、Playwright 1.61.1、原生 JavaScript ES modules、CSS。

---

## 文件结构

### 修改

- `package.json`、`package-lock.json`：锁定 Three.js 与测试工具，增加测试命令。
- `index.html`：改成比赛标题、白色主题和应用挂载点。
- `src/main.js`：只保留组合根启动、BGM 和 HMR 销毁。
- `src/styles.css`：白色展馆、玻璃导航、状态条、焦点与 WebGL 回退样式。
- `scripts/verify-structure.mjs`：从旧双 iframe 字符串检查迁移为模块边界检查。
- `scripts/verify-hub-accent.mjs`：检查白色视觉 token 与三种信号色。
- `scripts/verify-hub-preview-frame.mjs`：检查展馆 canvas、导航和错误回退。
- `scripts/verify-game-boy-language-switch.mjs`：不再依赖旧根切换器表达式，只检查子应用语言入口。
- `scripts/verify-dammagotchi-localized-home.mjs`：不再依赖旧根切换器表达式，只检查子应用本地化。

### 创建

- `src/museum/device-registry.js`：八展位数据。
- `src/museum/registry-validator.js`：结构、状态、方位和运行时约束。
- `src/museum/orbit-math.js`：角度标准化、最短角差、目标旋转和最近展位。
- `src/museum/ring-layout.js`：环形坐标和朝向。
- `src/museum/fit-camera.js`：按视口宽高比保证八展位都进入投影视锥。
- `src/museum/exhibit-controller.js`：拖拽、吸附、键盘选择和释放。
- `src/museum/exhibit-pointer-interaction.js`：6 CSS px click-vs-drag 判定与唯一设备点击语义。
- `src/museum/scene-focus-transition.js`：相机推进/恢复的纯插值与减少动态分支。
- `src/museum/create-placeholder-device.js`：八种可区分程序化设备轮廓。
- `src/museum/create-museum-scene.js`：renderer、camera、lights、展台、设备、proxy hit-test、screen anchor、聚焦 API 和生命周期。
- `src/museum/create-museum-app.js`：场景、导航和输入的组合根。
- `src/ui/create-glass-device-rail.js`：八枚可访问图标。
- `src/input/dom-pointer-adapter.js`：Pointer Events 到控制器。
- `tests/unit/device-registry.test.js`
- `tests/unit/test-harness.test.js`
- `tests/unit/orbit-math.test.js`
- `tests/unit/ring-layout.test.js`
- `tests/unit/fit-camera.test.js`
- `tests/unit/exhibit-controller.test.js`
- `tests/unit/exhibit-pointer-interaction.test.js`
- `tests/unit/scene-focus-transition.test.js`
- `tests/unit/museum-scene-hit-test.test.js`
- `tests/unit/glass-device-rail.test.js`
- `tests/e2e/museum-foundation.spec.js`
- `vitest.config.js`
- `playwright.config.js`
- `scripts/verify-museum-foundation.mjs`

## Task 1：建立可重复测试工具链

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `vitest.config.js`
- Create: `playwright.config.js`
- Create: `tests/unit/test-harness.test.js`

- [ ] 安装精确版本：

```bash
npm install --save-exact three@0.185.1
npm install --save-dev --save-exact vitest@4.1.10 happy-dom@20.11.1 @playwright/test@1.61.1
npx playwright install chromium
```

预期：`package-lock.json` 更新，命令以状态码 0 结束。

- [ ] 在 `package.json` 增加脚本：

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "verify:museum-foundation": "node scripts/verify-museum-foundation.mjs"
}
```

- [ ] 创建 `vitest.config.js`：

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['tests/unit/**/*.test.js'],
    restoreMocks: true,
    clearMocks: true,
  },
});
```

- [ ] 创建 `playwright.config.js`：

```js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:5180',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5180',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
```

- [ ] 写测试工具链 smoke test `tests/unit/test-harness.test.js`：

```js
import { expect, it } from 'vitest';

it('runs JavaScript modules in happy-dom', () => {
  const node = document.createElement('div');
  node.dataset.ready = 'true';
  expect(node.dataset.ready).toBe('true');
});
```

- [ ] 运行 `npm test -- tests/unit/test-harness.test.js`，预期输出 `1 passed`。
- [ ] 提交测试工具链：

```bash
git add package.json package-lock.json vitest.config.js playwright.config.js tests/unit/test-harness.test.js
git commit -m "test: establish museum test harness"
```

## Task 2：建立八展位注册表与结构校验

**Files:**

- Create: `src/museum/device-registry.js`
- Create: `src/museum/registry-validator.js`
- Create: `tests/unit/device-registry.test.js`

- [ ] 创建 `tests/unit/device-registry.test.js`，同时锁定八项顺序和正式资产权利字段：

```js
import { describe, expect, it } from 'vitest';
import { DEVICE_REGISTRY } from '../../src/museum/device-registry.js';
import { validateDeviceRegistry } from '../../src/museum/registry-validator.js';

describe('DEVICE_REGISTRY', () => {
  it('defines exactly eight valid, evenly spaced exhibits', () => {
    expect(validateDeviceRegistry(DEVICE_REGISTRY)).toEqual([]);
    expect(DEVICE_REGISTRY).toHaveLength(8);
    expect(DEVICE_REGISTRY.map((item) => item.azimuth))
      .toEqual([0, 45, 90, 135, 180, 225, 270, 315]);
    expect(new Set(DEVICE_REGISTRY.map((item) => item.id)).size).toBe(8);
  });

  it('rejects an external model before its rights review is complete', () => {
    const invalid = structuredClone(DEVICE_REGISTRY);
    invalid[0].modelUrl = './museum/models/pocket-play.glb';
    invalid[0].reviewStatus = 'approved';
    invalid[0].outputSha256 = null;
    expect(validateDeviceRegistry(invalid)).toContain(
      'pocket-play: approved external model requires outputSha256',
    );
  });

  it('keeps the release gate at eight but validates ten synthetic records generically', () => {
    const synthetic = Array.from({ length: 10 }, (_, index) => ({
      ...structuredClone(DEVICE_REGISTRY[2]),
      id: `synthetic-${index}`,
      exhibitNumber: index + 1,
      name: `Synthetic ${index}`,
      azimuth: index * 36,
    }));
    expect(validateDeviceRegistry(synthetic, { expectedCount: 10 })).toEqual([]);
    expect(validateDeviceRegistry(synthetic)).toContain(
      'registry must contain exactly 8 exhibits for this release',
    );
  });
});
```

- [ ] 运行该测试，预期仍因模块缺失失败。
- [ ] 创建 `src/museum/device-registry.js`；八条记录必须按以下数据和顺序写入，不得在视图代码中另建副本：

```js
const BASE = import.meta.env.BASE_URL;
export const RELEASE_EXHIBIT_COUNT = 8;

export const DEVICE_REGISTRY = Object.freeze([
  ['pocket-play', 1, 'Pocket Play', 1989, 'live', 0, 'handheld',
    `${BASE}game-boy/index.html`, ['pointer', 'pause', 'memory']],
  ['pocket-care', 2, 'Pocket Care', 1997, 'live', 45, 'pet',
    `${BASE}dammagotchi/index.html`, ['pointer', 'pause', 'memory']],
  ['learning-computer', 3, 'Retro Learning Computer', 1986, 'coming-soon', 90, 'keyboard',
    null, []],
  ['home-console', 4, 'Cartridge Home Console', 1983, 'coming-soon', 135, 'console',
    null, []],
  ['wide-handheld', 5, 'Wide Handheld', 1990, 'coming-soon', 180, 'wide',
    null, []],
  ['dual-lcd-pocket', 6, 'Dual LCD Pocket', 1982, 'coming-soon', 225, 'fold',
    null, []],
  ['block-handheld', 7, 'Block Matrix Handheld', 1991, 'coming-soon', 270, 'matrix',
    null, []],
  ['arcade-terminal', 8, 'Arcade Terminal', 1990, 'coming-soon', 315, 'arcade',
    null, []],
].map(([id, exhibitNumber, name, year, status, azimuth, icon, runtimeUrl, runtimeCapabilities]) =>
  Object.freeze({
    id,
    exhibitNumber,
    name,
    year,
    status,
    azimuth,
    icon,
    modelUrl: null,
    creator: null,
    license: null,
    licenseUrl: null,
    sourceUrl: null,
    originalSha256: null,
    modifications: [],
    outputSha256: null,
    trademarkRemoved: false,
    reviewStatus: 'pending',
    runtimeUrl,
    runtimeCapabilities,
    interactionHint: status === 'live' ? 'Enter to play' : 'Archive opening soon',
  })));
```

- [ ] 创建 `src/museum/registry-validator.js`：

```js
const STATUS = new Set(['live', 'coming-soon']);

export function validateDeviceRegistry(records, { expectedCount = 8 } = {}) {
  const errors = [];
  if (!Array.isArray(records)) return ['registry must be an array'];
  if (records.length !== expectedCount) {
    errors.push(`registry must contain exactly ${expectedCount} exhibits for this release`);
  }

  const ids = new Set();
  const azimuths = new Set();
  for (const record of records) {
    if (!record.id || ids.has(record.id)) errors.push(`${record.id}: duplicate or empty id`);
    if (!STATUS.has(record.status)) errors.push(`${record.id}: invalid status`);
    if (!Number.isInteger(record.azimuth) || azimuths.has(record.azimuth)) {
      errors.push(`${record.id}: duplicate or invalid azimuth`);
    }
    if (record.status === 'live' && !record.runtimeUrl) {
      errors.push(`${record.id}: live exhibit requires runtimeUrl`);
    }
    if (record.status === 'coming-soon' && record.runtimeUrl) {
      errors.push(`${record.id}: coming-soon exhibit cannot expose runtimeUrl`);
    }
    if (record.modelUrl && record.reviewStatus === 'approved') {
      for (const key of ['creator', 'license', 'licenseUrl', 'sourceUrl',
        'originalSha256', 'outputSha256']) {
        if (!record[key]) errors.push(`${record.id}: approved external model requires ${key}`);
      }
    }
    ids.add(record.id);
    azimuths.add(record.azimuth);
  }
  return errors;
}
```

- [ ] `DEVICE_REGISTRY.length === RELEASE_EXHIBIT_COUNT === 8` 是本轮唯一发布计数门禁；视图、布局、控制器与导航不得 import `RELEASE_EXHIBIT_COUNT` 来决定循环、角度或 DOM 数量。
- [ ] 运行 `npm test -- tests/unit/device-registry.test.js`，预期三个用例通过。
- [ ] 提交：

```bash
git add src/museum/device-registry.js src/museum/registry-validator.js tests/unit/device-registry.test.js
git commit -m "feat(registry): define eight museum exhibits"
```

## Task 3：实现环形数学与布局

**Files:**

- Create: `src/museum/orbit-math.js`
- Create: `src/museum/ring-layout.js`
- Create: `src/museum/fit-camera.js`
- Create: `tests/unit/orbit-math.test.js`
- Create: `tests/unit/ring-layout.test.js`
- Create: `tests/unit/fit-camera.test.js`

- [ ] 创建 `tests/unit/orbit-math.test.js`：

```js
import { describe, expect, it } from 'vitest';
import { DEVICE_REGISTRY } from '../../src/museum/device-registry.js';
import {
  nearestExhibitId,
  normalizeDegrees,
  rotationForAzimuth,
  shortestDeltaDegrees,
} from '../../src/museum/orbit-math.js';

describe('orbit math', () => {
  it('crosses the 0/360 seam by the shortest route', () => {
    expect(normalizeDegrees(-1)).toBe(359);
    expect(shortestDeltaDegrees(350, 10)).toBe(20);
    expect(shortestDeltaDegrees(10, 350)).toBe(-20);
  });

  it('maps an orbit rotation to the nearest exhibit', () => {
    expect(nearestExhibitId(rotationForAzimuth(359), DEVICE_REGISTRY))
      .toBe('pocket-play');
    expect(nearestExhibitId(rotationForAzimuth(44), DEVICE_REGISTRY))
      .toBe('pocket-care');
  });
});
```

- [ ] 创建 `tests/unit/ring-layout.test.js`：

```js
import { expect, it } from 'vitest';
import { DEVICE_REGISTRY } from '../../src/museum/device-registry.js';
import { buildRingLayout } from '../../src/museum/ring-layout.js';

it('places all exhibits on the requested radius facing the centre', () => {
  const layout = buildRingLayout(DEVICE_REGISTRY, { radius: 7.2, elevation: 0.8 });
  expect(layout).toHaveLength(8);
  for (const exhibit of layout) {
    expect(Math.hypot(exhibit.position[0], exhibit.position[2])).toBeCloseTo(7.2, 5);
    expect(exhibit.position[1]).toBe(0.8);
    const forward = [-Math.sin(exhibit.yawRad), -Math.cos(exhibit.yawRad)];
    const toCentre = [-exhibit.position[0] / 7.2, -exhibit.position[2] / 7.2];
    expect(forward[0] * toCentre[0] + forward[1] * toCentre[1]).toBeCloseTo(1, 5);
  }
});

it('lays out ten synthetic records without an eight-item branch', () => {
  const records = Array.from({ length: 10 }, (_, index) => ({
    id: `synthetic-${index}`,
    azimuth: index * (360 / 10),
  }));
  const layout = buildRingLayout(records, { radius: 7.2, elevation: 0.8 });
  expect(layout).toHaveLength(records.length);
  expect(layout.map((item) => item.id)).toEqual(records.map((item) => item.id));
});
```

- [ ] 创建 `tests/unit/fit-camera.test.js`，用真实 Three.js 投影锁定桌面与窄屏：

```js
import { expect, it } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { configureCameraForRing } from '../../src/museum/fit-camera.js';
import { buildRingLayout } from '../../src/museum/ring-layout.js';
import { DEVICE_REGISTRY } from '../../src/museum/device-registry.js';

for (const aspect of [1440 / 900, 390 / 844]) {
  it(`keeps all eight exhibit centres in frame at aspect ${aspect}`, () => {
    const camera = new PerspectiveCamera();
    configureCameraForRing(camera, { aspect, radius: 7.2, targetY: 1.5 });
    const layout = buildRingLayout(DEVICE_REGISTRY, { radius: 7.2, elevation: 1.5 });
    for (const exhibit of layout) {
      const [x, y, z] = exhibit.position;
      const bounds = [
        [-1.3, -0.1, -0.7], [1.3, -0.1, -0.7],
        [-1.3, 2.6, -0.7], [1.3, 2.6, -0.7],
        [-1.3, -0.1, 0.7], [1.3, -0.1, 0.7],
        [-1.3, 2.6, 0.7], [1.3, 2.6, 0.7],
      ];
      for (const [dx, dy, dz] of bounds) {
        const ndc = new Vector3(x + dx, y + dy, z + dz).project(camera);
        expect(Math.abs(ndc.x)).toBeLessThanOrEqual(0.98);
        expect(Math.abs(ndc.y)).toBeLessThanOrEqual(0.98);
        expect(ndc.z).toBeGreaterThan(-1);
        expect(ndc.z).toBeLessThan(1);
      }
    }
  });
}
```

- [ ] 运行 `npm test -- tests/unit/orbit-math.test.js tests/unit/ring-layout.test.js tests/unit/fit-camera.test.js`，预期因三个实现模块不存在而失败。
- [ ] 创建 `src/museum/orbit-math.js`：

```js
const TAU = Math.PI * 2;
const toRadians = (degrees) => degrees * Math.PI / 180;

export function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360;
}

export function shortestDeltaDegrees(from, to) {
  return ((to - from + 540) % 360) - 180;
}

export function rotationForAzimuth(azimuthDeg) {
  return -toRadians(normalizeDegrees(azimuthDeg));
}

export function nearestExhibitId(rotationRad, records) {
  const facingAzimuth = normalizeDegrees(-rotationRad * 360 / TAU);
  return records.reduce((best, record) => {
    const distance = Math.abs(shortestDeltaDegrees(facingAzimuth, record.azimuth));
    return distance < best.distance ? { id: record.id, distance } : best;
  }, { id: records[0].id, distance: Infinity }).id;
}
```

- [ ] 创建 `src/museum/ring-layout.js`：

```js
export function buildRingLayout(records, { radius, elevation }) {
  return records.map((record) => {
    const angle = record.azimuth * Math.PI / 180;
    return {
      id: record.id,
      position: [Math.sin(angle) * radius, elevation, -Math.cos(angle) * radius],
      yawRad: Math.PI - angle,
    };
  });
}
```

- [ ] 创建 `src/museum/fit-camera.js`：

```js
export function configureCameraForRing(camera, {
  aspect,
  radius,
  targetY,
  padding = 1.12,
}) {
  const verticalFovDegrees = aspect < 0.75 ? 58 : 42;
  const verticalFov = verticalFovDegrees * Math.PI / 180;
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
  const distance = radius + radius * padding / Math.tan(horizontalFov / 2);
  camera.fov = verticalFovDegrees;
  camera.aspect = aspect;
  camera.near = 0.1;
  camera.far = distance + radius * 3;
  camera.position.set(0, Math.max(3.8, radius * 0.45), distance);
  camera.lookAt(0, targetY, 0);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  return { distance, verticalFovDegrees };
}
```

- [ ] 运行 `npm test -- tests/unit/orbit-math.test.js tests/unit/ring-layout.test.js tests/unit/fit-camera.test.js`，预期全部用例通过。
- [ ] 提交：

```bash
git add src/museum/orbit-math.js src/museum/ring-layout.js src/museum/fit-camera.js \
  tests/unit/orbit-math.test.js tests/unit/ring-layout.test.js tests/unit/fit-camera.test.js
git commit -m "feat(orbit): add ring layout and snapping math"
```

## Task 4：用一个控制器统一拖拽与选择

**Files:**

- Create: `src/museum/exhibit-controller.js`
- Create: `src/museum/exhibit-pointer-interaction.js`
- Create: `tests/unit/exhibit-controller.test.js`
- Create: `tests/unit/exhibit-pointer-interaction.test.js`

- [ ] 创建测试，固定拖动灵敏度、吸附、相对选择、减少动态和强制释放行为：

```js
import { describe, expect, it, vi } from 'vitest';
import { DEVICE_REGISTRY } from '../../src/museum/device-registry.js';
import { createExhibitController } from '../../src/museum/exhibit-controller.js';
import { rotationForAzimuth } from '../../src/museum/orbit-math.js';

describe('exhibit controller', () => {
  it('drags, releases, and snaps to the nearest 45 degree exhibit', () => {
    const onRotation = vi.fn();
    const onSelection = vi.fn();
    const controller = createExhibitController({
      records: DEVICE_REGISTRY,
      initialId: 'pocket-play',
      reducedMotion: true,
      onRotation,
      onSelection,
    });
    controller.beginDrag(100);
    controller.dragTo(260);
    controller.endDrag();
    expect(onSelection).toHaveBeenLastCalledWith('wide-handheld');
    expect(onRotation).toHaveBeenLastCalledWith(rotationForAzimuth(180), false);
  });

  it('releases a held drag and selects relative exhibits', () => {
    const controller = createExhibitController({
      records: DEVICE_REGISTRY,
      initialId: 'pocket-play',
      reducedMotion: false,
      onRotation: vi.fn(),
      onSelection: vi.fn(),
    });
    controller.beginDrag(20);
    controller.releaseAll();
    expect(controller.getSnapshot().dragging).toBe(false);
    controller.selectRelative(1);
    expect(controller.getSnapshot().activeId).toBe('pocket-care');
  });

  it('crosses the 0/360 seam and snaps to every 45 degree exhibit', () => {
    const controller = createExhibitController({
      records: DEVICE_REGISTRY,
      initialId: 'pocket-play',
      reducedMotion: true,
      onRotation: vi.fn(),
      onSelection: vi.fn(),
    });
    const visited = [];
    for (let step = 1; step <= DEVICE_REGISTRY.length; step += 1) {
      controller.beginDrag(400);
      controller.dragTo(440);
      controller.endDrag();
      visited.push(controller.getSnapshot().activeId);
    }
    expect(visited).toEqual([
      'pocket-care',
      'learning-computer',
      'home-console',
      'wide-handheld',
      'dual-lcd-pocket',
      'block-handheld',
      'arcade-terminal',
      'pocket-play',
    ]);
    expect(controller.getSnapshot().rotationRad % (Math.PI * 2)).toBeCloseTo(0);
  });

  it('cycles through ten synthetic records using records.length', () => {
    const records = Array.from({ length: 10 }, (_, index) => ({
      id: `synthetic-${index}`,
      azimuth: index * 36,
    }));
    const controller = createExhibitController({
      records,
      initialId: records[0].id,
      reducedMotion: true,
      onRotation: vi.fn(),
      onSelection: vi.fn(),
    });
    for (let index = 1; index <= records.length; index += 1) {
      controller.selectRelative(1);
      expect(controller.getSnapshot().activeId)
        .toBe(records[index % records.length].id);
    }
  });
});
```

- [ ] 运行 `npm test -- tests/unit/exhibit-controller.test.js`，预期因实现模块不存在而失败。
- [ ] 创建 `src/museum/exhibit-controller.js`，采用以下状态与公开 API：

```js
import { nearestExhibitId, rotationForAzimuth } from './orbit-math.js';

export function createExhibitController({
  records, initialId, reducedMotion, onRotation, onSelection,
}) {
  let activeId = initialId;
  let rotationRad = rotationForAzimuth(records.find((item) => item.id === activeId).azimuth);
  let dragStartX = 0;
  let dragStartRotation = rotationRad;
  let dragging = false;

  async function select(id) {
    const record = records.find((item) => item.id === id);
    if (!record) return false;
    activeId = id;
    rotationRad = rotationForAzimuth(record.azimuth);
    onSelection(activeId);
    await onRotation(rotationRad, !reducedMotion);
    return true;
  }

  return {
    beginDrag(x) {
      dragging = true;
      dragStartX = x;
      dragStartRotation = rotationRad;
    },
    dragTo(x) {
      if (!dragging) return;
      rotationRad = dragStartRotation - (x - dragStartX) * Math.PI / 160;
      onRotation(rotationRad, false);
    },
    endDrag() {
      if (!dragging) return;
      dragging = false;
      select(nearestExhibitId(rotationRad, records));
    },
    select,
    selectRelative(step) {
      const index = records.findIndex((item) => item.id === activeId);
      return select(records[(index + step + records.length) % records.length].id);
    },
    releaseAll() {
      if (dragging) this.endDrag();
      dragging = false;
    },
    getSnapshot: () => ({ activeId, rotationRad, dragging }),
    dispose() { dragging = false; },
  };
}
```

- [ ] `select(id)` 同步更新 active 状态后返回 Promise，并只在 `onRotation(rotation, animate)` 的吸附 Promise 完成后 resolve；减少动态时 scene 返回已完成 Promise。玻璃 rail 可以不等待它，但任何 portal activation 必须 `await controller.select(id)` 后才聚焦相机。
- [ ] 创建 `src/museum/exhibit-pointer-interaction.js`，它是 canvas 鼠标、触摸以及阶段 03 `museumTarget` 唯一复用的展馆点击判定器。公开 `input({ phase, x, y })` 与 `releaseAll(reason)`；down 时保存 CSS 像素位置和 `hitTest({ x, y })` 返回的 proxy ID，累计欧氏位移严格大于 `dragThresholdPx = 6` 后才调用 `controller.beginDrag(startX)`/`dragTo(x)`。up 时若未跨阈值且 down/up 命中同一非空 ID，先 `await controller.select(id)` 完成吸附，再调用可注入的 `onActivate(id)`；否则结束并吸附拖拽。阶段 01 的 `onActivate` 是显式 no-op，阶段 03 将它连接到唯一 portal entry chain；玻璃 rail 永远只调用 `controller.select`，不得误开门户。`pointercancel/blur/pagehide/release-all` 清空候选点击且绝不触发选择。
- [ ] `tests/unit/exhibit-pointer-interaction.test.js` 用注入的 `hitTest`/controller/onActivate 锁定边界：移动恰好 6 px 仍是点击，6.01 px 是拖拽；down/up 不同 proxy 不点击；release 后迟到 up 无效。成功 proxy 点击精确记录 `select:start → select:resolved → activate`，两种 LIVE ID 都能走同一个回调；rail 测试则证明 icon 点击只有 select、没有 activate。不得在 DOM adapter、Air adapter 或 Three.js GLB 节点上复制判断。
- [ ] 运行 `npm test -- tests/unit/exhibit-controller.test.js tests/unit/exhibit-pointer-interaction.test.js`，预期全部用例通过；controller 用例必须跨过 0/360 seam 命中八项，并循环命中十条 synthetic records。
- [ ] 提交：

```bash
git add src/museum/exhibit-controller.js src/museum/exhibit-pointer-interaction.js \
  tests/unit/exhibit-controller.test.js tests/unit/exhibit-pointer-interaction.test.js
git commit -m "feat(orbit): unify drag and exhibit selection"
```

## Task 5：创建白色单 renderer 场景和八种设备轮廓

**Files:**

- Create: `src/museum/create-placeholder-device.js`
- Create: `src/museum/create-museum-scene.js`
- Create: `src/museum/scene-focus-transition.js`
- Create: `scripts/verify-museum-foundation.mjs`
- Create: `tests/unit/scene-focus-transition.test.js`
- Create: `tests/unit/museum-scene-hit-test.test.js`
- Test: `scripts/verify-museum-foundation.mjs`

- [ ] 创建 `scripts/verify-museum-foundation.mjs`，先断言尚不存在的场景约束：

```js
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const scene = readFileSync('src/museum/create-museum-scene.js', 'utf8');
const devices = readFileSync('src/museum/create-placeholder-device.js', 'utf8');
assert.match(scene, /new WebGLRenderer/);
assert.match(scene, /Math\.min\(window\.devicePixelRatio \|\| 1, pixelRatioCap\)/);
assert.match(scene, /webglcontextlost/);
assert.match(scene, /InstancedMesh/);
assert.match(scene, /new Raycaster/);
assert.match(scene, /raycastProxy/);
assert.match(scene, /focusExhibit/);
assert.match(scene, /restoreOverview/);
assert.match(scene, /getProjectedScreenRect/);
assert.match(devices, /learning-computer/);
assert.match(devices, /arcade-terminal/);
console.log('museum foundation scene verified');
```

- [ ] 运行 `node scripts/verify-museum-foundation.mjs`，预期因场景文件不存在而失败。
- [ ] 创建 `src/museum/create-placeholder-device.js`。使用共享 `MeshStandardMaterial`，并以 `record.id` 明确选择以下轮廓：

```js
import {
  BoxGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry,
} from 'three';

const shell = new MeshStandardMaterial({ color: 0xf2f3f5, roughness: 0.34, metalness: 0.08 });
const dark = new MeshStandardMaterial({ color: 0x24272b, roughness: 0.62 });
const signal = new MeshStandardMaterial({ color: 0xd9ff57, roughness: 0.4 });

const box = (size, position, material = shell) => {
  const mesh = new Mesh(new BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};

export function createPlaceholderDevice(record) {
  const root = new Group();
  root.name = `device:${record.id}`;
  const recipes = {
    'pocket-play': () => [box([1.15, 1.7, 0.28], [0, 0.85, 0]), box([0.75, 0.62, 0.05], [0, 1.1, -0.17], dark)],
    'pocket-care': () => {
      const body = new Mesh(new SphereGeometry(0.72, 24, 18), signal);
      body.scale.y = 1.15; body.position.y = 0.85;
      return [body, box([0.7, 0.48, 0.05], [0, 0.98, -0.66], dark)];
    },
    'learning-computer': () => [box([2.1, 0.32, 1.1], [0, 0.34, 0]), box([1.65, 0.08, 0.7], [0, 0.55, -0.08], dark)],
    'home-console': () => [box([1.9, 0.48, 1.25], [0, 0.42, 0]), box([0.9, 0.1, 0.7], [0, 0.71, 0], dark)],
    'wide-handheld': () => [box([2.0, 0.9, 0.25], [0, 0.82, 0]), box([1.0, 0.62, 0.05], [0, 0.88, -0.16], dark)],
    'dual-lcd-pocket': () => [box([1.45, 0.78, 0.18], [0, 0.48, 0]), box([1.45, 0.78, 0.18], [0, 1.25, 0.18], dark)],
    'block-handheld': () => [box([1.1, 1.9, 0.3], [0, 0.95, 0]), box([0.75, 0.92, 0.05], [0, 1.18, -0.18], signal)],
    'arcade-terminal': () => [box([1.45, 2.4, 1.0], [0, 1.2, 0]), box([1.15, 0.72, 0.05], [0, 1.65, -0.52], dark)],
  };
  const generic = () => [
    box([1.2, 1.45, 0.28], [0, 0.72, 0]),
    box([0.78, 0.56, 0.05], [0, 0.88, -0.17], dark),
  ];
  for (const part of (recipes[record.id] ?? generic)()) root.add(part);
  root.userData.exhibitId = record.id;
  return root;
}
```

- [ ] `createPlaceholderDevice` 的八种 recipe 只是首发视觉增强，不是 registry 白名单；未知 synthetic/future ID 必须走上面的 generic archetype（后续可再按 `record.icon` 细分），不得因 `recipes[record.id]` 缺失而抛错。单测至少传入 `synthetic-9/synthetic-10` 并断言都生成带各自 `exhibitId` 的可见轮廓。
- [ ] 创建 `src/museum/create-museum-scene.js`，确保单 renderer、DPR≤1.5、可暂停循环、context lost、resize、dispose 和实例化展台：

```js
import {
  AmbientLight, CircleGeometry, Color, DirectionalLight, Group,
  InstancedMesh, Matrix4, Mesh, MeshPhysicalMaterial, MeshStandardMaterial,
  PerspectiveCamera, PlaneGeometry, Scene, TorusGeometry, WebGLRenderer,
} from 'three';
import { createPlaceholderDevice } from './create-placeholder-device.js';
import { configureCameraForRing } from './fit-camera.js';

export function createMuseumScene({
  canvas, records, layout, reducedMotion = false, pixelRatioCap = 1.5,
}) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap));
  renderer.shadowMap.enabled = true;
  renderer.setClearColor(new Color(0xffffff), 1);
  const scene = new Scene();
  scene.background = new Color(0xffffff);
  const camera = new PerspectiveCamera();
  scene.add(new AmbientLight(0xffffff, 2.2));
  const key = new DirectionalLight(0xffffff, 3.2);
  key.position.set(4, 8, 5); key.castShadow = true; scene.add(key);

  const floor = new Mesh(
    new PlaneGeometry(24, 24),
    new MeshStandardMaterial({ color: 0xf4f4f1, roughness: 0.92 }),
  );
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  const orbit = new Group();
  scene.add(orbit);
  const plinths = new InstancedMesh(
    new CircleGeometry(1.45, 48),
    new MeshStandardMaterial({ color: 0xe7e8e5, roughness: 0.78 }),
    records.length,
  );
  const matrix = new Matrix4();
  layout.forEach((item, index) => {
    matrix.makeRotationX(-Math.PI / 2);
    matrix.setPosition(item.position[0], 0.015, item.position[2]);
    plinths.setMatrixAt(index, matrix);
    const device = createPlaceholderDevice(records[index]);
    device.position.set(...item.position);
    device.rotation.y = item.yawRad;
    orbit.add(device);
  });
  orbit.add(plinths);

  const core = new Mesh(
    new TorusGeometry(0.72, 0.08, 20, 72),
    new MeshPhysicalMaterial({ color: 0xd9ff57, emissive: 0x5c7d00, emissiveIntensity: 0.3 }),
  );
  core.rotation.x = Math.PI / 2; core.position.y = 1.1; scene.add(core);

  let running = false;
  let paused = false;
  let rafId = 0;
  const render = () => {
    if (!running) return;
    rafId = requestAnimationFrame(render);
    if (!paused) {
      core.rotation.z += 0.003;
      renderer.render(scene, camera);
    }
  };
  const resize = () => {
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    configureCameraForRing(camera, {
      aspect: width / height,
      radius: 7.2,
      targetY: 1.5,
    });
    renderer.setSize(width, height, false);
  };
  const onContextLost = (event) => { event.preventDefault(); paused = true; };
  canvas.addEventListener('webglcontextlost', onContextLost);
  let orbitTransitionGeneration = 0;
  const setOrbitRotation = (value, { animate = true } = {}) => {
    const generation = ++orbitTransitionGeneration;
    if (!animate || reducedMotion) {
      orbit.rotation.y = value;
      return Promise.resolve({ cancelled: false });
    }
    const from = orbit.rotation.y;
    const delta = Math.atan2(Math.sin(value - from), Math.cos(value - from));
    return new Promise((resolve) => {
      let startedAt;
      const step = (time) => {
        if (generation !== orbitTransitionGeneration) {
          resolve({ cancelled: true });
          return;
        }
        startedAt ??= time;
        const progress = Math.min(1, (time - startedAt) / 260);
        const eased = 1 - (1 - progress) ** 3;
        orbit.rotation.y = from + delta * eased;
        if (progress < 1) requestAnimationFrame(step);
        else resolve({ cancelled: false });
      };
      requestAnimationFrame(step);
    });
  };

  return {
    start() { if (!running) { running = true; resize(); render(); } },
    resize,
    setOrbitRotation,
    setActiveExhibit(id) {
      orbit.traverse((node) => {
        if (node.userData.exhibitId) node.userData.active = node.userData.exhibitId === id;
      });
    },
    setPaused(value) { paused = Boolean(value); },
    getStats: () => ({ rendererCount: 1, paused, exhibits: records.length }),
    dispose() {
      running = false; orbitTransitionGeneration += 1; cancelAnimationFrame(rafId);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      renderer.dispose();
    },
  };
}
```

- [ ] 在上述场景基础实现中，为每个 `records` 项创建稳定的 exhibit slot，并以同一个 `exhibitSlots` map 保存 `{ slot, visualRoot, placeholder, proxy, screenAnchor }`：程序化视觉或阶段 02 的复杂 GLB 只放入 `visualRoot`；另建一个略大于设备包围盒的 `BoxGeometry` proxy。proxy 使用 `transparent: true, opacity: 0, colorWrite: false, depthWrite: false`，保持可供 Raycaster 命中，写入 `userData.raycastProxy = true` 与 `userData.exhibitId`。`hitTestExhibit({ x, y })` 每次按 canvas 最新 `getBoundingClientRect()` 转 NDC，只调用 `raycaster.intersectObjects(proxyMeshes, false)`；禁止对 `scene`、`orbit`、visual child 或 GLB 做递归 raycast。阶段 02 交叉淡入真实模型时只能替换 `visualRoot` child，不得重建 map/slot/proxy/anchor。
- [ ] 每个 slot 同时创建 `screen-anchor:<id>`，保存该类别屏幕的四个 local-space corner。`getProjectedScreenRect(id)` 在相机/世界矩阵更新后投影四角，返回相对 `.museum-shell` 的只读 `{ left, top, width, height }` CSS 像素；点在相机后方、矩形无面积或 id 未知时返回 `null`，不得用固定百分比伪造屏幕位置。resize、环形旋转和相机过渡后，同一 API 都必须给出当前矩形。
- [ ] 创建 `src/museum/scene-focus-transition.js` 的纯函数：由 overview pose、目标 screen anchor pose、`progress` 与 `reducedMotion` 生成 camera position/quaternion/FOV；常规模式使用 clamp 后的 easing，减少动态模式在首个采样直接返回目标 pose。纯测试覆盖 `progress=0/0.5/1`、取消后不再写旧 pose、减少动态持续时间为 0 且无中间大幅推进。
- [ ] `createMuseumScene` 公开并测试以下稳定 API，供阶段 03 两个 LIVE 设备共同使用：

```js
scene.hitTestExhibit({ x, y })       // => exhibitId | null，proxy-only
await scene.focusExhibit(id)         // => { id, screenRect }，可取消、幂等
await scene.restoreOverview()        // => overview pose，恢复前一环形方位
scene.getProjectedScreenRect(id)     // => { left, top, width, height } | null
scene.getFocusSnapshot()             // => { mode: 'overview' | 'focusing' | 'focused', id }
```

`focusExhibit(id)` 必须在 controller 已完成目标吸附后调用；它先保存 overview camera pose 和当前 orbit rotation，再推进到该 slot 的 screen anchor，并只在当前 transition generation 仍有效时 resolve。`restoreOverview()` 使旧 focus Promise 失效、恢复所保存 pose，但不自行改变 controller 的 active ID/rotation。`reducedMotion` 由 `createMuseumApp` 显式传入，不在 scene 内重复读取 media query。
- [ ] `setOrbitRotation(value, { animate })` 必须像上述示例返回可等待 Promise：常规模式走最短角差并只在 260ms 最后一帧 resolve，新的 snap/dispose 使旧 generation 以 `{ cancelled:true }` resolve；`animate:false` 或减少动态立即写最终值并 resolve。fake-RAF 单测锁定 resolve 前 orbit 尚未到最终态、完成后精确到目标、跨 seam 走短路和旧 transition 不会迟到覆盖。阶段 03 coordinator 集成测试使用真实 controller/scene Promise，证明 `focusExhibit` 的首次调用严格晚于 snap resolve。
- [ ] `tests/unit/museum-scene-hit-test.test.js` 使用真实 `PerspectiveCamera/Raycaster`：把一个会在被调用时抛错的 fake complex visual 放在 proxy 后方，命中仍返回 proxy ID 且 fake visual 的 `raycast` 从未调用；未知/画布外坐标返回 `null`。同一测试还断言 10 条 synthetic records 产生 10 个 proxy、screen anchor 与展台实例。
- [ ] `tests/unit/scene-focus-transition.test.js` 锁定上述纯过渡；场景契约测试分别对 Pocket Play 和 Pocket Care 调用相同 `focusExhibit → getProjectedScreenRect → restoreOverview` API，不允许按设备创建两个聚焦实现。
- [ ] 运行 `node scripts/verify-museum-foundation.mjs`，预期输出 `museum foundation scene verified`。
- [ ] 提交：

```bash
git add src/museum/create-placeholder-device.js src/museum/create-museum-scene.js \
  src/museum/scene-focus-transition.js scripts/verify-museum-foundation.mjs \
  tests/unit/scene-focus-transition.test.js tests/unit/museum-scene-hit-test.test.js
git commit -m "feat(scene): build white eight-exhibit museum"
```

## Task 6：实现玻璃图标、Pointer Events 与键盘

**Files:**

- Create: `src/ui/create-glass-device-rail.js`
- Create: `src/input/dom-pointer-adapter.js`
- Create: `tests/unit/glass-device-rail.test.js`

- [ ] 创建导航失败测试：

```js
import { expect, it, vi } from 'vitest';
import { DEVICE_REGISTRY } from '../../src/museum/device-registry.js';
import { createGlassDeviceRail } from '../../src/ui/create-glass-device-rail.js';

it('renders eight labelled buttons and selects the requested exhibit', () => {
  const onSelect = vi.fn();
  const rail = createGlassDeviceRail({
    root: document.body,
    records: DEVICE_REGISTRY,
    activeId: 'pocket-play',
    onSelect,
  });
  expect(document.querySelectorAll('button[data-exhibit-id]')).toHaveLength(8);
  expect(document.querySelectorAll('[data-status="coming-soon"]')).toHaveLength(6);
  expect(document.querySelector('[aria-current="true"]').dataset.exhibitId).toBe('pocket-play');
  document.querySelector('[data-exhibit-id="arcade-terminal"]').click();
  expect(onSelect).toHaveBeenCalledWith('arcade-terminal');
  rail.destroy();
});

it('renders a reachable overflow rail for ten synthetic records', () => {
  const records = Array.from({ length: 10 }, (_, index) => ({
    ...DEVICE_REGISTRY[index % DEVICE_REGISTRY.length],
    id: `synthetic-${index}`,
    exhibitNumber: index + 1,
    name: `Synthetic ${index}`,
  }));
  const rail = createGlassDeviceRail({
    root: document.body,
    records,
    activeId: records[0].id,
    onSelect: vi.fn(),
  });
  expect(document.querySelectorAll('button[data-exhibit-id]')).toHaveLength(10);
  expect(document.querySelector('.glass-device-rail'))
    .toHaveAttribute('data-overflow', 'scroll');
  expect(document.querySelector('[data-exhibit-id="synthetic-9"]'))
    .toHaveAccessibleName(/Synthetic 9/);
  rail.destroy();
});
```

- [ ] 运行 `npm test -- tests/unit/glass-device-rail.test.js`，预期因实现模块不存在而失败。
- [ ] 创建 `src/ui/create-glass-device-rail.js`：

```js
export function createGlassDeviceRail({ root, records, activeId, onSelect }) {
  const rail = document.createElement('nav');
  rail.className = 'glass-device-rail';
  if (records.length > 8) rail.dataset.overflow = 'scroll';
  rail.setAttribute('aria-label', 'Museum devices');
  rail.innerHTML = records.map((record) => `
    <button type="button" data-exhibit-id="${record.id}" data-status="${record.status}"
      aria-label="${record.exhibitNumber}. ${record.name}, ${record.status === 'live' ? 'playable' : 'coming soon'}">
      <span class="device-glyph device-glyph--${record.icon}" aria-hidden="true"></span>
      <span class="sr-only">${record.name}</span>
    </button>`).join('');
  const click = (event) => {
    const button = event.target.closest('[data-exhibit-id]');
    if (button) onSelect(button.dataset.exhibitId);
  };
  rail.addEventListener('click', click);
  root.append(rail);
  const setActive = (id) => {
    for (const button of rail.querySelectorAll('[data-exhibit-id]')) {
      const active = button.dataset.exhibitId === id;
      button.toggleAttribute('aria-current', active);
      button.classList.toggle('is-active', active);
    }
  };
  setActive(activeId);
  return {
    setActive,
    destroy() { rail.removeEventListener('click', click); rail.remove(); },
  };
}
```

- [ ] 创建 `src/input/dom-pointer-adapter.js`。本阶段 adapter 只负责 Pointer Events 捕获和键盘选择；canvas 的 down/move/up 全部交给 Task 4 的唯一 `interaction`，不可在 adapter 内重写 click-vs-drag 或调用 Three.js visual：

```js
export function bindDomPointer({ element, interaction, controller, windowRef = window }) {
  let activePointerId = null;
  const down = (event) => {
    if (activePointerId !== null) return;
    activePointerId = event.pointerId;
    element.setPointerCapture?.(event.pointerId);
    interaction.input({ phase: 'down', x: event.clientX, y: event.clientY });
  };
  const move = (event) => {
    if (event.pointerId !== activePointerId) return;
    interaction.input({ phase: 'move', x: event.clientX, y: event.clientY });
  };
  const up = (event) => {
    if (event.pointerId !== activePointerId) return;
    interaction.input({ phase: 'up', x: event.clientX, y: event.clientY });
    activePointerId = null;
  };
  const cancel = () => {
    interaction.releaseAll('pointer-cancel');
    activePointerId = null;
  };
  const key = (event) => {
    if (event.key === 'ArrowLeft') controller.selectRelative(-1);
    if (event.key === 'ArrowRight') controller.selectRelative(1);
    if (event.key === 'Escape') interaction.releaseAll('escape');
  };
  element.addEventListener('pointerdown', down);
  element.addEventListener('pointermove', move);
  element.addEventListener('pointerup', up);
  element.addEventListener('pointercancel', cancel);
  windowRef.addEventListener('keydown', key);
  return () => {
    interaction.releaseAll('destroy');
    element.removeEventListener('pointerdown', down);
    element.removeEventListener('pointermove', move);
    element.removeEventListener('pointerup', up);
    element.removeEventListener('pointercancel', cancel);
    windowRef.removeEventListener('keydown', key);
  };
}
```

- [ ] 右上玻璃 icon 的 `onSelect` 只调用同一个 `controller.select(id)`，因此与 canvas proxy 点击共享 selection/snap 状态；导航本身不调用 scene 聚焦。为 `records.length > 8` 增加 `data-overflow="scroll"` 和可键盘抵达的水平溢出样式，不截断第 9/10 项。
- [ ] 运行 `npm test -- tests/unit/glass-device-rail.test.js tests/unit/exhibit-pointer-interaction.test.js`，预期用例通过。
- [ ] 提交：

```bash
git add src/ui/create-glass-device-rail.js src/input/dom-pointer-adapter.js tests/unit/glass-device-rail.test.js
git commit -m "feat(ui): add glass device rail and shared pointer input"
```

## Task 7：组合根应用并应用白色视觉系统

**Files:**

- Create: `src/museum/create-museum-app.js`
- Modify: `src/main.js`
- Modify: `src/styles.css`
- Modify: `index.html`

- [ ] 在 `src/museum/create-museum-app.js` 组合稳定 DOM、场景和控制器：

```js
import { DEVICE_REGISTRY } from './device-registry.js';
import { buildRingLayout } from './ring-layout.js';
import { createExhibitController } from './exhibit-controller.js';
import { createExhibitPointerInteraction } from './exhibit-pointer-interaction.js';
import { createMuseumScene } from './create-museum-scene.js';
import { createGlassDeviceRail } from '../ui/create-glass-device-rail.js';
import { bindDomPointer } from '../input/dom-pointer-adapter.js';

const createFallbackScene = (exhibitCount) => Object.freeze({
  start() {},
  resize() {},
  setOrbitRotation() {},
  setActiveExhibit() {},
  setPaused() {},
  hitTestExhibit: () => null,
  focusExhibit: async () => ({ id: null, screenRect: null }),
  restoreOverview: async () => {},
  getProjectedScreenRect: () => null,
  getFocusSnapshot: () => ({ mode: 'overview', id: null }),
  dispose() {},
  getStats: () => ({ rendererCount: 0, paused: true, exhibits: exhibitCount }),
});

export function createMuseumApp({ root, records = DEVICE_REGISTRY, windowRef = window }) {
  root.innerHTML = `
    <main class="museum-shell">
      <canvas class="museum-canvas" aria-label="Rotatable museum with ${records.length} game devices"></canvas>
      <header class="museum-brand"><strong>GameX</strong><span>Playable Artifacts of Childhood</span></header>
      <section class="exhibit-caption" aria-live="polite"></section>
      <p class="museum-instructions">Drag · ← → Select · Enter Explore</p>
      <section class="webgl-fallback" hidden role="alert">3D is unavailable. Use the device buttons to browse the archive.</section>
    </main>`;
  const canvas = root.querySelector('.museum-canvas');
  const caption = root.querySelector('.exhibit-caption');
  const fallback = root.querySelector('.webgl-fallback');
  const reducedMotion = windowRef.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const showFallback = () => {
    canvas.hidden = true;
    fallback.hidden = false;
  };
  root.dataset.motionMode = reducedMotion ? 'instant' : 'animated';
  let scene = createFallbackScene(records.length);
  try {
    scene = createMuseumScene({
      canvas,
      records,
      layout: buildRingLayout(records, { radius: 7.2, elevation: 0.8 }),
      reducedMotion,
    });
  } catch {
    showFallback();
  }
  canvas.addEventListener('webglcontextlost', showFallback);
  let rail;
  const controller = createExhibitController({
    records,
    initialId: records[0].id,
    reducedMotion,
    onRotation: async (rotation, animate) => {
      await scene.setOrbitRotation(rotation, { animate });
      root.dataset.orbitRotation = String(rotation);
    },
    onSelection: (id) => {
      const record = records.find((item) => item.id === id);
      scene.setActiveExhibit(id);
      rail?.setActive(id);
      caption.textContent = `${String(record.exhibitNumber).padStart(2, '0')} · ${record.name} · ${record.status === 'live' ? 'LIVE' : 'COMING SOON'}`;
    },
  });
  rail = createGlassDeviceRail({
    root: root.querySelector('.museum-shell'),
    records,
    activeId: records[0].id,
    onSelect: controller.select,
  });
  const interaction = createExhibitPointerInteraction({
    controller,
    hitTest: ({ x, y }) => scene.hitTestExhibit({ x, y }),
    onActivate: async () => {}, // 阶段 03 在同一实例接入 portal entry chain
  });
  const unbindPointer = bindDomPointer({
    element: canvas, interaction, controller, windowRef,
  });
  const resize = () => scene.resize();
  windowRef.addEventListener('resize', resize);
  controller.select(records[0].id);
  return {
    start() { scene.start(); },
    selectExhibit: controller.select,
    getSnapshot: () => ({ ...controller.getSnapshot(), ...scene.getStats() }),
    dispose() {
      unbindPointer(); interaction.releaseAll('destroy');
      rail.destroy(); controller.dispose(); scene.dispose();
      canvas.removeEventListener('webglcontextlost', showFallback);
      windowRef.removeEventListener('resize', resize); root.replaceChildren();
    },
  };
}
```

- [ ] 组合根必须按 `scene → controller → interaction → rail/DOM adapter` 创建，并确保 canvas proxy 点击和 rail icon 点击最终都调用同一 `controller.select(id)` 完成吸附。只有 proxy interaction 保留 `onActivate` 扩展点；rail 的 `onSelect` 永远不连接它。`scene.setOrbitRotation(rotation, { animate })` 返回吸附完成 Promise，供 controller/阶段 03 严格排序。
- [ ] fallback scene 不得硬编码展品数或 canvas 文案；fallback 统计、DOM 数量和 aria label 都取当前 `records.length`，但 Task 2 的发布门禁仍要求默认 `DEVICE_REGISTRY` 正好 8。

- [ ] 将 `src/main.js` 改成唯一启动入口，同时保留现有原创 BGM：

```js
import './styles.css';
import { initBgmToggle } from './bgm.js';
import { createMuseumApp } from './museum/create-museum-app.js';

const root = document.querySelector('#app');
const museum = createMuseumApp({ root });
museum.start();
initBgmToggle();

if (import.meta.hot) import.meta.hot.dispose(() => museum.dispose());
```

- [ ] 将 `index.html` 的标题改为 `GameX — Playable Artifacts of Childhood`，`theme-color` 改为 `#ffffff`，保留 `<div id="app">` 和模块入口。
- [ ] 重写 `src/styles.css`，至少使用以下固定 token 与布局；八枚图标在桌面右上，窄屏变成右上可横向滚动的单行：

```css
:root {
  --paper: #fff;
  --pearl: #eef0ed;
  --ink: #202328;
  --line: rgba(32, 35, 40, 0.18);
  --lime: #d9ff57;
  --cyan: #7de7ff;
  --violet: #9a86ff;
}
* { box-sizing: border-box; }
html, body, #app, .museum-shell { width: 100%; height: 100%; margin: 0; }
body { overflow: hidden; background: var(--paper); color: var(--ink); font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
button { font: inherit; }
.museum-shell { position: relative; isolation: isolate; background: #fff; }
.museum-canvas { display: block; width: 100%; height: 100%; touch-action: none; cursor: grab; }
.museum-canvas:active { cursor: grabbing; }
.museum-brand { position: fixed; top: 22px; left: 24px; z-index: 4; display: grid; gap: 2px; }
.museum-brand strong { font-size: 20px; letter-spacing: -.03em; }
.museum-brand span, .museum-instructions { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
.glass-device-rail { position: fixed; z-index: 5; top: 18px; right: 20px; display: grid; grid-template-columns: repeat(4, 46px); gap: 8px; }
.glass-device-rail button {
  width: 46px; height: 46px; border-radius: 14px; border: 1px solid var(--line);
  color: var(--ink); background: rgba(255,255,255,.72); box-shadow: 0 12px 38px rgba(20,24,28,.11);
  backdrop-filter: blur(18px); cursor: pointer;
}
.glass-device-rail button:hover, .glass-device-rail button:focus-visible { outline: 3px solid var(--cyan); outline-offset: 2px; }
.glass-device-rail button.is-active { background: var(--lime); border-color: rgba(32,35,40,.34); }
.glass-device-rail[data-overflow="scroll"] {
  max-width: 208px; grid-template-columns: none; grid-template-rows: repeat(2, 46px);
  grid-auto-flow: column; grid-auto-columns: 46px; overflow-x: auto; overscroll-behavior: contain;
}
.device-glyph { display: block; width: 18px; height: 24px; margin: auto; border: 2px solid currentColor; border-radius: 4px; }
.device-glyph--pet { border-radius: 50%; }
.device-glyph--keyboard, .device-glyph--console, .device-glyph--wide { width: 26px; height: 14px; }
.device-glyph--fold { box-shadow: 0 -7px 0 -1px var(--paper); }
.device-glyph--arcade { width: 20px; height: 28px; border-radius: 3px 3px 7px 7px; }
.exhibit-caption { position: fixed; left: 50%; bottom: 54px; transform: translateX(-50%); z-index: 4; padding: 10px 14px; border: 1px solid var(--line); border-radius: 999px; background: rgba(255,255,255,.78); backdrop-filter: blur(16px); font-size: 12px; font-weight: 800; }
.museum-instructions { position: fixed; bottom: 18px; left: 50%; transform: translateX(-50%); margin: 0; }
.webgl-fallback { position: fixed; inset: 25% 12%; z-index: 8; padding: 24px; border: 1px solid var(--line); background: #fff; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
@media (max-width: 720px) {
  .museum-brand span { display: none; }
  .glass-device-rail { left: 12px; right: 12px; top: 58px; display: flex; overflow-x: auto; }
  .glass-device-rail button { flex: 0 0 42px; width: 42px; height: 42px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; animation-duration: .01ms !important; }
}
```

- [ ] 运行 `npm test && npm run build`，预期全部单元测试通过，`dist/index.html` 生成。
- [ ] 运行 `npm run dev` 并打开 `http://127.0.0.1:5180`，确认白色画面、八台同时可见、右上八图标、拖动和方向键可用；完成后停止开发服务器。
- [ ] 提交：

```bash
git add index.html src/main.js src/styles.css src/museum/create-museum-app.js
git commit -m "refactor(hub): launch the white orbit museum"
```

## Task 8：迁移旧守卫并增加行为 E2E

**Files:**

- Modify: `scripts/verify-structure.mjs`
- Modify: `scripts/verify-hub-accent.mjs`
- Modify: `scripts/verify-hub-preview-frame.mjs`
- Modify: `scripts/verify-game-boy-language-switch.mjs`
- Modify: `scripts/verify-dammagotchi-localized-home.mjs`
- Create: `tests/e2e/museum-foundation.spec.js`

- [ ] 删除五个验证器对旧根级 `iframe`、`active.id === 'game-boy'`、左侧 switcher 和旧灰色 accent 的断言；改为直接读取对应新模块，并断言 `DEVICE_REGISTRY`、`createMuseumApp`、`glass-device-rail`、`--paper: #fff` 和两个子应用自身语言实现。
- [ ] 创建 E2E 测试：

```js
import { expect, test } from '@playwright/test';

test('shows and navigates all eight exhibits without runtime errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.museum-canvas')).toBeVisible();
  await expect(page.locator('[data-exhibit-id]')).toHaveCount(8);
  await page.locator('[data-exhibit-id="arcade-terminal"]').click();
  await expect(page.locator('[data-exhibit-id="arcade-terminal"]'))
    .toHaveAttribute('aria-current', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-exhibit-id="pocket-play"]'))
    .toHaveAttribute('aria-current', 'true');
  expect(errors).toEqual([]);
});

const expectedClockwiseIds = [
  'pocket-care',
  'learning-computer',
  'home-console',
  'wide-handheld',
  'dual-lcd-pocket',
  'block-handheld',
  'arcade-terminal',
  'pocket-play',
];

async function getOneSnapDragPoints(page) {
  const canvas = page.locator('.museum-canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('museum canvas has no bounding box');
  const y = box.y + box.height / 2;
  const fromX = box.x + Math.min(440, box.width * 0.7);
  return { fromX, toX: fromX + 40, y };
}

async function dragOneSnapWithMouse(page) {
  const { fromX, toX, y } = await getOneSnapDragPoints(page);
  await page.mouse.move(fromX, y);
  await page.mouse.down();
  await page.mouse.move(toX, y, { steps: 4 });
  await page.mouse.up();
}

async function dragOneSnapWithTouch(cdp, page, pointerId) {
  const { fromX, toX, y } = await getOneSnapDragPoints(page);
  const point = (x) => ({
    x, y, id: pointerId, radiusX: 1, radiusY: 1, force: 1,
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [point(fromX)],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [point(toX)],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
}

test('mouse rotates a full turn and snaps to all eight exhibits', async ({ page }) => {
  await page.goto('/');
  for (const id of expectedClockwiseIds) {
    await dragOneSnapWithMouse(page);
    await expect(page.locator(`[data-exhibit-id="${id}"]`))
      .toHaveAttribute('aria-current', 'true');
  }
});

test.describe('native touch orbit', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test('touch rotates a full turn and snaps to all eight exhibits', async ({ page }) => {
    await page.goto('/');
    const cdp = await page.context().newCDPSession(page);
    try {
      for (let index = 0; index < expectedClockwiseIds.length; index += 1) {
        await dragOneSnapWithTouch(cdp, page, index + 1);
        await expect(page.locator(
          `[data-exhibit-id="${expectedClockwiseIds[index]}"]`,
        )).toHaveAttribute('aria-current', 'true');
      }
    } finally {
      await cdp.detach();
    }
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('keeps navigation functional', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-exhibit-id="pocket-care"]'))
      .toHaveAttribute('aria-current', 'true');
  });
});

test('keeps the eight-device archive usable when WebGL creation fails', async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('3D is unavailable');
  await expect(page.locator('[data-exhibit-id]')).toHaveCount(8);
  await page.locator('[data-exhibit-id="learning-computer"]').click();
  await expect(page.locator('[data-exhibit-id="learning-computer"]'))
    .toHaveAttribute('aria-current', 'true');
});
```

- [ ] 在同一 spec 增加真实 canvas 点击测试：用初始 camera/layout 的确定性投影坐标和 `page.mouse.move/down/up` 命中一个非 active proxy，禁止改点 rail 或 `dispatchEvent` 伪造；断言相应 rail button 成为 `aria-current`，而移动超过 6 px 的同一路径只旋转/吸附、不触发 proxy activation。随后点击 glass icon，断言它也走同一 selection/snap，但不会触发阶段 03 预留的 activation。
- [ ] 减少动态 E2E 不只按方向键：在 `reducedMotion: 'reduce'` project 中分别完成一次 canvas proxy 点击与一次 rail 点击，断言 `#app[data-motion-mode="instant"]`、active ID 正确、没有中间聚焦/惯性状态且无 `pageerror`。常规和减少动态的 focus pose 数值由 Task 5 纯测试负责；阶段 03 再用真实 portal E2E 覆盖 focus/restore。
- [ ] 单元扩展门禁固定用至少 10 条 synthetic records：registry validator 以显式 `expectedCount: 10` 通过、ring/controller/scene 生成 10 项、generic placeholder 不抛、rail 标记 overflow 且第 10 项可键盘聚焦。本轮默认 registry 与阶段 02 发布门禁仍必须正好 8/8，不能为了扩展性把 launch assertion 改成 `>= 8`。
- [ ] 运行旧守卫和新守卫：

```bash
npm run verify:museum-foundation
npm run verify:structure
npm run verify:hub-accent
npm run verify:hub-preview-frame
npm run verify:game-boy-language-switch
npm run verify:dammagotchi-localized-home
```

预期：六条命令全部以状态码 0 结束，且不再依赖旧根 switcher。

- [ ] 运行完整阶段门禁：

```bash
npm test
npm run build
npm run test:e2e
```

预期：Vitest、三个生产构建和 Playwright 全部通过；浏览器控制台无未处理错误；鼠标与 touch Pointer Events 都跨过 0/360 seam，按固定顺序各命中八个 `aria-current`；真实 canvas proxy 点击与 glass icon 点击均选择/吸附，减少动态路径立即稳定。

- [ ] 提交：

```bash
git add scripts/verify-structure.mjs scripts/verify-hub-accent.mjs \
  scripts/verify-hub-preview-frame.mjs scripts/verify-game-boy-language-switch.mjs \
  scripts/verify-dammagotchi-localized-home.mjs tests/e2e/museum-foundation.spec.js
git commit -m "test(e2e): verify museum foundation behavior"
```

## 阶段完成门禁

- [ ] 运行 `git status --short`，确认只剩计划外明确保留的三个研究 JSON。
- [ ] 运行 `npm test && npm run verify:museum-foundation && npm run build && npm run test:e2e`，预期全部通过。
- [ ] 运行 `npm run preview`，在输出地址确认 1440×900、390×844、减少动态三种视口；保持服务器运行，供用户预览。
- [ ] 记录本阶段实际命令输出和预览 URL，再进入开放资产管线计划。
