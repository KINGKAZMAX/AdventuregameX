# GameX Air Control 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 在顶层 GameX Hub 中交付默认关闭、用户主动授权、完全本地推理的 Air Control：张手移动应用内光标，握拳产生一次左键按下并维持拖动，重新张手释放；任意丢手、错误、切换、后台、停止或 `Escape` 都不会留下卡住的按键。

**架构：** 摄像头帧由 `CameraSession` 取得，`FramePump` 以最多一帧在途的方式把 `ImageBitmap` 交给模块 Worker；Worker 使用自托管的 MediaPipe Gesture Recognizer 识别一只手并只返回手势、置信度和掌心坐标。主线程完成 One Euro 平滑与迟滞状态机，再由 `AirInputAdapter` 产生阶段 03 已定义的 `gamex:input`，经同一个 `InputRouter` 路由到展馆或当前 FocusPortal；Air Control 不建立第二套父子协议，也不伪造系统鼠标事件。

**技术栈：** Vite 6、原生 ES modules、Web Worker、MediaDevices、`requestVideoFrameCallback`、`ImageBitmap`、`@mediapipe/tasks-vision@0.10.35`、Vitest 4.1.10、happy-dom 20.11.1、Playwright 1.61.1。

---

## 进入条件与固定契约

- 先完整执行 `docs/superpowers/plans/2026-07-24-gamex-03-focus-portals-memory.md`。
- 阶段 03 的 `src/input/input-router.js` 必须导出 `createInputRouter({ museumTarget })`，返回：

```text
{
  setPortalTarget(targetOrNull, { releaseReason }),
  subscribeTargetChange(listener),
  subscribeAction(listener),
  route(action),
  releaseAll(reason),
  getSnapshot(),
  destroy(),
}
```

- `museumTarget` 与活动 portal target 都提供 `input(action)` 和 `releaseAll(reason)`。
- 阶段 03 的 `createMuseumApp()` 必须把 `inputRouter.subscribeAction` 暴露为只读观察缝 `subscribeInput(listener)`；`src/runtime/care-needs.js` 必须导出唯一的 `CARE_NEEDS`、`CARE_NEED_PATTERN` 与 `isCareNeed`。任一项缺失都先回到阶段 03 修复，阶段 04 不复制 router 或照料 taxonomy。
- Air Control 只调用上述 API。它不直接访问 iframe，不新增 air-only `postMessage` 类型，也不改动阶段 03 固定的协议版本。
- `route(action)` 接收的 Air Control 动作固定为：

```js
const action = {
  type: 'gamex:input',
  v: 1,
  source: 'air-control',
  phase: 'move', // 或 down / up
  nx: 0.5,
  ny: 0.5,
  buttons: 0,
  seq: 42,
  timestamp: 1784880000000,
};
```

- `release-all` 通过 `inputRouter.releaseAll(reason)` 发送，不伪装成 `phase`。
- 模型固定保存为 `third_party/mediapipe/gesture-recognizer/float16/1/gesture_recognizer.task`，SHA-256 必须为 `97952348cf6a6a4915c2ea1496b4b37ebabc50cbbf80571435643c455f2b0482`。
- MediaPipe Worker 固定使用 `runningMode: 'VIDEO'`、`numHands: 1`、`delegate: 'CPU'`，并只允许 `Closed_Fist` 与 `Open_Palm`。

## 文件结构

### 修改

- `package.json`、`package-lock.json`：精确锁定 MediaPipe，增加 Air Control 验证与 E2E 开发脚本。
- `scripts/prepare-apps.mjs`：把六个官方原名 WASM 文件与已校验模型复制到生成的 `public/air-control/`。
- `src/museum/create-museum-app.js`：把既有 `InputRouter` 注入 Air Control，并在销毁时停止摄像头。
- `src/main.js`：只在 Playwright 的 Vite `test` mode 读取依赖注入测试缝，不改变生产路径。
- `src/styles.css`：增加白底可读的 Air Control HUD、应用内光标、预览和状态样式。
- `vite.config.js`：开发与预览响应都声明 `Permissions-Policy: camera=(self)`。
- `playwright.config.js`：E2E 使用 `vite --mode test`，让假摄像头与假 Worker 可在页面启动前注入。

### 创建

- `scripts/air-control-assets.mjs`：WASM 文件名、模型路径、固定哈希和源/生成资源验证。
- `scripts/verify-air-control.mjs`：阶段门禁；检查版本、哈希、自托管资源、隐私约束和禁止远程运行时 URL。
- `third_party/mediapipe/gesture-recognizer/float16/1/gesture_recognizer.task`：官方手势识别模型二进制。
- `src/air-control/one-euro-filter.js`：标量与二维坐标的 One Euro Filter。
- `src/air-control/palm-tracking.js`：从腕点及四个掌指关节计算镜像掌心坐标。
- `src/air-control/gesture-state-machine.js`：置信度迟滞、稳定时间、单次 down/up、点击判定、冷却和丢手释放。
- `src/air-control/gesture-result.js`：把 MediaPipe 结果缩减成单手手势、分数与掌心坐标。
- `src/air-control/gesture.worker.js`：MediaPipe 初始化与同步 `recognizeForVideo()` 的 Worker 隔离。
- `src/air-control/gesture-worker-client.js`：Worker 生命周期、最多一帧在途、超时与安全终止。
- `src/air-control/camera-session.js`：安全上下文检查、摄像头权限、视频绑定与 track 清理。
- `src/air-control/frame-pump.js`：`requestVideoFrameCallback`/RAF 取帧和 20fps 上限。
- `src/air-control/air-input-adapter.js`：状态事件到阶段 03 `InputRouter` 动作。
- `src/air-control/create-air-control-hud.js`：启用、停止、预览、状态文字和空气光标。
- `src/air-control/create-air-control.js`：摄像头、Worker、取帧、输入与生命周期的组合根。
- `tests/unit/air-control/air-assets.test.js`
- `tests/unit/air-control/one-euro-filter.test.js`
- `tests/unit/air-control/gesture-state-machine.test.js`
- `tests/unit/air-control/gesture-result.test.js`
- `tests/unit/air-control/gesture-worker-client.test.js`
- `tests/unit/air-control/camera-session.test.js`
- `tests/unit/air-control/frame-pump.test.js`
- `tests/unit/air-control/air-input-adapter.test.js`
- `tests/unit/air-control/create-air-control-hud.test.js`
- `tests/unit/air-control/create-air-control.test.js`
- `tests/e2e/air-control.spec.js`
- `docs/testing/air-control-device-matrix.md`

## Task 1：锁定 SDK 并自托管模型与 WASM

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `scripts/prepare-apps.mjs`
- Create: `scripts/air-control-assets.mjs`
- Create: `scripts/verify-air-control.mjs`
- Create: `third_party/mediapipe/gesture-recognizer/float16/1/gesture_recognizer.task`
- Test: `tests/unit/air-control/air-assets.test.js`

- [ ] **步骤 1：创建资源契约失败测试**

创建 `tests/unit/air-control/air-assets.test.js`：

```js
import { describe, expect, it } from 'vitest';
import {
  AIR_MODEL,
  MEDIAPIPE_WASM_FILES,
  assertAirControlSourceAssets,
} from '../../../scripts/air-control-assets.mjs';

describe('Air Control self-hosted assets', () => {
  it('pins the reviewed model and all six official WASM names', () => {
    expect(AIR_MODEL).toEqual({
      sourcePath: 'third_party/mediapipe/gesture-recognizer/float16/1/gesture_recognizer.task',
      publicPath: 'air-control/models/gesture_recognizer.task',
      sha256: '97952348cf6a6a4915c2ea1496b4b37ebabc50cbbf80571435643c455f2b0482',
    });
    expect(MEDIAPIPE_WASM_FILES).toEqual([
      'vision_wasm_internal.js',
      'vision_wasm_internal.wasm',
      'vision_wasm_module_internal.js',
      'vision_wasm_module_internal.wasm',
      'vision_wasm_nosimd_internal.js',
      'vision_wasm_nosimd_internal.wasm',
    ]);
  });

  it('finds an exact-version SDK and a matching local model hash', () => {
    expect(() => assertAirControlSourceAssets()).not.toThrow();
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
npm test -- tests/unit/air-control/air-assets.test.js
```

预期：FAIL，错误包含 `Cannot find module '../../../scripts/air-control-assets.mjs'`。

- [ ] **步骤 3：安装精确 SDK 版本**

运行：

```bash
npm install --save-exact @mediapipe/tasks-vision@0.10.35
```

预期：`package.json` 出现 `"@mediapipe/tasks-vision": "0.10.35"`，`package-lock.json` 更新，命令状态码为 0。

- [ ] **步骤 4：下载固定模型并先在命令行校验**

运行：

```bash
mkdir -p third_party/mediapipe/gesture-recognizer/float16/1
curl --fail --location \
  --output third_party/mediapipe/gesture-recognizer/float16/1/gesture_recognizer.task \
  https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task
printf '%s  %s\n' \
  '97952348cf6a6a4915c2ea1496b4b37ebabc50cbbf80571435643c455f2b0482' \
  'third_party/mediapipe/gesture-recognizer/float16/1/gesture_recognizer.task' \
  | shasum -a 256 -c -
```

预期：最后一行是 `third_party/mediapipe/gesture-recognizer/float16/1/gesture_recognizer.task: OK`。

- [ ] **步骤 5：实现源资源与生成资源校验**

创建 `scripts/air-control-assets.mjs`：

```js
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const MEDIAPIPE_WASM_FILES = [
  'vision_wasm_internal.js',
  'vision_wasm_internal.wasm',
  'vision_wasm_module_internal.js',
  'vision_wasm_module_internal.wasm',
  'vision_wasm_nosimd_internal.js',
  'vision_wasm_nosimd_internal.wasm',
];

export const AIR_MODEL = Object.freeze({
  sourcePath: 'third_party/mediapipe/gesture-recognizer/float16/1/gesture_recognizer.task',
  publicPath: 'air-control/models/gesture_recognizer.task',
  sha256: '97952348cf6a6a4915c2ea1496b4b37ebabc50cbbf80571435643c455f2b0482',
});

function requireFile(path) {
  if (!existsSync(path)) throw new Error(`Missing Air Control asset: ${path}`);
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

export function assertAirControlSourceAssets(root = process.cwd()) {
  const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  if (packageJson.dependencies?.['@mediapipe/tasks-vision'] !== '0.10.35') {
    throw new Error('@mediapipe/tasks-vision must equal 0.10.35');
  }
  for (const name of MEDIAPIPE_WASM_FILES) {
    requireFile(join(root, 'node_modules/@mediapipe/tasks-vision/wasm', name));
  }
  const modelPath = join(root, AIR_MODEL.sourcePath);
  requireFile(modelPath);
  const actual = sha256(modelPath);
  if (actual !== AIR_MODEL.sha256) {
    throw new Error(`Gesture model SHA-256 mismatch: ${actual}`);
  }
}

export function assertPreparedAirControlAssets(
  root = process.cwd(),
  publicRoot = 'public',
) {
  for (const name of MEDIAPIPE_WASM_FILES) {
    requireFile(join(root, publicRoot, 'air-control/wasm', name));
  }
  const preparedModel = join(root, publicRoot, AIR_MODEL.publicPath);
  requireFile(preparedModel);
  const actual = sha256(preparedModel);
  if (actual !== AIR_MODEL.sha256) {
    throw new Error(`Prepared gesture model SHA-256 mismatch: ${actual}`);
  }
}
```

- [ ] **步骤 6：让现有 prepare 脚本复制自托管资源**

在 `scripts/prepare-apps.mjs` 的两个子应用 `copyTree(...)` 之后追加：

```js
copyTree(
  'node_modules/@mediapipe/tasks-vision/wasm',
  `${targetRoot}/air-control/wasm`,
);
copyTree(
  'third_party/mediapipe/gesture-recognizer/float16/1',
  `${targetRoot}/air-control/models`,
);
```

- [ ] **步骤 7：创建可独立运行的资源门禁**

创建 `scripts/verify-air-control.mjs` 的初始版本：

```js
import {
  assertAirControlSourceAssets,
  assertPreparedAirControlAssets,
} from './air-control-assets.mjs';

assertAirControlSourceAssets();
assertPreparedAirControlAssets();
console.log('air-control assets verified');
```

- [ ] **步骤 8：运行测试并验证生成目录**

运行：

```bash
npm test -- tests/unit/air-control/air-assets.test.js
node scripts/prepare-apps.mjs public
node scripts/verify-air-control.mjs
```

预期：Vitest 的 2 个测试通过；最后输出 `air-control assets verified`；`public/air-control/wasm/` 含六个官方原名文件，`public/air-control/models/gesture_recognizer.task` 哈希匹配。

- [ ] **步骤 9：Commit**

```bash
git add package.json package-lock.json scripts/prepare-apps.mjs \
  scripts/air-control-assets.mjs scripts/verify-air-control.mjs \
  third_party/mediapipe/gesture-recognizer/float16/1/gesture_recognizer.task \
  tests/unit/air-control/air-assets.test.js
git commit -m "build(air): self-host pinned gesture assets"
```

## Task 2：计算掌心并实现 One Euro 平滑

**Files:**

- Create: `src/air-control/one-euro-filter.js`
- Create: `src/air-control/palm-tracking.js`
- Test: `tests/unit/air-control/one-euro-filter.test.js`

- [ ] **步骤 1：编写掌心镜像、平滑和 reset 的失败测试**

创建 `tests/unit/air-control/one-euro-filter.test.js`：

```js
import { describe, expect, it } from 'vitest';
import { createPointSmoother } from '../../../src/air-control/one-euro-filter.js';
import { palmCenter } from '../../../src/air-control/palm-tracking.js';

function landmarksAt(x, y) {
  return Array.from({ length: 21 }, () => ({ x, y, z: 0, visibility: 1 }));
}

describe('palm tracking', () => {
  it('averages wrist and MCP joints and mirrors camera X', () => {
    const landmarks = landmarksAt(0, 0);
    for (const index of [0, 5, 9, 13, 17]) {
      landmarks[index] = { x: 0.25, y: 0.4, z: 0, visibility: 1 };
    }
    expect(palmCenter(landmarks)).toEqual({ nx: 0.75, ny: 0.4 });
  });

  it('smooths a jump and reset makes the next point immediate', () => {
    const smoother = createPointSmoother({
      minCutoff: 1,
      beta: 0,
      dCutoff: 1,
    });
    expect(smoother.filter({ nx: 0.2, ny: 0.2 }, 0)).toEqual({ nx: 0.2, ny: 0.2 });
    const smoothed = smoother.filter({ nx: 0.8, ny: 0.8 }, 16);
    expect(smoothed.nx).toBeGreaterThan(0.2);
    expect(smoothed.nx).toBeLessThan(0.8);
    expect(smoothed.ny).toBeCloseTo(smoothed.nx, 8);
    smoother.reset();
    expect(smoother.filter({ nx: 0.8, ny: 0.8 }, 32)).toEqual({ nx: 0.8, ny: 0.8 });
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
npm test -- tests/unit/air-control/one-euro-filter.test.js
```

预期：FAIL，错误包含 `Cannot find module '../../../src/air-control/one-euro-filter.js'`。

- [ ] **步骤 3：实现 One Euro Filter**

创建 `src/air-control/one-euro-filter.js`：

```js
function smoothingFactor(deltaSeconds, cutoff) {
  const tau = 1 / (2 * Math.PI * cutoff);
  return 1 / (1 + tau / deltaSeconds);
}

function mix(previous, next, alpha) {
  return previous + alpha * (next - previous);
}

export function createOneEuroFilter({
  minCutoff = 1,
  beta = 0.12,
  dCutoff = 1,
} = {}) {
  let previousTime = null;
  let previousRaw = 0;
  let previousFiltered = 0;
  let previousDerivative = 0;

  return {
    filter(value, timestamp) {
      if (!Number.isFinite(value) || !Number.isFinite(timestamp)) {
        throw new TypeError('One Euro input must be finite');
      }
      if (previousTime === null) {
        previousTime = timestamp;
        previousRaw = value;
        previousFiltered = value;
        return value;
      }
      const deltaSeconds = Math.max((timestamp - previousTime) / 1000, 1 / 240);
      const derivative = (value - previousRaw) / deltaSeconds;
      previousDerivative = mix(
        previousDerivative,
        derivative,
        smoothingFactor(deltaSeconds, dCutoff),
      );
      const cutoff = minCutoff + beta * Math.abs(previousDerivative);
      previousFiltered = mix(
        previousFiltered,
        value,
        smoothingFactor(deltaSeconds, cutoff),
      );
      previousRaw = value;
      previousTime = timestamp;
      return previousFiltered;
    },
    reset() {
      previousTime = null;
      previousRaw = 0;
      previousFiltered = 0;
      previousDerivative = 0;
    },
  };
}

export function createPointSmoother(options) {
  const x = createOneEuroFilter(options);
  const y = createOneEuroFilter(options);
  return {
    filter(point, timestamp) {
      return {
        nx: Math.min(1, Math.max(0, x.filter(point.nx, timestamp))),
        ny: Math.min(1, Math.max(0, y.filter(point.ny, timestamp))),
      };
    },
    reset() {
      x.reset();
      y.reset();
    },
  };
}
```

- [ ] **步骤 4：实现掌心计算**

创建 `src/air-control/palm-tracking.js`：

```js
const PALM_LANDMARKS = [0, 5, 9, 13, 17];

export function palmCenter(landmarks) {
  if (!Array.isArray(landmarks) || landmarks.length < 18) {
    throw new TypeError('Gesture result must contain 21 hand landmarks');
  }
  const sum = PALM_LANDMARKS.reduce(
    (value, index) => ({
      x: value.x + landmarks[index].x,
      y: value.y + landmarks[index].y,
    }),
    { x: 0, y: 0 },
  );
  return {
    nx: Math.min(1, Math.max(0, 1 - sum.x / PALM_LANDMARKS.length)),
    ny: Math.min(1, Math.max(0, sum.y / PALM_LANDMARKS.length)),
  };
}
```

- [ ] **步骤 5：运行测试验证通过**

运行：

```bash
npm test -- tests/unit/air-control/one-euro-filter.test.js
```

预期：2 个测试 PASS。

- [ ] **步骤 6：Commit**

```bash
git add src/air-control/one-euro-filter.js src/air-control/palm-tracking.js \
  tests/unit/air-control/one-euro-filter.test.js
git commit -m "feat(air): smooth mirrored palm coordinates"
```

## Task 3：实现握拳与张手的安全状态机

**Files:**

- Create: `src/air-control/gesture-state-machine.js`
- Test: `tests/unit/air-control/gesture-state-machine.test.js`

- [ ] **步骤 1：编写迟滞、单次 down/up、点击、冷却和丢手的失败测试**

创建 `tests/unit/air-control/gesture-state-machine.test.js`：

```js
import { describe, expect, it } from 'vitest';
import { createGestureStateMachine } from '../../../src/air-control/gesture-state-machine.js';

const point = (nx = 0.5, ny = 0.5) => ({ nx, ny });
const phases = (events) => events.map((event) => event.phase);

describe('gesture state machine', () => {
  it('emits one down after 150ms and one up after 100ms', () => {
    const machine = createGestureStateMachine();
    expect(phases(machine.update({
      timestamp: 0, gesture: 'Closed_Fist', score: 0.9, point: point(),
    }))).toEqual(['move']);
    expect(phases(machine.update({
      timestamp: 149, gesture: 'Closed_Fist', score: 0.9, point: point(),
    }))).toEqual(['move']);
    expect(phases(machine.update({
      timestamp: 150, gesture: 'Closed_Fist', score: 0.9, point: point(),
    }))).toEqual(['move', 'down']);
    expect(phases(machine.update({
      timestamp: 200, gesture: 'Closed_Fist', score: 0.9, point: point(0.51),
    }))).toEqual(['move']);
    expect(phases(machine.update({
      timestamp: 220, gesture: 'Open_Palm', score: 0.8, point: point(0.51),
    }))).toEqual(['move']);
    const released = machine.update({
      timestamp: 320, gesture: 'Open_Palm', score: 0.8, point: point(0.51),
    });
    expect(phases(released)).toEqual(['move', 'up']);
    expect(released.at(-1).click).toBe(true);
  });

  it('does not transition below confidence thresholds', () => {
    const machine = createGestureStateMachine();
    machine.update({
      timestamp: 0, gesture: 'Closed_Fist', score: 0.74, point: point(),
    });
    expect(phases(machine.update({
      timestamp: 500, gesture: 'Closed_Fist', score: 0.74, point: point(),
    }))).toEqual(['move']);
    expect(machine.getSnapshot().held).toBe(false);
  });

  it('marks a long drag as non-click and enforces release cooldown', () => {
    const machine = createGestureStateMachine();
    machine.update({
      timestamp: 0, gesture: 'Closed_Fist', score: 0.9, point: point(0.2),
    });
    machine.update({
      timestamp: 150, gesture: 'Closed_Fist', score: 0.9, point: point(0.2),
    });
    machine.update({
      timestamp: 200, gesture: 'Open_Palm', score: 0.8, point: point(0.7),
    });
    const up = machine.update({
      timestamp: 300, gesture: 'Open_Palm', score: 0.8, point: point(0.7),
    }).at(-1);
    expect(up.phase).toBe('up');
    expect(up.click).toBe(false);
    machine.update({
      timestamp: 320, gesture: 'Closed_Fist', score: 0.9, point: point(0.7),
    });
    expect(phases(machine.update({
      timestamp: 500, gesture: 'Closed_Fist', score: 0.9, point: point(0.7),
    }))).toEqual(['move']);
  });

  it('releases once after 250ms without a tracked hand', () => {
    const machine = createGestureStateMachine();
    machine.update({
      timestamp: 0, gesture: 'Closed_Fist', score: 0.9, point: point(),
    });
    machine.update({
      timestamp: 150, gesture: 'Closed_Fist', score: 0.9, point: point(),
    });
    expect(machine.update({
      timestamp: 399, gesture: null, score: 0, point: null,
    })).toEqual([]);
    expect(machine.update({
      timestamp: 400, gesture: null, score: 0, point: null,
    })).toEqual([expect.objectContaining({
      phase: 'release-all',
      reason: 'hand-lost',
      buttons: 0,
    })]);
    expect(machine.update({
      timestamp: 500, gesture: null, score: 0, point: null,
    })).toEqual([]);
  });

  it('requires an open neutral pose after a target change', () => {
    const machine = createGestureStateMachine();
    machine.reset({ requireNeutral: true });
    machine.update({ timestamp: 0, gesture: 'Closed_Fist', score: 0.9, point: point() });
    expect(phases(machine.update({
      timestamp: 300, gesture: 'Closed_Fist', score: 0.9, point: point(),
    }))).toEqual(['move']);
    machine.update({ timestamp: 310, gesture: 'Open_Palm', score: 0.9, point: point() });
    machine.update({ timestamp: 410, gesture: 'Open_Palm', score: 0.9, point: point() });
    machine.update({ timestamp: 420, gesture: 'Closed_Fist', score: 0.9, point: point() });
    expect(phases(machine.update({
      timestamp: 570, gesture: 'Closed_Fist', score: 0.9, point: point(),
    }))).toEqual(['move', 'down']);
  });

  it('does not release before seeing a hand and requires neutral after hand loss', () => {
    const machine = createGestureStateMachine();
    expect(machine.update({
      timestamp: 1000, gesture: null, score: 0, point: null,
    })).toEqual([]);
    machine.update({
      timestamp: 1100, gesture: 'Closed_Fist', score: 0.9, point: point(),
    });
    machine.update({
      timestamp: 1250, gesture: 'Closed_Fist', score: 0.9, point: point(),
    });
    expect(phases(machine.update({
      timestamp: 1500, gesture: null, score: 0, point: null,
    }))).toEqual(['release-all']);
    machine.update({
      timestamp: 1510, gesture: 'Closed_Fist', score: 0.9, point: point(),
    });
    expect(phases(machine.update({
      timestamp: 1800, gesture: 'Closed_Fist', score: 0.9, point: point(),
    }))).toEqual(['move']);
    machine.update({
      timestamp: 1810, gesture: 'Open_Palm', score: 0.9, point: point(),
    });
    machine.update({
      timestamp: 1910, gesture: 'Open_Palm', score: 0.9, point: point(),
    });
    machine.update({
      timestamp: 1920, gesture: 'Closed_Fist', score: 0.9, point: point(),
    });
    expect(phases(machine.update({
      timestamp: 2070, gesture: 'Closed_Fist', score: 0.9, point: point(),
    }))).toEqual(['move', 'down']);
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
npm test -- tests/unit/air-control/gesture-state-machine.test.js
```

预期：FAIL，错误包含 `Cannot find module '../../../src/air-control/gesture-state-machine.js'`。

- [ ] **步骤 3：实现状态机**

创建 `src/air-control/gesture-state-machine.js`：

```js
function distance(a, b) {
  return Math.hypot(a.nx - b.nx, a.ny - b.ny);
}

export function createGestureStateMachine({
  closedScore = 0.75,
  openScore = 0.55,
  closeHoldMs = 150,
  openHoldMs = 100,
  lostReleaseMs = 250,
  clickDistance = 0.035,
  clickCooldownMs = 250,
} = {}) {
  let held = false;
  let candidate = null;
  let candidateSince = 0;
  let lastSeenAt = -Infinity;
  let lastReleaseAt = -Infinity;
  let downPoint = null;
  let lostReleased = false;
  let requireNeutral = false;

  function setCandidate(next, timestamp) {
    if (candidate !== next) {
      candidate = next;
      candidateSince = timestamp;
    }
  }

  function releaseAll(reason, timestamp) {
    held = false;
    candidate = null;
    downPoint = null;
    lastReleaseAt = timestamp;
    lostReleased = true;
    requireNeutral = true;
    return [{
      phase: 'release-all',
      buttons: 0,
      reason,
      timestamp,
    }];
  }

  function update({ timestamp, gesture, score, point }) {
    if (!Number.isFinite(timestamp)) throw new TypeError('timestamp must be finite');
    if (!point) {
      candidate = null;
      if (!lostReleased
        && Number.isFinite(lastSeenAt)
        && timestamp - lastSeenAt >= lostReleaseMs) {
        return releaseAll('hand-lost', timestamp);
      }
      return [];
    }

    lastSeenAt = timestamp;
    lostReleased = false;
    const move = () => [{
      phase: 'move',
      nx: point.nx,
      ny: point.ny,
      buttons: held ? 1 : 0,
      timestamp,
    }];

    if (requireNeutral) {
      if (gesture === 'Open_Palm' && score >= openScore) {
        setCandidate('neutral', timestamp);
        if (timestamp - candidateSince >= openHoldMs) {
          requireNeutral = false;
          candidate = null;
        }
      } else {
        candidate = null;
      }
      return move();
    }

    if (gesture === 'Closed_Fist' && score >= closedScore) {
      setCandidate('closed', timestamp);
      const cooledDown = timestamp - lastReleaseAt >= clickCooldownMs;
      if (!held && cooledDown && timestamp - candidateSince >= closeHoldMs) {
        const events = move();
        held = true;
        downPoint = point;
        return [...events, {
          phase: 'down',
          nx: point.nx,
          ny: point.ny,
          buttons: 1,
          timestamp,
        }];
      }
      return move();
    }

    if (gesture === 'Open_Palm' && score >= openScore) {
      setCandidate('open', timestamp);
      if (held && timestamp - candidateSince >= openHoldMs) {
        const events = move();
        held = false;
        const click = downPoint !== null && distance(downPoint, point) <= clickDistance;
        downPoint = null;
        lastReleaseAt = timestamp;
        return [...events, {
          phase: 'up',
          nx: point.nx,
          ny: point.ny,
          buttons: 0,
          click,
          timestamp,
        }];
      }
      return move();
    }

    candidate = null;
    return move();
  }

  return {
    update,
    releaseAll,
    reset({ requireNeutral: nextRequireNeutral = false } = {}) {
      held = false;
      candidate = null;
      candidateSince = 0;
      lastSeenAt = -Infinity;
      lastReleaseAt = -Infinity;
      downPoint = null;
      lostReleased = false;
      requireNeutral = nextRequireNeutral;
    },
    getSnapshot() {
      return { held, candidate, lastSeenAt, lastReleaseAt, requireNeutral };
    },
  };
}
```

- [ ] **步骤 4：运行测试验证通过**

运行：

```bash
npm test -- tests/unit/air-control/gesture-state-machine.test.js
```

预期：6 个测试 PASS。

- [ ] **步骤 5：Commit**

```bash
git add src/air-control/gesture-state-machine.js \
  tests/unit/air-control/gesture-state-machine.test.js
git commit -m "feat(air): map fist and palm with safe hysteresis"
```

## Task 4：把同步 MediaPipe 推理隔离到单帧 Worker

**Files:**

- Create: `src/air-control/gesture-result.js`
- Create: `src/air-control/gesture.worker.js`
- Create: `src/air-control/gesture-worker-client.js`
- Test: `tests/unit/air-control/gesture-result.test.js`
- Test: `tests/unit/air-control/gesture-worker-client.test.js`

- [ ] **步骤 1：编写结果收缩与单帧在途失败测试**

创建 `tests/unit/air-control/gesture-result.test.js`：

```js
import { describe, expect, it } from 'vitest';
import { compactGestureResult } from '../../../src/air-control/gesture-result.js';

describe('compact gesture result', () => {
  it('keeps only the first allowed gesture and 21 landmarks', () => {
    const landmarks = Array.from({ length: 21 }, (_, index) => ({
      x: index / 20, y: 0.4, z: 0,
    }));
    expect(compactGestureResult({
      gestures: [[{ categoryName: 'Closed_Fist', score: 0.91 }]],
      landmarks: [landmarks],
    })).toEqual({ gesture: 'Closed_Fist', score: 0.91, landmarks });
    expect(compactGestureResult({ gestures: [], landmarks: [] }))
      .toEqual({ gesture: null, score: 0, landmarks: null });
  });
});
```

创建 `tests/unit/air-control/gesture-worker-client.test.js`：

```js
import { describe, expect, it, vi } from 'vitest';
import { createGestureWorkerClient } from '../../../src/air-control/gesture-worker-client.js';

describe('gesture worker client', () => {
  it('allows only one inference request in flight', async () => {
    const sent = [];
    const worker = {
      postMessage: vi.fn((message) => sent.push(message)),
      terminate: vi.fn(),
      addEventListener(type, listener) { this[type] = listener; },
      removeEventListener() {},
    };
    const client = createGestureWorkerClient({ workerFactory: () => worker });
    const initializing = client.init({
      wasmBaseUrl: '/air-control/wasm',
      modelUrl: '/air-control/models/gesture_recognizer.task',
    });
    worker.message({ data: { type: 'ready' } });
    await initializing;
    const first = client.infer({ close: vi.fn() }, 10);
    await expect(client.infer({ close: vi.fn() }, 11))
      .rejects.toMatchObject({ code: 'FRAME_IN_FLIGHT' });
    worker.message({ data: { type: 'result', requestId: sent.at(-1).requestId, sample: { gesture: null } } });
    await expect(first).resolves.toEqual({ gesture: null });
    await client.close();
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it('settles initialization and owns later bitmaps when closed before ready', async () => {
    const worker = {
      postMessage: vi.fn(),
      terminate: vi.fn(),
      addEventListener(type, listener) { this[type] = listener; },
      removeEventListener: vi.fn(),
    };
    const client = createGestureWorkerClient({ workerFactory: () => worker });
    const initializing = client.init({
      wasmBaseUrl: '/air-control/wasm',
      modelUrl: '/air-control/models/gesture_recognizer.task',
    });
    const rejected = expect(initializing).rejects.toMatchObject({
      code: 'WORKER_CLOSED',
    });
    const closing = client.close();
    worker.message({ data: { type: 'closed' } });
    await rejected;
    await closing;

    const bitmap = { close: vi.fn() };
    await expect(client.infer(bitmap, 20)).rejects.toMatchObject({
      code: 'WORKER_CLOSED',
    });
    expect(bitmap.close).toHaveBeenCalledOnce();
    expect(worker.removeEventListener).toHaveBeenCalledTimes(2);
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
});
```

- [ ] **步骤 2：运行测试验证失败**

运行：

```bash
npm test -- tests/unit/air-control/gesture-result.test.js \
  tests/unit/air-control/gesture-worker-client.test.js
```

预期：FAIL，两个实现模块均无法解析。

- [ ] **步骤 3：实现主线程可测试的结果收缩**

创建 `src/air-control/gesture-result.js`：

```js
const ALLOWED = new Set(['Closed_Fist', 'Open_Palm']);

export function compactGestureResult(result) {
  const category = result.gestures?.[0]?.[0];
  const landmarks = result.landmarks?.[0];
  if (!category || !ALLOWED.has(category.categoryName) || landmarks?.length !== 21) {
    return { gesture: null, score: 0, landmarks: null };
  }
  return {
    gesture: category.categoryName,
    score: category.score,
    landmarks: landmarks.map(({ x, y, z }) => ({ x, y, z })),
  };
}
```

- [ ] **步骤 4：实现 Worker，保证 timestamp 严格递增并始终关闭 bitmap**

创建 `src/air-control/gesture.worker.js`：

```js
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';
import { compactGestureResult } from './gesture-result.js';

let recognizer = null;
let lastTimestamp = -1;

async function initialize({ wasmBaseUrl, modelUrl }) {
  const modelResponse = await fetch(modelUrl);
  if (!modelResponse.ok) {
    throw new Error(`gesture model request failed: ${modelResponse.status}`);
  }
  const fileset = await FilesetResolver.forVisionTasks(wasmBaseUrl);
  recognizer = await GestureRecognizer.createFromOptions(fileset, {
    baseOptions: {
      modelAssetBuffer: new Uint8Array(await modelResponse.arrayBuffer()),
      delegate: 'CPU',
    },
    runningMode: 'VIDEO',
    numHands: 1,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    cannedGesturesClassifierOptions: {
      maxResults: 1,
      scoreThreshold: 0,
      categoryAllowlist: ['Closed_Fist', 'Open_Palm'],
    },
  });
}

self.addEventListener('message', async ({ data }) => {
  if (data.type === 'init') {
    try {
      await initialize(data);
      self.postMessage({ type: 'ready' });
    } catch (error) {
      self.postMessage({ type: 'error', code: 'WORKER_INIT', message: error.message });
    }
    return;
  }
  if (data.type === 'infer') {
    try {
      if (!recognizer) throw new Error('recognizer is not ready');
      lastTimestamp = Math.max(lastTimestamp + 1, data.timestamp);
      const sample = compactGestureResult(
        recognizer.recognizeForVideo(data.bitmap, lastTimestamp),
      );
      self.postMessage({ type: 'result', requestId: data.requestId, sample });
    } catch (error) {
      self.postMessage({
        type: 'error',
        requestId: data.requestId,
        code: 'WORKER_INFER',
        message: error.message,
      });
    } finally {
      data.bitmap.close();
    }
  }
  if (data.type === 'close') {
    recognizer?.close();
    recognizer = null;
    self.postMessage({ type: 'closed' });
    self.close();
  }
});
```

- [ ] **步骤 5：实现 Worker client 的 ready、单帧背压、错误和 close**

创建 `src/air-control/gesture-worker-client.js`：

```js
const codedError = (code, message) => Object.assign(new Error(message), { code });

export function createGestureWorkerClient({
  workerFactory = () => new Worker(
    new URL('./gesture.worker.js', import.meta.url),
    { type: 'module' },
  ),
} = {}) {
  const worker = workerFactory();
  let requestId = 0;
  let readyResolve;
  let readyReject;
  let closedResolve;
  let pending = null;
  let closed = false;
  const ready = new Promise((resolve, reject) => {
    readyResolve = resolve;
    readyReject = reject;
  });
  const closedAck = new Promise((resolve) => { closedResolve = resolve; });
  const onMessage = ({ data }) => {
    if (data.type === 'ready') readyResolve();
    if (data.type === 'closed') closedResolve();
    if (data.type === 'result' && pending?.requestId === data.requestId) {
      const { resolve } = pending; pending = null; resolve(data.sample);
    }
    if (data.type === 'error') {
      const error = codedError(data.code, data.message);
      if (pending?.requestId === data.requestId) {
        const { reject } = pending; pending = null; reject(error);
      } else {
        readyReject(error);
      }
    }
  };
  const onError = (event) => {
    const error = codedError('WORKER_CRASH', event.message || 'gesture worker crashed');
    pending?.reject(error); pending = null; readyReject(error);
  };
  worker.addEventListener('message', onMessage);
  worker.addEventListener('error', onError);
  return {
    init(options) {
      if (closed) {
        return Promise.reject(codedError('WORKER_CLOSED', 'gesture worker is closed'));
      }
      try {
        worker.postMessage({ type: 'init', ...options });
      } catch (error) {
        readyReject(codedError('WORKER_START', error.message || 'gesture worker failed to start'));
      }
      return ready;
    },
    async infer(bitmap, timestamp) {
      let transferred = false;
      let ownRequestId = null;
      try {
        if (closed) throw codedError('WORKER_CLOSED', 'gesture worker is closed');
        await ready;
        if (closed) throw codedError('WORKER_CLOSED', 'gesture worker is closed');
        if (pending) throw codedError('FRAME_IN_FLIGHT', 'one gesture frame is already in flight');
        const id = ++requestId;
        ownRequestId = id;
        const promise = new Promise((resolve, reject) => {
          pending = { requestId: id, resolve, reject };
        });
        worker.postMessage({ type: 'infer', requestId: id, bitmap, timestamp }, [bitmap]);
        transferred = true;
        return promise;
      } catch (error) {
        if (pending?.requestId === ownRequestId) pending = null;
        if (!transferred) bitmap.close();
        throw error;
      }
    },
    async close() {
      if (closed) return;
      closed = true;
      const error = codedError('WORKER_CLOSED', 'gesture worker closed');
      readyReject(error);
      pending?.reject(error);
      pending = null;
      try {
        worker.postMessage({ type: 'close' });
        await Promise.race([
          closedAck,
          new Promise((resolve) => setTimeout(resolve, 250)),
        ]);
      } catch {
        // A crashed Worker can throw synchronously; termination still owns cleanup.
      } finally {
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
        worker.terminate();
      }
    },
  };
}
```

- [ ] **步骤 6：运行测试验证通过并提交**

```bash
npm test -- tests/unit/air-control/gesture-result.test.js \
  tests/unit/air-control/gesture-worker-client.test.js
git add src/air-control/gesture-result.js src/air-control/gesture.worker.js \
  src/air-control/gesture-worker-client.js tests/unit/air-control
git commit -m "feat(air): isolate single-frame gesture inference"
```

预期：相关测试全部 PASS。

## Task 5：实现可取消摄像头会话和 20fps 帧泵

**Files:**

- Create: `src/air-control/camera-session.js`
- Create: `src/air-control/frame-pump.js`
- Test: `tests/unit/air-control/camera-session.test.js`
- Test: `tests/unit/air-control/frame-pump.test.js`

- [ ] **步骤 1：编写迟到权限、track 清理和背压失败测试**

```js
import { expect, it, vi } from 'vitest';
import { createCameraSession } from '../../../src/air-control/camera-session.js';

it('stops a stream that resolves after the user cancels permission', async () => {
  let resolvePermission;
  const track = { stop: vi.fn() };
  const stream = { getTracks: () => [track] };
  const mediaDevices = {
    getUserMedia: () => new Promise((resolve) => { resolvePermission = resolve; }),
  };
  const video = { srcObject: null, play: vi.fn(async () => {}) };
  const session = createCameraSession({ video, mediaDevices, secureContext: true });
  const starting = session.start();
  session.stop('cancelled');
  resolvePermission(stream);
  await expect(starting).resolves.toBe('cancelled');
  expect(track.stop).toHaveBeenCalledOnce();
  expect(video.srcObject).toBeNull();
});

it('stops every track when video.play rejects', async () => {
  const track = {
    stop: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  const stream = { getTracks: () => [track], getVideoTracks: () => [track] };
  const video = {
    srcObject: null,
    play: vi.fn(async () => { throw new Error('play blocked'); }),
  };
  const session = createCameraSession({
    video,
    mediaDevices: { getUserMedia: vi.fn(async () => stream) },
    secureContext: true,
  });
  await expect(session.start()).rejects.toThrow('play blocked');
  expect(track.stop).toHaveBeenCalledOnce();
  expect(video.srcObject).toBeNull();
});

it('stops each track once when cancellation races with video.play', async () => {
  let resolvePlay;
  const track = {
    stop: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  const stream = { getTracks: () => [track], getVideoTracks: () => [track] };
  const video = {
    srcObject: null,
    play: vi.fn(() => new Promise((resolve) => { resolvePlay = resolve; })),
    pause: vi.fn(),
  };
  const session = createCameraSession({
    video,
    mediaDevices: { getUserMedia: vi.fn(async () => stream) },
    secureContext: true,
  });
  const starting = session.start();
  await vi.waitFor(() => expect(video.play).toHaveBeenCalledOnce());
  session.stop();
  resolvePlay();
  await expect(starting).resolves.toBe('cancelled');
  expect(track.stop).toHaveBeenCalledOnce();
  expect(video.srcObject).toBeNull();
});
```

同一测试捕获 track 的 `ended`/`mute` listener，调用后断言 `onEnded('track-ended')`；组合根收到该回调必须执行 `stop('track-ended')` 和 `release-all`。在 `frame-pump.test.js` 使用可控 scheduler，断言第一次 `infer()` resolve 前不安排第二次 `createImageBitmap()`；停止后迟到结果不触发 `onSample`。

- [ ] **步骤 2：运行两个测试，预期因模块不存在失败**

```bash
npm test -- tests/unit/air-control/camera-session.test.js \
  tests/unit/air-control/frame-pump.test.js
```

- [ ] **步骤 3：实现 `CameraSession` 的 generation token**

```js
export function createCameraSession({
  video,
  mediaDevices = navigator.mediaDevices,
  secureContext = window.isSecureContext,
  onEnded = () => {},
}) {
  let generation = 0;
  let stream = null;
  let state = 'idle';
  let detachTrackListeners = () => {};
  const stoppedTracks = new WeakSet();
  const stopTracks = (value) => value?.getTracks().forEach((track) => {
    if (stoppedTracks.has(track)) return;
    stoppedTracks.add(track);
    track.stop();
  });
  return {
    get state() { return state; },
    async start() {
      if (!secureContext) throw Object.assign(new Error('camera requires HTTPS or localhost'), { code: 'INSECURE_CONTEXT' });
      const token = ++generation;
      state = 'requesting';
      let next = null;
      try {
        next = await mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 20, max: 30 } },
          audio: false,
        });
        if (token !== generation) {
          stopTracks(next);
          return 'cancelled';
        }
        stream = next;
        const tracks = stream.getVideoTracks();
        const ended = () => {
          if (token !== generation) return;
          onEnded('track-ended');
        };
        tracks.forEach((track) => {
          track.addEventListener('ended', ended);
          track.addEventListener('mute', ended);
        });
        detachTrackListeners = () => tracks.forEach((track) => {
          track.removeEventListener('ended', ended);
          track.removeEventListener('mute', ended);
        });
        video.srcObject = stream;
        await video.play();
        if (token !== generation) {
          detachTrackListeners();
          stopTracks(next);
          if (video.srcObject === next) video.srcObject = null;
          return 'cancelled';
        }
        state = 'active';
        return 'started';
      } catch (error) {
        detachTrackListeners();
        stopTracks(next);
        if (stream === next) stream = null;
        if (video.srcObject === next) video.srcObject = null;
        if (token !== generation) return 'cancelled';
        state = 'error';
        throw error;
      }
    },
    stop() {
      generation += 1;
      detachTrackListeners();
      detachTrackListeners = () => {};
      stopTracks(stream);
      stream = null;
      video.pause?.();
      video.srcObject = null;
      state = 'idle';
    },
  };
}
```

- [ ] **步骤 4：实现 `FramePump`，一次循环只创建一个 bitmap**

```js
export function createFramePump({
  video,
  client,
  onSample,
  onError,
  createBitmap = createImageBitmap,
  now = () => performance.now(),
  maxFps = 20,
}) {
  let running = false;
  let generation = 0;
  let callbackId = 0;
  let lastFrameAt = -Infinity;
  let usingVideoCallback = false;
  const cancel = () => {
    if (usingVideoCallback) video.cancelVideoFrameCallback?.(callbackId);
    else cancelAnimationFrame(callbackId);
  };
  const schedule = (callback) => {
    if (video.requestVideoFrameCallback) {
      usingVideoCallback = true;
      callbackId = video.requestVideoFrameCallback(callback);
    } else {
      usingVideoCallback = false;
      callbackId = requestAnimationFrame(callback);
    }
  };
  const loop = async () => {
    if (!running) return;
    const token = generation;
    const timestamp = now();
    if (timestamp - lastFrameAt >= 1000 / maxFps) {
      lastFrameAt = timestamp;
      try {
        const bitmap = await createBitmap(video);
        const sample = await client.infer(bitmap, timestamp);
        if (running && token === generation) onSample(sample, timestamp);
      } catch (error) {
        if (running && token === generation) onError(error);
      }
    }
    if (running && token === generation) schedule(loop);
  };
  return {
    start() { if (!running) { running = true; generation += 1; schedule(loop); } },
    stop() { running = false; generation += 1; cancel(); },
  };
}
```

- [ ] **步骤 5：运行测试并提交**

```bash
npm test -- tests/unit/air-control/camera-session.test.js \
  tests/unit/air-control/frame-pump.test.js
git add src/air-control/camera-session.js src/air-control/frame-pump.js \
  tests/unit/air-control/camera-session.test.js tests/unit/air-control/frame-pump.test.js
git commit -m "feat(air): own camera and backpressured frame capture"
```

预期：迟到权限、拒绝、stop、RAF 回退和单帧在途测试全部 PASS。

## Task 6：接入统一 InputRouter、HUD 和完整安全释放

**Files:**

- Create: `src/air-control/air-input-adapter.js`
- Create: `src/air-control/create-air-control-hud.js`
- Create: `src/air-control/create-air-control.js`
- Modify: `src/museum/create-museum-app.js`
- Modify: `src/styles.css`
- Modify: `vite.config.js`
- Modify: `scripts/verify-air-control.mjs`
- Test: `tests/unit/air-control/air-input-adapter.test.js`
- Test: `tests/unit/air-control/create-air-control-hud.test.js`
- Test: `tests/unit/air-control/create-air-control.test.js`

- [ ] **步骤 1：写失败测试，锁定标准动作与所有强制释放原因**

```js
import { expect, it, vi } from 'vitest';
import { createAirInputAdapter } from '../../../src/air-control/air-input-adapter.js';

it('routes normalized actions and delegates release-all without fake DOM events', () => {
  const router = { route: vi.fn(), releaseAll: vi.fn() };
  const adapter = createAirInputAdapter({ router, now: () => 1234 });
  adapter.consume([{ phase: 'down', nx: 0.4, ny: 0.6, buttons: 1 }]);
  expect(router.route).toHaveBeenCalledWith({
    type: 'gamex:input', v: 1, source: 'air-control',
    phase: 'down', nx: 0.4, ny: 0.6, buttons: 1,
    seq: 1, timestamp: 1234,
  });
  adapter.releaseAll('page-hidden');
  expect(router.releaseAll).toHaveBeenCalledWith('page-hidden');
});
```

`create-air-control.test.js` 必须用 fake session/client/pump 逐一断言 `worker-error`、`camera-stop`、`page-hidden`、`escape`、`destroy` 各触发一次 `releaseAll(reason)`。还要用 deferred `loadWorkerClient()`/`client.init()` 锁定两个竞态：

1. 第一次 `enable()` 在 ready 前被 `stop()`，第二次 `enable()` 已开始后，第一次的 late rejection 必须正常 settle，且不得停止或改写第二次会话。
2. fake `client.close()` 或 `camera.stop()` 同步抛错时，另一资源仍准确停止一次，最终 `getState()` 为 `off`、光标隐藏；不得出现 unhandled rejection。

目标切换由阶段 03 `InputRouter.setPortalTarget(...)` 唯一释放旧目标；进入 portal 使用 canonical 默认 `releaseReason: 'target-change'`，suspend/close 则保留阶段 03 已测试的语义原因（如 `visibility`、`escape`、`runtime-switch`），全项目禁止另造门户专用 reason。Air 订阅者对每次 target-change 通知都安全中和 held 状态，不按 reason 字符串另造分支，并保持摄像头/Worker 运行。集成测试断言持续握拳切换目标后必须先张手才可再次 down，且新旧目标合计只有一次 release。

- [ ] **步骤 2：运行三个测试，预期实现模块不存在**

```bash
npm test -- tests/unit/air-control/air-input-adapter.test.js \
  tests/unit/air-control/create-air-control-hud.test.js \
  tests/unit/air-control/create-air-control.test.js
```

- [ ] **步骤 3：实现 AirInputAdapter**

```js
export function createAirInputAdapter({ router, now = () => performance.timeOrigin + performance.now() }) {
  let seq = 0;
  return {
    consume(events) {
      for (const event of events) {
        if (event.phase === 'release-all') {
          router.releaseAll(event.reason);
          continue;
        }
        router.route({
          type: 'gamex:input',
          v: 1,
          source: 'air-control',
          phase: event.phase,
          nx: event.nx,
          ny: event.ny,
          buttons: event.buttons,
          seq: ++seq,
          timestamp: now(),
        });
      }
    },
    releaseAll(reason) { router.releaseAll(reason); },
  };
}
```

- [ ] **步骤 4：实现白底 HUD 与应用内光标**

`createAirControlHud({ root, onEnable, onStop })` 必须创建：

```html
<section class="air-control-hud" data-state="off" aria-label="Air Control">
  <button type="button" data-action="enable">Enable Air Control</button>
  <button type="button" data-action="stop" hidden>Stop Camera</button>
  <span role="status" aria-live="polite">Camera off</span>
  <button type="button" data-action="preview" aria-pressed="false">Hide preview</button>
  <video muted playsinline aria-label="Local camera preview"></video>
  <span class="air-cursor" hidden aria-hidden="true"></span>
</section>
```

其 `setState(state, message)` 同时更新 `data-state` 与文字，并执行固定按钮规则：`off/error` 显示 Enable，`requesting/tracking/lost` 显示 Stop Camera，`stopping` 显示禁用的 Stop Camera；因此权限提示被忽略时仍可主动取消。`lost` 必须显示“Hand not detected”，不能伪装为 camera off。`setCursor({ nx, ny, held, visible })` 用 CSS custom properties 定位，held 同时用形状与文字表达；`destroy()` 移除所有 listener 和 DOM。

- [ ] **步骤 5：组合生命周期并只在点击启用后创建 Worker**

`createAirControl({ root, inputRouter, dependencies })` 的 `enable()` 顺序固定为：

1. HUD 进入 `requesting`。
2. `await cameraSession.start()`。
3. 动态 `import('./gesture-worker-client.js')` 并创建 Worker。
4. `await client.init({ wasmBaseUrl, modelUrl })`。
5. 启动 `FramePump`。

Worker 返回的 compact sample 经 `sample.landmarks → palmCenter → pointSmoother.filter → gestureStateMachine.update → AirInputAdapter.consume`。`stop(reason)` 必须先尝试 `adapter.releaseAll(reason)` 并停止 pump，随后立即停止 camera（不能等待 Worker 的 250ms close timeout），再等待 client close；任一 cleanup（包括 router release）同步或异步失败都不得跳过其他 cleanup。最后执行 `pointSmoother.reset()`、`gestureStateMachine.reset({ requireNeutral: true })` 并隐藏光标。`visibilitychange` 隐藏、`Escape`、HMR/destroy 和任何异常都调用该 `stop()`；页面恢复不得自动重启。FocusPortal target 改变时，InputRouter 先唯一一次释放旧目标，Air Control 仅 reset 为 `requireNeutral`，继续跟踪，使手势可在整个 GameX（展馆与两个运行时）中模拟鼠标。

`src/air-control/create-air-control.js` 使用以下组合根；测试依赖注入和生产默认值共用同一条生命周期：

```js
import { createAirInputAdapter } from './air-input-adapter.js';
import { createCameraSession } from './camera-session.js';
import { createAirControlHud } from './create-air-control-hud.js';
import { createFramePump } from './frame-pump.js';
import { createGestureStateMachine } from './gesture-state-machine.js';
import { createPointSmoother } from './one-euro-filter.js';
import { palmCenter } from './palm-tracking.js';

const DEFAULTS = Object.freeze({
  cameraSessionFactory: createCameraSession,
  framePumpFactory: createFramePump,
  loadWorkerClient: () => import('./gesture-worker-client.js'),
  onLifecycleRelease: () => {},
});

export function createAirControl({
  root,
  inputRouter,
  dependencies = {},
  wasmBaseUrl = new URL('./air-control/wasm/', document.baseURI).href,
  modelUrl = new URL(
    './air-control/models/gesture_recognizer.task',
    document.baseURI,
  ).href,
}) {
  const deps = { ...DEFAULTS, ...dependencies };
  const adapter = createAirInputAdapter({ router: inputRouter });
  const smoother = createPointSmoother();
  const machine = createGestureStateMachine();
  let camera = null;
  let client = null;
  let pump = null;
  let generation = 0;
  let state = 'off';
  let stopPromise = null;
  let destroyed = false;
  let hud;

  const consumeSample = (sample, timestamp) => {
    const point = sample.landmarks
      ? smoother.filter(palmCenter(sample.landmarks), timestamp)
      : null;
    const events = machine.update({
      timestamp,
      gesture: sample.gesture,
      score: sample.score,
      point,
    });
    adapter.consume(events);
    const snapshot = machine.getSnapshot();
    hud.setCursor({
      nx: point?.nx ?? 0.5,
      ny: point?.ny ?? 0.5,
      held: snapshot.held,
      visible: Boolean(point),
    });
    if (state === 'tracking') {
      hud.setState(
        point ? 'tracking' : 'lost',
        !point
          ? 'Hand not detected'
          : snapshot.requireNeutral
            ? 'Open your hand to continue'
            : 'Hand tracking active',
      );
    }
  };

  const stop = (reason = 'camera-stop') => {
    if (state === 'off' && !camera && !client && !pump) return Promise.resolve();
    if (stopPromise) return stopPromise;
    generation += 1;
    state = 'stopping';
    try { hud.setState('stopping', 'Stopping camera'); } catch {}
    try { adapter.releaseAll(reason); } catch {}
    try { deps.onLifecycleRelease({ reason, buttons: 0 }); } catch {}
    const closingPump = pump;
    const closingClient = client;
    const closingCamera = camera;
    pump = null;
    client = null;
    camera = null;
    stopPromise = Promise.resolve()
      .then(() => closingClient?.close())
      .catch(() => {})
      .then(() => {
        smoother.reset();
        machine.reset({ requireNeutral: true });
        hud.setCursor({ nx: 0.5, ny: 0.5, held: false, visible: false });
        state = 'off';
        hud.setState('off', 'Camera off');
      })
      .finally(() => { stopPromise = null; });
    try { closingPump?.stop(); } catch {}
    try { closingCamera?.stop(); } catch {}
    return stopPromise;
  };

  const enable = async () => {
    if (destroyed || state !== 'off') return;
    const token = ++generation;
    state = 'requesting';
    hud.setState('requesting', 'Requesting camera permission');
    try {
      camera = deps.cameraSessionFactory({
        video: hud.video,
        onEnded: (reason) => { void stop(reason); },
      });
      const result = await camera.start();
      if (result !== 'started') {
        await stop('camera-stop');
        return;
      }
      if (token !== generation) return;
      const { createGestureWorkerClient } = await deps.loadWorkerClient();
      if (token !== generation) return;
      client = createGestureWorkerClient(dependencies.workerClientOptions);
      await client.init({ wasmBaseUrl, modelUrl });
      if (token !== generation) return;
      pump = deps.framePumpFactory({
        video: hud.video,
        client,
        onSample: consumeSample,
        onError: () => { void stop('worker-error'); },
      });
      pump.start();
      state = 'tracking';
      hud.setState('tracking', 'Hand tracking active');
    } catch (error) {
      if (destroyed || token !== generation) return;
      const denied = error.name === 'NotAllowedError' || error.code === 'NOT_ALLOWED';
      await stop(denied ? 'camera-stop' : 'worker-error');
      if (destroyed || state !== 'off') return;
      hud.setState('error', denied
        ? 'Camera unavailable'
        : 'Air Control unavailable');
    }
  };

  hud = createAirControlHud({
    root,
    onEnable: () => { void enable(); },
    onStop: () => { void stop('camera-stop'); },
  });
  const onVisibility = () => {
    if (document.hidden) void stop('page-hidden');
  };
  const onKeyDown = (event) => {
    if (event.key === 'Escape') void stop('escape');
  };
  const unsubscribeTarget = inputRouter.subscribeTargetChange(
    () => {
      if (state !== 'tracking') return;
      smoother.reset();
      machine.reset({ requireNeutral: true });
      hud.setCursor({ nx: 0.5, ny: 0.5, held: false, visible: false });
      hud.setState('tracking', 'Open your hand to continue');
    },
  );
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('keydown', onKeyDown);

  return {
    enable,
    stop,
    async destroy() {
      if (destroyed) return;
      destroyed = true;
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('keydown', onKeyDown);
      unsubscribeTarget();
      await stop('destroy');
      hud.destroy();
    },
    getState: () => state,
  };
}
```

`createAirControlHud` 的返回值必须准确包含 `{ video, setState, setCursor, destroy }`。`create-air-control.test.js` 对 `cameraSessionFactory/framePumpFactory/loadWorkerClient` 注入 fake，逐一走完成功、拒绝、Worker 错误、track ended、目标切换、后台、Escape 与 destroy；每个路径检查 `releaseAll` 只发生一次，且 stop 完成后 fake track、Worker 和 pump 都为 stopped。

- [ ] **步骤 6：把 Air producer 追加到阶段 03 已有的唯一 InputRouter，不新增协议**

阶段 03 已在 `createMuseumApp` 完成 `scene proxy hit-test → 唯一 exhibit interaction → museumTarget → 唯一 InputRouter → DOM/Air/FocusPortal` 的生产链。本任务禁止再次调用 `createInputRouter()` 或实现第二套 click-vs-drag/Raycaster：`createMuseumApp` 只把现有实例作为 `inputRouter` 注入动态加载的 `createAirControl`。portal 激活调用阶段 03 `setPortalTarget(portalAdapter)` 的 canonical `target-change` 默认原因；退出/挂起调用 `setPortalTarget(null, { releaseReason: lifecycleReason })`，不得在调用前额外 release；Air 仅调用 `route/releaseAll/subscribeTargetChange`。因此 Air 的短“握拳 → 张手”会经同一 6 px/proxy interaction 选择并激活 LIVE 设备，进入 portal 后仍保留全局指针，由阶段 03 唯一 transform 映射到当前 screen rect local 坐标。结构门禁断言整个生产 `src/` 只有 `create-museum-app.js` 一处 `createInputRouter(`，两个子运行时继续使用阶段 03 的显式 `input()` 适配器。

在 `vite.config.js` 的 `server.headers` 和 `preview.headers` 加：

```js
const cameraHeaders = { 'Permissions-Policy': 'camera=(self)' };
```

在 `src/styles.css` 增加白色玻璃 HUD、绿色摄像头状态点、灰色 lost 状态、拳头 held 外圈、可隐藏预览和窄屏不遮挡规则；状态不能只靠颜色。

- [ ] **步骤 7：扩展结构门禁并禁止危险实现**

在 `scripts/verify-air-control.mjs` 递归扫描 `src/air-control`、`src/input` 与两个 runtime adapter，拒绝：

```text
MutationObserver
new KeyboardEvent
new MouseEvent
postMessage(..., '*')
cdn.jsdelivr.net
unpkg.com
/latest/
WebSocket
sendBeacon
XMLHttpRequest
localStorage
indexedDB
```

同时要求 `audio: false`、`categoryAllowlist`、`bitmap.close()`、`recognizer.close()`、`worker.terminate()`、`visibilitychange` 和六种 release reason；唯一允许的 Air `fetch()` 目标是同源 `modelUrl`，不得上传视频帧、截图、landmark 或手势结果。

- [ ] **步骤 8：运行测试与提交**

```bash
npm test -- tests/unit/air-control
node scripts/prepare-apps.mjs public
node scripts/verify-air-control.mjs
git add src/air-control src/museum/create-museum-app.js \
  src/styles.css vite.config.js scripts/verify-air-control.mjs tests/unit/air-control
git commit -m "feat(air): route hand input through the museum safely"
```

预期：全部 Air 单元测试通过，结构门禁输出 `air-control verified`。

## Task 7：用假摄像头完成 E2E，并建立真机矩阵

**Files:**

- Modify: `src/main.js`
- Modify: `playwright.config.js`
- Modify: `scripts/verify-air-control.mjs`
- Create: `tests/e2e/air-control.spec.js`
- Create: `docs/testing/air-control-device-matrix.md`

- [ ] **步骤 1：配置只在 Vite test mode 生效的依赖注入**

在 `playwright.config.js` 把 web server 命令改为 `npm run dev -- --mode test`。`src/main.js` 只能采用下面这种 compile-time 分支；不得用 hostname、query string 或运行时全局是否存在来开启注入：

```js
const testMode = import.meta.env.MODE === 'test';
const app = createMuseumApp({
  airControlDependencies: testMode ? window.__GAME_X_TEST_DEPS__ : undefined,
});

if (testMode) {
  window.__GAME_X_TEST_INPUT_LOG__ = [];
  app.subscribeInput((action) => {
    window.__GAME_X_TEST_INPUT_LOG__.push(structuredClone(action));
  });
}
```

只记录 normalized action，禁止记录帧、图片或关键点。`scripts/verify-air-control.mjs` 在 `npm run build` **之后**枚举 production `dist/**/*.js` 与入口 HTML（阶段 04 的普通 build 仍可有 `.map`，所以这里明确不扫描 source map），确认 executable bundle 中不存在 `__GAME_X_TEST_DEPS__`、`__GAME_X_TEST_INPUT_LOG__` 和 `fake-local-camera`。阶段 05 competition build 会关闭 sourcemap，再对全部公开文本产物执行更严格扫描。

- [ ] **步骤 2：写 E2E 失败场景**

```js
import { expect, test } from '@playwright/test';
import { CARE_NEED_PATTERN } from '../../src/runtime/care-needs.js';

test('moves, holds, drags and releases the museum with one hand', async ({ page }) => {
  await page.addInitScript((script) => {
    const landmarksAt = (nx, ny) =>
      Array.from({ length: 21 }, () => ({ x: 1 - nx, y: ny, z: 0 }));
    window.__GAME_X_TEST_DEPS__ = {
      onLifecycleRelease(event) {
        (window.__GAME_X_TEST_RELEASE_LOG__ ??= []).push({ ...event });
      },
      cameraSessionFactory: ({ video }) => ({
        async start() {
          video.srcObject = new MediaStream();
          video.dataset.testSource = 'fake-local-camera';
          return 'started';
        },
        stop() {
          video.srcObject = null;
          delete video.dataset.testSource;
        },
      }),
      async loadWorkerClient() {
        return {
          createGestureWorkerClient: () => ({
            async init() {},
            async close() {},
            async infer() { throw new Error('fake pump owns samples'); },
          }),
        };
      },
      framePumpFactory: ({ onSample }) => {
        const timers = [];
        return {
          start() {
            let elapsed = 0;
            for (const sample of script) {
              elapsed += sample.ms;
              timers.push(setTimeout(() => onSample({
                gesture: sample.gesture,
                score: sample.score,
                landmarks: landmarksAt(sample.nx, sample.ny),
              }, elapsed), elapsed));
            }
          },
          stop() { timers.splice(0).forEach(clearTimeout); },
        };
      },
    };
  }, [
    { gesture: 'Open_Palm', score: 0.9, nx: 0.25, ny: 0.5, ms: 120 },
    { gesture: 'Closed_Fist', score: 0.92, nx: 0.25, ny: 0.5, ms: 80 },
    { gesture: 'Closed_Fist', score: 0.92, nx: 0.25, ny: 0.5, ms: 160 },
    { gesture: 'Closed_Fist', score: 0.92, nx: 0.7, ny: 0.5, ms: 80 },
    { gesture: 'Open_Palm', score: 0.9, nx: 0.7, ny: 0.5, ms: 60 },
    { gesture: 'Open_Palm', score: 0.9, nx: 0.7, ny: 0.5, ms: 110 },
  ]);
  await page.goto('/');
  await page.getByRole('button', { name: 'Enable Air Control' }).click();
  await expect(page.locator('.air-control-hud')).toHaveAttribute('data-state', 'tracking');
  await expect(page.locator('.air-cursor')).toHaveAttribute('data-held', 'false');
  await expect.poll(() => page.evaluate(() => {
    const relevant = window.__GAME_X_TEST_INPUT_LOG__
      .filter((action) => action.source === 'air-control' && (
        action.phase === 'down'
        || action.phase === 'up'
        || (action.phase === 'move' && action.buttons === 1)
      ))
      .map(({ phase, buttons, nx }) => ({ phase, buttons, nx }));
    return relevant.filter((action, index) =>
      action.phase !== 'move'
      || index === 0
      || relevant[index - 1].phase !== 'move'
      || relevant[index - 1].nx !== action.nx);
  })).toHaveLength(3);
  const [down, heldMove, up] = await page.evaluate(() => {
    const relevant = window.__GAME_X_TEST_INPUT_LOG__
      .filter((action) => action.source === 'air-control' && (
        action.phase === 'down'
        || action.phase === 'up'
        || (action.phase === 'move' && action.buttons === 1)
      ))
      .map(({ phase, buttons, nx }) => ({ phase, buttons, nx }));
    return relevant.filter((action, index) =>
      action.phase !== 'move'
      || index === 0
      || relevant[index - 1].phase !== 'move'
      || relevant[index - 1].nx !== action.nx);
  });
  expect([down.phase, heldMove.phase, up.phase]).toEqual(['down', 'move', 'up']);
  expect([down.buttons, heldMove.buttons, up.buttons]).toEqual([1, 1, 0]);
  expect(heldMove.nx).toBeGreaterThan(down.nx + 0.2);
});
```

fake 完整定义在 `page.addInitScript` 内，不能由 production bundle 导入。`src/main.js` 在 test mode 把 `window.__GAME_X_TEST_DEPS__` 原样传入 `createAirControl` 的 `dependencies`，并只订阅 normalized action log。`onLifecycleRelease` 只把 `{ reason, buttons: 0 }` 写入 test-page 的 `window.__GAME_X_TEST_RELEASE_LOG__` 作为 cleanup 诊断，绝不能调用 `inputRouter.route()` 或冒充 normalized action；production 默认值是 no-op。

- [ ] **步骤 3：覆盖故障 E2E**

同一文件继续覆盖：

- 权限拒绝后 HUD 显示 `Camera unavailable`。参数化 `desktop-mouse`、390×844 `mobile-touch`、`keyboard` 三条测试；每条都必须用阶段 03 `runtime-actions.js` 的正式控件完成 Pocket Play 插卡、退出、Pocket Care 照料、退出，并分别用该输入模式至少切换一个展位。不得只断言八图标存在。
- fake-camera Air 路径必须把张手光标移到一个 LIVE 设备的真实 projected proxy 中心，完成短“握拳 → 张手”，证明经阶段 03 同一 `museumTarget → exhibit interaction → Raycaster → coordinator` 选择、吸附、聚焦并打开 runtime；禁止在测试里点击 rail/Enter 或直接调用 coordinator。进入后在 screen rect 中心和边缘移动/按放，断言 child 收到阶段 03 transform 后的 local 坐标，而 HUD 光标仍使用全局 museum 坐标。
- Worker 初始化失败后 camera track 的 `stop()` 计数为 1，光标隐藏。
- 握拳 held 时切换目标，E2E 断言新目标在张手中和前没有新的 down，中和后才接受下一次 down。旧目标准确收到一次 `release-all` 由 Task 6 的真实 `InputRouter + Air Control` 集成测试权威断言；`subscribeAction` 不暴露 release，禁止在 E2E action log 中伪造该证据。
- `document.hidden`、`Escape` 和 Stop Camera 都让 `data-state="off"`；分别轮询 `window.__GAME_X_TEST_RELEASE_LOG__.at(-1)`，断言对应 `reason` 为 `page-hidden`、`escape`、`camera-stop` 且 `buttons === 0`。阶段 03 的 `subscribeAction` 只观察 `route(action)`，不会观察 `releaseAll(reason)`，因此禁止用 normalized action log 伪证 release。
- 关闭预览只隐藏视频，不停止状态灯、识别或 Stop Camera。
- 从未点击 Enable 时，Performance Resource Timing 中没有 `gesture_recognizer.task`、WASM 或 MediaPipe Worker chunk。

权限拒绝测试使用同一个完整 helper，避免三条路径只覆盖表面导航：

```js
async function installDeniedCamera(page) {
  await page.addInitScript(() => {
    window.__GAME_X_TEST_DEPS__ = {
      cameraSessionFactory: () => ({
        async start() {
          throw new DOMException('Permission denied', 'NotAllowedError');
        },
        stop() {},
      }),
    };
  });
}

async function activate(page, locator, mode) {
  if (mode === 'desktop-mouse') return locator.click();
  if (mode === 'mobile-touch') return locator.tap();
  await locator.focus();
  return page.keyboard.press('Enter');
}

async function completeBothRuntimeFlows(page, mode) {
  await activate(page, page.locator('[data-exhibit-id="pocket-play"]'), mode);
  await activate(page, page.getByRole('button', { name: 'Enter exhibit' }), mode);
  await expect(page.locator('iframe[data-device-id="pocket-play"]'))
    .toHaveAttribute('data-runtime-state', 'ready');
  const play = page.frameLocator('iframe[data-device-id="pocket-play"]');
  await activate(page, play.locator('[data-cartridge-id="ucity"]'), mode);
  await expect(play.locator('body')).toHaveAttribute('data-cartridge-state', 'running');
  await activate(page, page.getByRole('button', { name: 'Back to museum' }), mode);

  await activate(page, page.locator('[data-exhibit-id="pocket-care"]'), mode);
  await activate(page, page.getByRole('button', { name: 'Enter exhibit' }), mode);
  await expect(page.locator('iframe[data-device-id="pocket-care"]'))
    .toHaveAttribute('data-runtime-state', 'ready');
  const care = page.frameLocator('iframe[data-device-id="pocket-care"]');
  await expect(care.locator('body')).toHaveAttribute(
    'data-active-need',
    CARE_NEED_PATTERN,
  );
  await activate(page, care.getByRole('button', { name: 'Resolve current need' }), mode);
  await expect(care.locator('body')).toHaveAttribute('data-care-state', 'resolved');
  await activate(page, page.getByRole('button', { name: 'Back to museum' }), mode);
  await expect(page.locator('.focus-portal iframe')).toHaveCount(0);
}

async function runDeniedFlow(page, mode) {
  await installDeniedCamera(page);
  await page.goto('/');
  await activate(page, page.getByRole('button', { name: 'Enable Air Control' }), mode);
  await expect(page.getByRole('status')).toHaveText('Camera unavailable');
  await completeBothRuntimeFlows(page, mode);
}

test('camera denial preserves both runtimes via mouse', async ({ page }) => {
  await runDeniedFlow(page, 'desktop-mouse');
});

test('camera denial preserves both runtimes via keyboard', async ({ page }) => {
  await runDeniedFlow(page, 'keyboard');
});

test.describe('touch denial fallback', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
  test('preserves both runtimes via touch', async ({ page }) => {
    await runDeniedFlow(page, 'mobile-touch');
  });
});
```

touch 用 Playwright `tap()` 产生真实 touch Pointer Events；keyboard 只用 focus/Enter 与正式按钮，不能退回 `.click()` 伪装覆盖。`CARE_NEED_PATTERN` 必须继续从阶段 03 唯一的 `src/runtime/care-needs.js` 导入，禁止在本 E2E 或 helper 内手写第二份 need 正则/数组。

- [ ] **步骤 4：创建真机矩阵文档**

`docs/testing/air-control-device-matrix.md` 使用逐项复选框记录：

| 维度 | 必测值 |
| --- | --- |
| 浏览器 | macOS Chrome/Safari、Windows Chrome/Edge、Android Chrome、iOS Safari、Firefox 降级 |
| 权限 | 允许、拒绝、忽略、永久阻止、无设备、设备占用、运行中撤权 |
| 手势 | 无手、张手、20 次开合、握拳 5 秒、左右手、多手、遮挡、边缘、低光、运动模糊 |
| 生命周期 | ready 前、运行时切换、页面后台、停止、刷新、摄像头撤权 |
| 性能 | p50/p95 推理、有效 FPS、游戏 FPS、长任务、内存、10 分钟热稳定 |
| 隐私 | 无帧上传、无关键点存储、停止后硬件指示灯熄灭 |

每格记录设备、OS、浏览器版本、结果、p50、p95、有效 FPS、失败视频/日志路径；Firefox 不支持时只允许清晰降级，不能阻断鼠标。表中每个“必测值”都必须有真实设备记录（不是 Playwright fake）才能关闭阶段 04；无可用设备时明确标为 BLOCKED 并交接，不得以未勾选状态宣称通过。失败项必须关联复现证据并阻断阶段 05 候选版签署，除非该格的预期本来就是验证清晰降级。

- [ ] **步骤 5：运行 E2E 与 production 门禁并提交**

```bash
npm run test:e2e -- tests/e2e/air-control.spec.js
npm run build
node scripts/verify-air-control.mjs
git add src/main.js playwright.config.js scripts/verify-air-control.mjs \
  tests/e2e/air-control.spec.js docs/testing/air-control-device-matrix.md
git commit -m "test(air): prove gesture and failure lifecycles"
```

预期：Playwright 场景全部通过，production executable bundle 不含测试注入符号。`air-control.spec.js` 是 `--mode test` 专用套件；阶段 05 的 `playwright.competition.config.js` 必须使用显式 production-safe `testMatch` allowlist，至少收集 `offline.spec.js` 与 `competition-demo.spec.js`，并可加入阶段 05 新建、完全不依赖 test seam 的候选版 spec（例如 `pocket-play-cartridges.spec.js`、`air-control-production.spec.js`）。allowlist 必须排除本文件及 `asset-review.spec.js` 等 test-only 套件，禁止让 production preview 误触假依赖或真实摄像头授权。真机 camera gate 仍由下一 Task 的人工矩阵承担。

## Task 8：完成阶段门禁并运行本地摄像头预览

**Files:**

- Modify: `package.json`
- Modify: `scripts/verify-air-control.mjs`

- [ ] **步骤 1：把阶段命令加入 `package.json`**

```json
{
  "verify:air-control": "node scripts/verify-air-control.mjs",
  "test:air-control": "vitest run tests/unit/air-control && playwright test tests/e2e/air-control.spec.js"
}
```

- [ ] **步骤 2：运行完整自动门禁**

```bash
npm test
npm --prefix apps/game-boy run build
npm --prefix apps/dammagotchi run build
npm run build
npm run verify:air-control
npm run test:e2e -- tests/e2e/air-control.spec.js
```

预期：全部状态码为 0；控制台无未处理错误；Air 模型不在 Hub 初始网络依赖中。

- [ ] **步骤 3：运行 HTTPS/localhost 预览并执行人工安全检查**

运行 `npm run preview`，在输出的 `http://localhost:5180/` 主动点击 Enable；完成张手移动、握拳按住、握拳拖动、张手释放各 20 次，确认每次只有一对 down/up。随后依次执行丢手 250ms、切换 Pocket Play/Pocket Care、`Escape`、页面后台和 Stop Camera，确认全部立即 release，停止后浏览器摄像头灯熄灭。

- [ ] **步骤 4：记录真机结果**

把实际 OS、浏览器版本、p50/p95 推理时间、有效识别 FPS、鼠标降级结果和隐私网络检查写入 `docs/testing/air-control-device-matrix.md`；未实测的平台保持未勾选，不得写成通过。

- [ ] **步骤 5：提交门禁与实测记录**

```bash
git add package.json scripts/verify-air-control.mjs docs/testing/air-control-device-matrix.md
git commit -m "chore(air): record competition gesture gate"
```
