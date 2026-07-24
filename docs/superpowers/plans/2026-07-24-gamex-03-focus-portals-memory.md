# GameX FocusPortal 与 Memory Core 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 把 Pocket Play 与 Pocket Care 作为同一展馆内的两个安全可玩门户接入；两个运行时都能 ready、pause、resume、exit、接收归一化指针并发送一次可验证的 Memory Fragment，父场景在 2 秒内产生清楚变化。

**架构：** 父端先用唯一 `PortalEntryCoordinator` 严格执行“controller 吸附 → await `MuseumScene.focusExhibit` → 按 `getProjectedScreenRect` 对齐单个 CSS/iframe portal”，`FocusPortal` 再独占一个同源 iframe，并用版本化 envelope 校验 `origin/source/sessionId/seq/timestamp`。两个子应用各自增加显式 runtime adapter，直接调用现有场景 API，不合成 DOM 事件。`InputRouter` 在展馆与活动 portal 之间切换统一输入语义；展馆 target 复用阶段 01 的 proxy-only hit-test/click-vs-drag interaction，因此 DOM 与 Air 都能点击同一台设备。子端只发送语义 memory 事件；父端校验、去重、存储聚合状态并驱动常驻 `MemoryCore`。

**技术栈：** 原生 `postMessage`、Vite、Three.js、TypeScript（Pocket Play）、JavaScript（Pocket Care）、Vitest、Playwright、Web Audio/RAF 生命周期 API。

---

## 固定协议

父 → 子：

```text
gamex:hello
gamex:pause
gamex:resume
gamex:settings
gamex:input
gamex:release-all
```

子 → 父：

```text
gamex:ready
gamex:capabilities
gamex:pause (ack)
gamex:resume (ack)
gamex:settings (ack)
gamex:exit
gamex:memory
gamex:error
```

每条消息都使用：

```js
const envelope = {
  type: 'gamex:ready',
  v: 1,
  sessionId: 'pocket-play:1',
  deviceId: 'pocket-play',
  seq: 1,
  timestamp: 1784880000000,
  payload: {},
};
```

规则：

- `targetOrigin` 永远是 `window.location.origin`，禁止 `'*'`。
- 父端同时验证 `event.origin === window.location.origin` 与 `event.source === activeIframe.contentWindow`。
- 子端同时验证 `event.origin === window.location.origin` 与 `event.source === window.parent`。
- 每个 session 拒绝重复或倒退的 `seq`；`deviceId` 必须等于当前注册表记录。
- `pause/resume` 回执使用相同 type，`payload.phase = 'ack'` 且含 `replyTo`。
- `gamex:settings` 请求 payload 固定为 `{ muted: boolean }`。父端在每次 child ready 后先发送当前值，之后仅在全局音乐设置改变时重发；子端调用 runtime adapter 的 `setMuted(muted)`，完成后回同 type ack：`{ phase: 'ack', replyTo, muted }`。不得把静音当成 pause。
- 进入等待 ready 最多 8 秒；退出先 `release-all`，再等待 pause ack 最多 750ms，然后无条件移除 iframe。

父端所有指针生产者都输出同一个归一化动作；阶段 03 的 DOM adapter 与阶段 04 的 Air adapter 只允许 `source` 不同：

```js
const action = {
  type: 'gamex:input',
  v: 1,
  source: 'dom-pointer', // 阶段 04 为 air-control
  phase: 'move',         // down | move | up
  nx: 0.5,
  ny: 0.5,
  buttons: 0,            // down/held move 为 1；普通 move/up 为 0
  seq: 42,
  timestamp: 1784880000000,
};
```

父 → 子 wire schema 唯一固定为 envelope 自己持有 `type/v/sessionId/deviceId/seq/timestamp`，payload 不嵌套另一份 action/envelope：

```js
const inputPayload = {
  source: 'dom-pointer', phase: 'move', nx: 0.5, ny: 0.5, buttons: 0,
};
const releasePayload = { reason: 'target-change' };
```

`source` 只允许 `dom-pointer|air-control`；`phase` 只允许 `down|move|up`；`nx/ny` 必须有限且在 0–1，down/held move 的 buttons 为 1，hover move/up 为 0；payload 必须 exact-key。FocusPortal 先把全局坐标转成 portal-local，再创建新的 parent envelope；禁止把原 action 的 `type/v/seq/timestamp` 塞进 payload。两个 bridge 在 ready 前忽略 input/release，ready 后用同一 validator 校验，分别只调用 `adapter.input(payload)` 与 `adapter.releaseAll(reason)`。

`museumTarget` 是阶段 03 的显式适配器，不是 Three.js controller 的别名，也不得实现第二套点击判定：

```js
createMuseumTarget({ interaction, surface })
// => { input(action), releaseAll(reason) }
```

它把 `nx/ny` 映射为 `surface.getBoundingClientRect()` 内的 CSS 像素，并只调用阶段 01
`interaction.input({ phase, x, y })` 与 `interaction.releaseAll(reason)`。该 interaction
内部唯一使用 `scene.hitTestExhibit({ x, y })` 的 proxy Raycaster、6 px click-vs-drag
阈值和 portal activation callback。DOM、Air、FocusPortal 与子 runtime 均不得直接调用
controller 拖拽方法或另建 hit-test。

## 文件结构

### 父端创建

- `src/runtime/protocol.js`
- `src/runtime/care-needs.js`
- `src/runtime/runtime-message-validator.js`
- `src/runtime/focus-portal.js`
- `src/runtime/portal-entry-coordinator.js`
- `src/runtime/portal-input-transform.js`
- `src/input/input-router.js`
- `src/input/create-museum-target.js`
- `src/memory/memory-event-validator.js`
- `src/memory/memory-store.js`
- `src/memory/create-memory-core.js`
- `src/memory/create-memory-fragment.js`
- `tests/unit/runtime-protocol.test.js`
- `tests/unit/care-needs.test.js`
- `tests/unit/input-router.test.js`
- `tests/unit/create-museum-target.test.js`
- `tests/unit/dom-pointer-adapter.test.js`
- `tests/unit/focus-portal.test.js`
- `tests/unit/portal-entry-coordinator.test.js`
- `tests/unit/portal-input-transform.test.js`
- `tests/unit/fixtures/focus-portal-fixtures.js`
- `tests/unit/memory-event-validator.test.js`
- `tests/unit/memory-store.test.js`
- `tests/unit/memory-core.test.js`
- `tests/e2e/focus-portal.spec.js`
- `tests/e2e/runtime-lifecycle.spec.js`
- `tests/e2e/memory-core.spec.js`
- `tests/e2e/helpers/runtime-actions.js`
- `scripts/verify-runtime-adapters.mjs`
- `playwright.config.js`

### 父端修改

- `src/museum/create-museum-app.js`
- `src/museum/create-museum-scene.js`
- `src/museum/device-registry.js`
- `src/input/dom-pointer-adapter.js`
- `src/main.js`
- `src/bgm.js`
- `src/styles.css`
- `package.json`
- `vitest.config.js`

### Pocket Play 创建/修改

- Create: `apps/game-boy/src/portal/gamex-runtime-events.ts`
- Create: `apps/game-boy/src/portal/game-boy-runtime-adapter.ts`
- Create: `apps/game-boy/src/portal/game-boy-runtime-adapter.test.ts`
- Create: `apps/game-boy/src/portal/gamex-runtime-bridge.ts`
- Create: `apps/game-boy/src/portal/create-accessible-cartridge-controls.ts`
- Modify: `apps/game-boy/src/main.ts`
- Modify: `apps/game-boy/src/core/base-scene.ts`
- Modify: `apps/game-boy/src/core/helpers/timeout.ts`
- Modify: `apps/game-boy/src/main-scene.ts`
- Modify: `apps/game-boy/src/scene/scene3d.ts`
- Modify: `apps/game-boy/src/scene/game-boy-scene/game-boy-scene-controller.ts`
- Modify: `apps/game-boy/src/scene/game-boy-scene/game-boy/game-boy.ts`
- Modify: `apps/game-boy/src/scene/game-boy-scene/game-boy-games/games/emulator/emulator-game.ts`
- Modify: `apps/game-boy/src/scene/game-boy-scene/game-boy/game-boy-audio/game-boy-audio.ts`
- Modify: `apps/game-boy/src/scene/game-boy-scene/game-boy-debug.ts`

### Pocket Care 创建/修改

- Create: `apps/dammagotchi/src/portal/dammagotchi-runtime-adapter.js`
- Create: `apps/dammagotchi/src/portal/dammagotchi-runtime-adapter.test.js`
- Create: `apps/dammagotchi/src/portal/gamex-runtime-bridge.js`
- Create: `apps/dammagotchi/src/portal/create-accessible-care-controls.js`
- Modify: `apps/dammagotchi/src/script.js`
- Modify: `apps/dammagotchi/src/experience/experience.js`
- Modify: `apps/dammagotchi/src/experience/utils/time.js`
- Modify: `apps/dammagotchi/src/experience/utils/pointer.js`
- Modify: `apps/dammagotchi/src/experience/device/device.js`
- Modify: `apps/dammagotchi/src/experience/ui/countdown.js`
- Modify: `apps/dammagotchi/src/experience/ui/ui.js`
- Modify: `apps/dammagotchi/src/experience/ui/soundboard.js`
- Modify: `apps/dammagotchi/src/experience/life/stats.js`

## Task 1：固定安全协议与统一 InputRouter

**Files:**

- Create: `src/runtime/protocol.js`
- Create: `src/runtime/care-needs.js`
- Create: `src/runtime/runtime-message-validator.js`
- Create: `src/input/input-router.js`
- Create: `src/input/create-museum-target.js`
- Modify: `src/input/dom-pointer-adapter.js`
- Modify: `src/museum/device-registry.js`
- Modify: `vitest.config.js`
- Create: `tests/unit/runtime-protocol.test.js`
- Create: `tests/unit/care-needs.test.js`
- Create: `tests/unit/input-router.test.js`
- Create: `tests/unit/create-museum-target.test.js`
- Create: `tests/unit/dom-pointer-adapter.test.js`

- [ ] 编写失败测试，覆盖错误 origin/source/version/device、重复 seq 和目标切换释放：

```js
import { expect, it, vi } from 'vitest';
import { createRuntimeMessageValidator } from '../../src/runtime/runtime-message-validator.js';
import { createInputRouter } from '../../src/input/input-router.js';

it('accepts only the active same-origin monotonically sequenced runtime', () => {
  const child = {};
  const validate = createRuntimeMessageValidator({
    origin: 'https://gamex.test',
    source: child,
    deviceId: 'pocket-play',
    sessionId: 'pocket-play:1',
  });
  const ready = {
    type: 'gamex:ready', v: 1, deviceId: 'pocket-play',
    sessionId: 'pocket-play:1', seq: 1, timestamp: 100, payload: {},
  };
  expect(validate({ origin: 'https://evil.test', source: child, data: ready })).toBeNull();
  expect(validate({ origin: 'https://gamex.test', source: {}, data: ready })).toBeNull();
  expect(validate({ origin: 'https://gamex.test', source: child, data: ready })).toEqual(ready);
  expect(validate({ origin: 'https://gamex.test', source: child, data: ready })).toBeNull();
});

it('releases the old target before routing to a portal', () => {
  const museumTarget = { input: vi.fn(), releaseAll: vi.fn() };
  const portalTarget = { input: vi.fn(), releaseAll: vi.fn() };
  const router = createInputRouter({ museumTarget });
  const onTargetChange = vi.fn();
  const unsubscribe = router.subscribeTargetChange(onTargetChange);
  router.route({ phase: 'down', buttons: 1 });
  router.setPortalTarget(portalTarget);
  expect(museumTarget.releaseAll).toHaveBeenCalledWith('target-change');
  expect(onTargetChange).toHaveBeenLastCalledWith({
    target: 'portal',
    releaseReason: 'target-change',
  });
  router.route({ phase: 'move', buttons: 1 });
  expect(portalTarget.input).toHaveBeenCalled();
  router.releaseAll('page-hidden');
  expect(portalTarget.releaseAll).toHaveBeenCalledWith('page-hidden');
  unsubscribe();
});

it('publishes every accepted action to observers after routing it', () => {
  const museumTarget = { input: vi.fn(), releaseAll: vi.fn() };
  const router = createInputRouter({ museumTarget });
  const observer = vi.fn();
  const unsubscribe = router.subscribeAction(observer);
  const action = {
    type: 'gamex:input', v: 1, source: 'dom-pointer',
    phase: 'down', nx: 0.25, ny: 0.75, buttons: 1, seq: 1, timestamp: 100,
  };
  router.route(action);
  expect(museumTarget.input).toHaveBeenCalledWith(action);
  expect(observer).toHaveBeenCalledWith(action, { target: 'museum' });
  unsubscribe();
});
```

- [ ] 创建 `tests/unit/care-needs.test.js`，先锁定唯一四值 taxonomy 与严格拒绝未知值：

```js
import { expect, it } from 'vitest';
import { CARE_NEEDS, CARE_NEED_PATTERN, isCareNeed } from '../../src/runtime/care-needs.js';

it('exports one canonical Pocket Care need taxonomy', () => {
  expect(CARE_NEEDS).toEqual(['hungry', 'happy', 'sick', 'bad']);
  expect(Object.isFrozen(CARE_NEEDS)).toBe(true);
  for (const need of CARE_NEEDS) {
    expect(isCareNeed(need)).toBe(true);
    expect(CARE_NEED_PATTERN.test(need)).toBe(true);
  }
  for (const value of ['mess', 'sleep', 'discipline', '', null]) {
    expect(isCareNeed(value)).toBe(false);
  }
});
```

- [ ] 在 `tests/unit/create-museum-target.test.js` 注入 `{ input, releaseAll }` interaction；用 `left=100/top=50/width=800/height=400` 的 surface 依次送入 `nx/ny = 0.25/0.25 → 0.75/0.5 → 0.75/0.5`，精确断言 interaction 收到 CSS 坐标 `(300,150) → (700,250) → (700,250)` 和原始 phase，且 `releaseAll('page-hidden')` 原样透传。再用真实阶段 01 interaction + fake `scene.hitTestExhibit` 证明 DOM normalized input 的短点击选择/activate 一个设备、超过 6 px 只拖拽；不得断言或调用 `beginDrag/dragTo/endDrag`。在 `tests/unit/dom-pointer-adapter.test.js` 用同一 surface 触发 pointerdown/move/up，精确断言 route 收到上述 `nx/ny`、严格递增 seq、`source='dom-pointer'`、`buttons=1/1/0`；`pointercancel`、window blur 与 pagehide 只调用注入的 `releaseAll(reason)`，不直接碰 controller。
- [ ] 运行 `npm test -- tests/unit/runtime-protocol.test.js tests/unit/care-needs.test.js tests/unit/input-router.test.js tests/unit/create-museum-target.test.js tests/unit/dom-pointer-adapter.test.js`，预期实现模块不存在或断言失败。
- [ ] 实现 `protocol.js`：

```js
export const GAME_X_PROTOCOL_VERSION = 1;
export const PARENT_TYPES = new Set([
  'gamex:hello', 'gamex:pause', 'gamex:resume', 'gamex:settings',
  'gamex:input', 'gamex:release-all',
]);
export const CHILD_TYPES = new Set([
  'gamex:ready', 'gamex:capabilities', 'gamex:pause', 'gamex:resume',
  'gamex:settings', 'gamex:exit', 'gamex:memory', 'gamex:error',
]);

export function createEnvelope({ type, sessionId, deviceId, seq, payload = {}, now = Date.now }) {
  return {
    type,
    v: GAME_X_PROTOCOL_VERSION,
    sessionId,
    deviceId,
    seq,
    timestamp: now(),
    payload,
  };
}
```

同时创建协议层唯一的 canonical need taxonomy `src/runtime/care-needs.js`；父端 validator、Pocket Care bridge/UI/body、E2E helper 与测试都直接 import 此模块，不复制数组或正则：

```js
export const CARE_NEEDS = Object.freeze(['hungry', 'happy', 'sick', 'bad']);
export const CARE_NEED_PATTERN = new RegExp(`^(?:${CARE_NEEDS.join('|')})$`);

export function isCareNeed(value) {
  return typeof value === 'string' && CARE_NEEDS.includes(value);
}
```

实现 validator：只接受普通对象、已知 type、`v===1`、完全匹配 session/device/source/origin、有限 timestamp 和严格递增正整数 seq；失败返回 `null`。

- [ ] 实现锁定给阶段 04 的 API：

```js
export function createInputRouter({ museumTarget }) {
  let portalTarget = null;
  let held = false;
  const targetListeners = new Set();
  const actionListeners = new Set();
  const target = () => portalTarget || museumTarget;
  return {
    setPortalTarget(next, { releaseReason = 'target-change' } = {}) {
      if (next === portalTarget) return;
      target().releaseAll(releaseReason);
      held = false;
      portalTarget = next;
      for (const listener of targetListeners) {
        listener({
          target: portalTarget ? 'portal' : 'museum',
          releaseReason,
        });
      }
    },
    route(action) {
      held = action.phase === 'down' || (action.phase === 'move' && action.buttons === 1);
      if (action.phase === 'up') held = false;
      target().input(action);
      for (const listener of actionListeners) {
        listener(action, { target: portalTarget ? 'portal' : 'museum' });
      }
    },
    releaseAll(reason) {
      target().releaseAll(reason);
      held = false;
    },
    subscribeTargetChange(listener) {
      targetListeners.add(listener);
      return () => targetListeners.delete(listener);
    },
    subscribeAction(listener) {
      actionListeners.add(listener);
      return () => actionListeners.delete(listener);
    },
    getSnapshot: () => ({ held, target: portalTarget ? 'portal' : 'museum' }),
    destroy() {
      target().releaseAll('destroy');
      portalTarget = null;
      held = false;
      targetListeners.clear();
      actionListeners.clear();
    },
  };
}
```

`route(action)` 在进入 target 前调用共享 `validateNormalizedInput`：`source` 白名单在本阶段一次固定为 `dom-pointer|air-control`，phase 为 `down|move|up`，坐标有限且 0–1，buttons 只能 0/1，seq 为正整数。阶段 04 不再修改 router 或白名单，只新增真正产生 `source: 'air-control'` 的 producer。

- [ ] 实现 `createMuseumTarget({ interaction, surface })`，只接受上述归一化动作并在每次调用时读取最新 `getBoundingClientRect()`；忽略非有限坐标，clamp `nx/ny` 到 0–1，把 down/move/up 连同转换后的 CSS `x/y` 原样交给 `interaction.input`，`releaseAll(reason)` 只调用 `interaction.releaseAll(reason)`。该模块禁止 import Three.js/controller、禁止保存第二份 down 坐标或阈值。
- [ ] 把注册表中两个 LIVE runtime 的 capabilities 更新为 `['pointer', 'pause', 'memory', 'settings']`；FocusPortal 只在 child capabilities 至少包含这四项时进入 ready。
- [ ] 扩展 `vitest.config.js`，保留 happy-dom/restoreMocks/clearMocks，并把 include 固定为 `tests/unit/**/*.test.{js,ts}`、`apps/game-boy/src/portal/**/*.test.ts`、`apps/dammagotchi/src/portal/**/*.test.js`。运行带明确子 runtime 路径的 `npm test -- <file>` 时必须实际收集 1 个以上测试；`No test files found` 视为失败。
- [ ] 把阶段 02 的 `bindDomPointer` 改为纯 producer：

```js
bindDomPointer({
  surface,
  route,
  releaseAll,
  now: () => performance.timeOrigin + performance.now(),
})
// => destroy()
```

它用 surface rect 生成完整 `gamex:input`，down 时 `setPointerCapture(pointerId)`，仅跟踪该 pointerId；move 只有按住时 `buttons=1`，hover move 为 0；up/cancel 后清空 active pointer。adapter 不 import museum controller，也不调用 `beginDrag/dragTo/endDrag`。键盘展位切换仍由 `createMuseumApp` 的显式 selection handler 负责，不能伪造 pointer/keyboard event。
- [ ] `createMuseumApp` 是整个 Hub 唯一出现 `createInputRouter(` 的生产文件。顺序固定为：创建 scene/controller → 创建阶段 01 唯一 `createExhibitPointerInteraction({ hitTest: scene.hitTestExhibit, onActivate })` → `createMuseumTarget({ interaction, surface })` → `createInputRouter({ museumTarget })` → 把 `inputRouter.route`/`releaseAll` 注入 `bindDomPointer` → 把同一 `inputRouter` 注入 `createFocusPortal` 与 entry coordinator。`onActivate(id)` 通过闭包调用 coordinator 的同一 LIVE entry chain；COMING SOON 只保留 selection/caption。返回值暴露 `subscribeInput: inputRouter.subscribeAction` 给阶段 04 的 test-mode 观察器，但不暴露 router 本体；`destroy()` 按 DOM adapter → interaction release → entry coordinator/FocusPortal → router → scene 的顺序清理。
- [ ] 运行测试，预期全部 PASS；提交：

```bash
git add src/runtime/protocol.js src/runtime/care-needs.js src/runtime/runtime-message-validator.js \
  src/input/input-router.js src/input/create-museum-target.js src/input/dom-pointer-adapter.js \
  src/museum/create-museum-app.js src/museum/device-registry.js vitest.config.js \
  tests/unit/runtime-protocol.test.js tests/unit/care-needs.test.js \
  tests/unit/input-router.test.js tests/unit/create-museum-target.test.js \
  tests/unit/dom-pointer-adapter.test.js
git commit -m "feat(protocol): secure runtime messages and shared input"
```

## Task 2：实现单实例 FocusPortal 生命周期

**Files:**

- Create: `src/runtime/focus-portal.js`
- Create: `src/runtime/portal-entry-coordinator.js`
- Create: `src/runtime/portal-input-transform.js`
- Create: `tests/unit/focus-portal.test.js`
- Create: `tests/unit/portal-entry-coordinator.test.js`
- Create: `tests/unit/portal-input-transform.test.js`
- Create: `tests/unit/fixtures/focus-portal-fixtures.js`
- Modify: `src/museum/create-museum-app.js`
- Modify: `src/styles.css`

- [ ] 编写 fake iframe/window 测试，断言 ready+capabilities 前不路由输入、最多一个 iframe、8 秒超时、pause→resume 与退出顺序：

```js
import { beforeEach, expect, it, vi } from 'vitest';
import { createFocusPortal } from '../../src/runtime/focus-portal.js';
import {
  ackEventFor,
  capabilitiesEventFor,
  createFakeFrame,
  createRouterFixture,
  getFrameCounts,
  getLastParentMessage,
  readyEventFor,
  resetFrameCounts,
} from './fixtures/focus-portal-fixtures.js';

const record = {
  id: 'pocket-play',
  status: 'live',
  runtimeUrl: '/game-boy/index.html',
  runtimeCapabilities: ['pointer', 'pause', 'memory', 'settings'],
};
let host;
beforeEach(() => {
  resetFrameCounts();
  host = document.createElement('div');
  document.body.replaceChildren(host);
});

it('suspends, resumes, then releases once before removing the iframe', async () => {
  const events = [];
  const inputRouter = {
    setPortalTarget(target, options = {}) {
      if (target === null) events.push(`release-all:${options.releaseReason}`);
      events.push(target ? 'target:portal' : 'target:museum');
    },
    route() {},
  };
  const portal = createFocusPortal({
    host,
    origin: 'https://gamex.test',
    inputRouter,
    createFrame: () => createFakeFrame(events),
    wait: () => new Promise(() => {}),
    getScreenRect: () => ({ left: 100, top: 80, width: 320, height: 240 }),
    onMuseumPaused: (value) => events.push(`museum:${value}`),
  });
  const opening = portal.open(record);
  const sessionId = portal.getSnapshot().sessionId;
  portal.handleMessage(readyEventFor(record, sessionId));
  portal.handleMessage(capabilitiesEventFor(record, sessionId));
  portal.handleMessage(ackEventFor('gamex:settings', record, sessionId));
  await opening;
  const suspending = portal.suspend('visibility');
  portal.handleMessage(ackEventFor('gamex:pause', record, sessionId));
  await suspending;
  const resuming = portal.resume();
  portal.handleMessage(ackEventFor('gamex:resume', record, sessionId));
  await resuming;
  const closing = portal.close('escape');
  portal.handleMessage(ackEventFor('gamex:pause', record, sessionId));
  await closing;
  expect(events).toEqual([
    'frame:append', 'hello', 'ready', 'capabilities', 'settings',
    'museum:true', 'target:portal',
    'release-all:visibility', 'target:museum', 'pause', 'museum:false',
    'resume', 'museum:true', 'target:portal',
    'release-all:escape', 'target:museum', 'pause',
    'frame:remove', 'museum:false',
  ]);
});
```

`focus-portal-fixtures.js` 直接实现为：

```js
let activeFrame;
let activeEvents;
let seq = 0;
let liveFrames = 0;
let peakFrames = 0;
const lastParentMessageByType = new Map();

const label = (type) => type.replace('gamex:', '');

export function createFakeFrame(events) {
  activeEvents = events;
  seq = 0;
  const contentWindow = {
    postMessage(message, targetOrigin) {
      if (targetOrigin !== 'https://gamex.test') throw new Error('unsafe target');
      lastParentMessageByType.set(message.type, structuredClone(message));
      events.push(label(message.type));
    },
  };
  const frame = {
    dataset: {},
    style: {},
    contentWindow,
    remove() {
      liveFrames -= 1;
      events.push('frame:remove');
    },
  };
  activeFrame = frame;
  liveFrames += 1;
  peakFrames = Math.max(peakFrames, liveFrames);
  events.push('frame:append');
  return frame;
}

function eventFor(type, record, sessionId, payload = {}) {
  if (type === 'gamex:ready' || type === 'gamex:capabilities') {
    activeEvents.push(label(type));
  }
  return {
    origin: 'https://gamex.test',
    source: activeFrame.contentWindow,
    data: {
      type, v: 1, sessionId, deviceId: record.id,
      seq: ++seq, timestamp: 1000 + seq, payload,
    },
  };
}

export const readyEventFor = (record, sessionId) =>
  eventFor('gamex:ready', record, sessionId);
export const capabilitiesEventFor = (record, sessionId) =>
  eventFor('gamex:capabilities', record, sessionId, {
    capabilities: ['pointer', 'pause', 'memory', 'settings'],
  });
export const ackEventFor = (type, record, sessionId, overrides = {}) =>
  eventFor(type, record, sessionId, {
    phase: 'ack',
    replyTo: lastParentMessageByType.get(type)?.seq,
    ...(type === 'gamex:settings' ? { muted: false } : {}),
    ...overrides,
  });

export function createRouterFixture(events) {
  const museumTarget = {
    input() { events.push('museum:input'); },
    releaseAll(reason) { events.push(`museum:release-all:${reason}`); },
  };
  let portalTarget = null;
  const target = () => portalTarget || museumTarget;
  return {
    setPortalTarget(next, { releaseReason = 'target-change' } = {}) {
      if (next === portalTarget) return;
      target().releaseAll(releaseReason);
      portalTarget = next;
    },
    route(action) { target().input(action); },
    releaseAll(reason) { target().releaseAll(reason); },
  };
}

export function getFrameCounts() {
  return { liveFrames, peakFrames };
}
export function getLastParentMessage(type) {
  return structuredClone(lastParentMessageByType.get(type));
}
export function resetFrameCounts() {
  activeFrame = undefined;
  activeEvents = undefined;
  seq = 0;
  liveFrames = 0;
  peakFrames = 0;
  lastParentMessageByType.clear();
}
```

`beforeEach` 同时调用 `resetFrameCounts()`。测试文件不得引用未定义的 `host/record/fakeFrame/*EventFor`，并追加以下完整用例：

```js
it('ignores input before ready and never keeps two frames alive', async () => {
  const events = [];
  const portal = createFocusPortal({
    host,
    origin: 'https://gamex.test',
    inputRouter: createRouterFixture(events),
    createFrame: () => createFakeFrame(events),
    wait: () => new Promise(() => {}),
    getScreenRect: () => ({ left: 100, top: 80, width: 320, height: 240 }),
    onMuseumPaused: () => {},
  });
  const first = portal.open(record);
  const firstSession = portal.getSnapshot().sessionId;
  portal.input({ type: 'gamex:input', phase: 'down', buttons: 1 });
  expect(events).not.toContain('input');
  portal.handleMessage(readyEventFor(record, firstSession));
  portal.handleMessage(capabilitiesEventFor(record, firstSession));
  portal.handleMessage(ackEventFor('gamex:settings', record, firstSession));
  await first;

  const care = { ...record, id: 'pocket-care', runtimeUrl: '/dammagotchi/index.html' };
  const second = portal.open(care);
  portal.handleMessage(ackEventFor('gamex:pause', record, firstSession));
  await vi.waitFor(() => {
    expect(portal.getSnapshot().sessionId).not.toBe(firstSession);
  });
  const secondSession = portal.getSnapshot().sessionId;
  portal.handleMessage(readyEventFor(care, secondSession));
  portal.handleMessage(capabilitiesEventFor(care, secondSession));
  portal.handleMessage(ackEventFor('gamex:settings', care, secondSession));
  await second;
  expect(getFrameCounts()).toEqual({ liveFrames: 1, peakFrames: 1 });
});

it('times out after exactly eight seconds and restores the museum', async () => {
  vi.useFakeTimers();
  const events = [];
  const portal = createFocusPortal({
    host,
    origin: 'https://gamex.test',
    inputRouter: createRouterFixture(events),
    createFrame: () => createFakeFrame(events),
    wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    getScreenRect: () => ({ left: 100, top: 80, width: 320, height: 240 }),
    onMuseumPaused: (value) => events.push(`museum:${value}`),
  });
  const opening = portal.open(record);
  await vi.advanceTimersByTimeAsync(7999);
  expect(portal.getSnapshot().state).toBe('loading');
  await vi.advanceTimersByTimeAsync(1);
  await expect(opening).rejects.toMatchObject({ code: 'RUNTIME_READY_TIMEOUT' });
  expect(portal.getSnapshot().state).toBe('error');
  expect(host.querySelector('[data-action="retry-runtime"]')).not.toBeNull();
  expect(host.querySelector('[data-action="exit-runtime"]')).not.toBeNull();
  vi.useRealTimers();
});

it('correlates settings by replyTo and sends the latest value to the next runtime', async () => {
  const events = [];
  const portal = createFocusPortal({
    host,
    origin: 'https://gamex.test',
    inputRouter: createRouterFixture(events),
    createFrame: () => createFakeFrame(events),
    wait: () => new Promise(() => {}),
    getScreenRect: () => ({ left: 100, top: 80, width: 320, height: 240 }),
    onMuseumPaused: () => {},
  });
  const first = portal.open(record);
  const firstSession = portal.getSnapshot().sessionId;
  portal.handleMessage(readyEventFor(record, firstSession));
  portal.handleMessage(capabilitiesEventFor(record, firstSession));
  portal.handleMessage(ackEventFor('gamex:settings', record, firstSession));
  await first;

  let resolved = false;
  const updating = portal.setSettings({ muted: true }).then((value) => {
    resolved = true;
    return value;
  });
  const request = getLastParentMessage('gamex:settings');
  portal.handleMessage(ackEventFor('gamex:settings', record, firstSession, {
    replyTo: request.seq - 1,
    muted: true,
  }));
  await Promise.resolve();
  expect(resolved).toBe(false);
  portal.handleMessage(ackEventFor('gamex:settings', record, firstSession, {
    replyTo: request.seq,
    muted: true,
  }));
  await expect(updating).resolves.toEqual({ muted: true });

  const care = { ...record, id: 'pocket-care', runtimeUrl: '/dammagotchi/index.html' };
  const second = portal.open(care);
  portal.handleMessage(ackEventFor('gamex:pause', record, firstSession));
  await vi.waitFor(() => {
    expect(portal.getSnapshot().sessionId).not.toBe(firstSession);
  });
  const secondSession = portal.getSnapshot().sessionId;
  portal.handleMessage(readyEventFor(care, secondSession));
  portal.handleMessage(capabilitiesEventFor(care, secondSession));
  await vi.waitFor(() => {
    expect(getLastParentMessage('gamex:settings')).toMatchObject({
      sessionId: secondSession,
      payload: { muted: true },
    });
  });
  portal.handleMessage(ackEventFor('gamex:settings', care, secondSession, {
    muted: true,
  }));
  await second;
});

it('resolves two rapid settings requests by seq without letting a late old ack win', async () => {
  const portal = createFocusPortal({
    host,
    origin: 'https://gamex.test',
    inputRouter: createRouterFixture([]),
    createFrame: () => createFakeFrame([]),
    wait: () => new Promise(() => {}),
    getScreenRect: () => ({ left: 100, top: 80, width: 320, height: 240 }),
    onMuseumPaused: () => {},
  });
  const opening = portal.open(record);
  const sessionId = portal.getSnapshot().sessionId;
  portal.handleMessage(readyEventFor(record, sessionId));
  portal.handleMessage(capabilitiesEventFor(record, sessionId));
  portal.handleMessage(ackEventFor('gamex:settings', record, sessionId));
  await opening;

  const firstUpdate = portal.setSettings({ muted: true });
  const firstRequest = getLastParentMessage('gamex:settings');
  const secondUpdate = portal.setSettings({ muted: false });
  const secondRequest = getLastParentMessage('gamex:settings');
  expect(secondRequest.seq).toBeGreaterThan(firstRequest.seq);

  portal.handleMessage(ackEventFor('gamex:settings', record, sessionId, {
    replyTo: secondRequest.seq,
    muted: false,
  }));
  await expect(secondUpdate).resolves.toEqual({ muted: false });
  expect(portal.getSnapshot()).toMatchObject({
    latestSettings: { muted: false },
    confirmedSettings: { muted: false },
  });

  portal.handleMessage(ackEventFor('gamex:settings', record, sessionId, {
    replyTo: firstRequest.seq,
    muted: true,
  }));
  await expect(firstUpdate).resolves.toEqual({ muted: true });
  expect(portal.getSnapshot()).toMatchObject({
    latestSettings: { muted: false },
    confirmedSettings: { muted: false },
  });
});

it('stores idle settings and defers a loading update until capabilities', async () => {
  const portal = createFocusPortal({
    host,
    origin: 'https://gamex.test',
    inputRouter: createRouterFixture([]),
    createFrame: () => createFakeFrame([]),
    wait: () => new Promise(() => {}),
    getScreenRect: () => ({ left: 100, top: 80, width: 320, height: 240 }),
    onMuseumPaused: () => {},
  });

  await expect(portal.setSettings({ muted: true }))
    .resolves.toEqual({ muted: true });
  expect(getLastParentMessage('gamex:settings')).toBeUndefined();
  expect(portal.getSnapshot()).toMatchObject({
    state: 'idle',
    latestSettings: { muted: true },
    confirmedSettings: { muted: false },
  });

  const firstOpening = portal.open(record);
  const firstSession = portal.getSnapshot().sessionId;
  portal.handleMessage(readyEventFor(record, firstSession));
  portal.handleMessage(capabilitiesEventFor(record, firstSession));
  await vi.waitFor(() => {
    expect(getLastParentMessage('gamex:settings')).toMatchObject({
      sessionId: firstSession,
      payload: { muted: true },
    });
  });
  portal.handleMessage(ackEventFor('gamex:settings', record, firstSession, {
    muted: true,
  }));
  await firstOpening;

  const closing = portal.close('test-reset');
  portal.handleMessage(ackEventFor('gamex:pause', record, firstSession));
  await closing;

  const care = {
    ...record,
    id: 'pocket-care',
    runtimeUrl: '/dammagotchi/index.html',
  };
  const secondOpening = portal.open(care);
  const secondSession = portal.getSnapshot().sessionId;
  const supersededUpdate = portal.setSettings({ muted: true });
  const supersededRejection = expect(supersededUpdate).rejects.toMatchObject({
    code: 'RUNTIME_SETTINGS_SUPERSEDED',
  });
  const loadingUpdate = portal.setSettings({ muted: false });
  await supersededRejection;
  expect(getLastParentMessage('gamex:settings')?.sessionId)
    .not.toBe(secondSession);

  portal.handleMessage(readyEventFor(care, secondSession));
  portal.handleMessage(capabilitiesEventFor(care, secondSession));
  await vi.waitFor(() => {
    expect(getLastParentMessage('gamex:settings')).toMatchObject({
      sessionId: secondSession,
      payload: { muted: false },
    });
  });
  portal.handleMessage(ackEventFor('gamex:settings', care, secondSession, {
    muted: false,
  }));
  await expect(loadingUpdate).resolves.toEqual({ muted: false });
  await secondOpening;
  expect(portal.getSnapshot()).toMatchObject({
    state: 'ready',
    latestSettings: { muted: false },
    confirmedSettings: { muted: false },
  });
});

it('settles old pending settings and ignores its timeout after a session switch', async () => {
  vi.useFakeTimers();
  try {
    const portal = createFocusPortal({
      host,
      origin: 'https://gamex.test',
      inputRouter: createRouterFixture([]),
      createFrame: () => createFakeFrame([]),
      wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
      getScreenRect: () => ({ left: 100, top: 80, width: 320, height: 240 }),
      onMuseumPaused: () => {},
    });
    const firstOpening = portal.open(record);
    const firstSession = portal.getSnapshot().sessionId;
    portal.handleMessage(readyEventFor(record, firstSession));
    portal.handleMessage(capabilitiesEventFor(record, firstSession));
    portal.handleMessage(ackEventFor('gamex:settings', record, firstSession));
    await firstOpening;

    const staleUpdate = portal.setSettings({ muted: true });
    const staleRejection = expect(staleUpdate).rejects.toMatchObject({
      code: 'RUNTIME_SESSION_CLOSED',
      sessionId: firstSession,
    });
    const care = {
      ...record,
      id: 'pocket-care',
      runtimeUrl: '/dammagotchi/index.html',
    };
    const switching = portal.open(care);
    portal.handleMessage(ackEventFor('gamex:pause', record, firstSession));
    await vi.waitFor(() => {
      expect(portal.getSnapshot().sessionId).not.toBe(firstSession);
    });
    const secondSession = portal.getSnapshot().sessionId;
    portal.handleMessage(readyEventFor(care, secondSession));
    portal.handleMessage(capabilitiesEventFor(care, secondSession));
    await vi.waitFor(() => {
      expect(getLastParentMessage('gamex:settings')).toMatchObject({
        sessionId: secondSession,
        payload: { muted: true },
      });
    });
    portal.handleMessage(ackEventFor('gamex:settings', care, secondSession, {
      muted: true,
    }));
    await switching;
    await staleRejection;

    await vi.advanceTimersByTimeAsync(750);
    expect(portal.getSnapshot()).toMatchObject({
      state: 'ready',
      sessionId: secondSession,
      latestSettings: { muted: true },
      confirmedSettings: { muted: true },
    });
    expect(getFrameCounts()).toEqual({ liveFrames: 1, peakFrames: 1 });
  } finally {
    vi.useRealTimers();
  }
});

it('rejects an unacknowledged live settings request at the exact timeout', async () => {
  vi.useFakeTimers();
  const portal = createFocusPortal({
    host,
    origin: 'https://gamex.test',
    inputRouter: createRouterFixture([]),
    createFrame: () => createFakeFrame([]),
    wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    getScreenRect: () => ({ left: 100, top: 80, width: 320, height: 240 }),
    settingsTimeoutMs: 750,
    onMuseumPaused: () => {},
  });
  const opening = portal.open(record);
  const sessionId = portal.getSnapshot().sessionId;
  portal.handleMessage(readyEventFor(record, sessionId));
  portal.handleMessage(capabilitiesEventFor(record, sessionId));
  portal.handleMessage(ackEventFor('gamex:settings', record, sessionId));
  await opening;

  const updating = portal.setSettings({ muted: true });
  const rejected = expect(updating).rejects.toMatchObject({
    code: 'RUNTIME_SETTINGS_TIMEOUT',
  });
  await vi.advanceTimersByTimeAsync(749);
  expect(portal.getSnapshot().state).toBe('ready');
  await vi.advanceTimersByTimeAsync(1);
  await rejected;
  expect(portal.getSnapshot().state).toBe('error');
  vi.useRealTimers();
});
```

同一 fixture 文件实际导出 `createRouterFixture(events)`、`getLastParentMessage(type)` 与 `getFrameCounts/resetFrameCounts`；router fixture 的 `setPortalTarget` 在 target 切换时按 production 语义释放旧 target，绝不直接篡改预期数组来伪造 portal 行为。第二次 `open()` 必须先 ack 第一 session 的 pause 并等待 `sessionId` 改变，再向新 frame 发送 ready/capabilities/settings ack。

- [ ] 运行 `npm test -- tests/unit/focus-portal.test.js`，预期实现不存在。
- [ ] 实现 `createFocusPortal` 的公共 API：

```js
createFocusPortal({
  host, origin, inputRouter, createFrame, onMuseumPaused, onRuntimeFailure, getScreenRect,
  initialSettings: { muted: false },
  readyTimeoutMs: 8000, pauseTimeoutMs: 750, settingsTimeoutMs: 750,
})
// => open(record), suspend(reason), resume(), close(reason), handleMessage(event),
// setSettings({ muted }) => Promise<{ muted }>,
// showRecoverableError(record, error), clearRecoverableError(),
// input(action), releaseAll(reason), getSnapshot(), destroy()
```

`getScreenRect(id)` 必须直接读取 `scene.getProjectedScreenRect(id)`。FocusPortal 在 append iframe/error UI 前先以当前 record ID 取得非空矩形，并把唯一 `.focus-portal` host 设为相对 `.museum-shell` 的 `position:absolute; left/top/width/height`；iframe 只能 `inset:0; width/height:100%`，不得退化成 viewport/fullscreen 或写死百分比。loading/ready/suspended-resume 期间以一个可取消 RAF tracker 重读矩形，resize/相机最后一帧后立即同步；close/error/destroy 必须 cancel tracker。矩形无效时 reject `{ code: 'PORTAL_SCREEN_RECT_UNAVAILABLE' }`，不创建 iframe。

- [ ] 创建唯一纯函数 `mapGlobalActionToPortal(action, { canvasRect, shellRect, screenRect, held })`。输入 `nx/ny` 永远是整个 museum canvas 的 0–1 全局坐标；先用 viewport-space `canvasRect` 还原 CSS 点。`screenRect` 按阶段 01 契约是相对 `.museum-shell` 的坐标，必须先加 `shellRect.left/top` 转为 viewport-space 后再计算 local `nx/ny`，禁止直接混用两个坐标系。规则固定为：未 held 的 hover/down 在矩形外返回 `null`；矩形内中心映射 `0.5/0.5`、四角映射 `0/1` 边界；一次合法 down 后，held move/up 即使越界也 clamp 到 0–1 并交给 child，up 后清 held；canvas/shell/screen rect 无效或 held 期间 screen rect 消失时返回 `releaseReason: 'portal-bounds-lost'`，FocusPortal 只发送一次 child `release-all` 并中和。每个 action 都读取最新三个 rect，不缓存 resize 前矩形。Air cursor/HUD 继续使用 transform 前的全局坐标，只有 portal target 改写发往 iframe 的 payload。
- [ ] `tests/unit/portal-input-transform.test.js` 对 `pocket-play/pocket-care` 参数化同一组中心、四角、矩形外 hover、held 越界 clamp/up、rect 丢失和 resize 后重映射；加入非零 `shellRect.left/top`，证明嵌入式 preview 不偏移。两个设备不得有分支或不同系数。FocusPortal 的 `portal.input(action)` 是生产代码唯一调用该 transform 的位置，DOM/Air adapter 和两个 child adapter 不得再缩放一次。

`open(record)` 只允许 `record.status==='live'`，且只在 coordinator 已完成相机聚焦后调用；若已有门户，先 await `close('runtime-switch')`。iframe 的 `src` 使用注册表相对 URL，`sandbox="allow-scripts allow-same-origin allow-pointer-lock"`，并执行 `iframe.dataset.deviceId = record.id`、`iframe.dataset.runtimeState = 'loading'`；load 后发送 hello。收到同 session 的 ready 与 capabilities 后，先发送当前 `gamex:settings` 并等待同 type ack，再改为 `data-runtime-state="ready"`、`inputRouter.setPortalTarget(portal)` 并暂停父场景。

每次 `open()` 先递增不可回退的 `sessionGeneration`；所有 ready、pause、resume 和 settings pending 项都记录 `{ generation, sessionId, requestSeq, settled }`。每个 ack、timeout 和异步 continuation 在写 DOM、切换路由或调用 `onMuseumPaused` 前，都必须同时确认 generation/session 仍为当前值、对应 pending 仍在 map 内且尚未 settled。`close()`、runtime switch、error 和 `destroy()` 会先进入 `closing`，立即以 `{ code: 'RUNTIME_SESSION_CLOSED', sessionId }` reject 并删除既有 ready/settings/resume pending；active close 随后为同一 session 单独创建唯一 teardown-pause pending。下一次 `open()` 必须 await teardown 完成后才能递增 generation。被删除 pending 的迟到 ack 或 `wait()` timeout 只能无副作用返回，绝不能移除或改写新 session。

`setSettings({ muted })` 先校验布尔值并保存为 `latestSettings`，再按状态执行：

- `idle` 且没有 iframe 时不伪造 runtime ack，也不启动 timeout；它只确认父端已保存 desired state，立即 resolve `{ muted }`，`confirmedSettings` 保持最近一次真实 child ack。阶段 05 可在初始化偏好时继续调用同一个 `createMuseumApp.setRuntimeSettings(settings)`，无需新增 API；此时没有 runtime 状态指示可更新。
- `loading` 且尚未收到 ready/capabilities 时不提前 `postMessage`。只保留最新一项未发送请求；若又有新值，旧 loading Promise 立即 reject `{ code: 'RUNTIME_SETTINGS_SUPERSEDED' }`。ready+capabilities 后，为最新值分配唯一父端 `seq`、启动 750 ms timeout，并把这次真实 ack 同时作为 `open()` 的初始化 settings barrier。
- `ready` 或 `suspended` 时立即发送带唯一父端 `seq` 的 `gamex:settings`。每个请求均返回只由同 generation/session/type、`payload.replyTo === request.seq` 且 `payload.muted === muted` 的 ack 解析出的 `Promise<{ muted }>`。

错误 `replyTo`、旧 session、错误 muted 与乱序的其他 type ack 全部忽略；每个已发送请求独立按 outgoing seq 关联。两个快速连续的 live 请求都必须实际发送并各自 resolve；`confirmedSettings` 只接受不小于当前 confirmed parent seq 的 ack，因此第二请求先确认后，第一请求的迟到 ack 只能解析第一 Promise，不能覆盖 `latestSettings/confirmedSettings`。`getSnapshot()` 返回这两个 settings 对象的只读副本供 UI/测试观察。当前 generation 的请求 750 ms 未确认才 reject `{ code: 'RUNTIME_SETTINGS_TIMEOUT' }` 并进入可恢复 error UI；`latestSettings` 仍保留，使 Retry/下一 runtime 收到最新用户选择。`createMuseumApp.setRuntimeSettings(settings)` 原样返回该 Promise；阶段 05 只在存在活动 runtime、Promise 由真实 ack resolve 且请求仍是当前 UI generation 时更新 runtime 静音指示。idle resolve 只代表 desired state 已保存。

下一次 child ready 必须收到 `latestSettings`。suspend/resume 分别写 `paused/ready`，错误写 `error`。FocusPortal 每次只在匹配 ack 后把 `iframe.dataset.lastRuntimeAck` 更新为 `settings|pause|resume`；ready/settings ack 超时或 iframe crash 必须先释放 target、停止 rect tracker、移除失败 iframe并调用 `onRuntimeFailure(error)`，但保留 state=`error` 与 `Retry / Back to museum` 父层 UI。不得通过普通 `close()` 立即清掉可恢复错误。

`suspend(reason)` 幂等：`inputRouter.setPortalTarget(null, { releaseReason: reason })` 负责唯一一次 release → 发送 pause → 等匹配 `replyTo` 的 ack 或 750ms → 隐藏 iframe → 恢复父场景，但保留 browsing context。`resume()` 发送 resume 并等匹配 ack，成功后显示 iframe、暂停父场景并重新设为 portal target；该路径加入单元测试以证明运行时确实可恢复。

`close(reason)` 幂等并覆盖所有状态：进入 teardown 时先结清除本次 teardown-pause 外的全部 pending。若当前 active，先用同一 `setPortalTarget(null, { releaseReason: reason })` 释放一次，再发送 pause 并等待匹配 ack 或 750 ms；已经 suspended 时不重复 release/pause；loading 尚未激活输入时直接取消 ready/settings 等待并移除 iframe；error 状态只在明确 Back、Escape 或 destroy 时清理错误 UI。最后 remove iframe、清空 teardown pending 并恢复父场景；之后才允许下一次 `open()` 创建新 generation。`Escape`、`pagehide` 和 child exit 共用 close；iframe error/ready timeout 走上面的 recoverable failure，不调用 close 清 UI。普通相机聚焦切走再返回可用 suspend/resume；单测锁定 error UI 中 Escape 与 Back 均清理，Retry 才保留状态并重开。

- [ ] 创建唯一 `portal-entry-coordinator.js`，公开 `enter(id)`、`exit(reason)`、`retry()`、`getSnapshot()` 与 `destroy()`，并用不可回退 generation 串行化所有入口。`enter(id)` 对 COMING SOON 返回 `{ entered:false, reason:'not-live' }`；对两个 LIVE 记录严格执行：

```js
await controller.select(id);        // selection + orbit snap 完成
await scene.focusExhibit(id);       // 同一 scene API；减少动态也必须 await
const rect = scene.getProjectedScreenRect(id);
if (!rect) throw Object.assign(new Error('screen unavailable'), {
  code: 'PORTAL_SCREEN_RECT_UNAVAILABLE',
});
await portal.open(record);           // portal tracker复用同一 getScreenRect(id)
```

调用 `focusExhibit` 前保存吸附完成后的 `{ activeId, rotationRad }` 作为本次 overview 方位。`Escape`、Back、child exit 或 runtime switch 先让旧 generation 无效，再 `await portal.close(reason)`，最后 `await scene.restoreOverview()`。focus/rect 失败先调用 `portal.showRecoverableError(record, error)`；ready/settings timeout 和 iframe crash 已由 FocusPortal 移除 frame 并保留 error UI，coordinator 的 `onRuntimeFailure` 只使 generation 失效并 `await scene.restoreOverview()`，绝不能再 `close()` 清 UI。Retry 先 `clearRecoverableError()` 再从 controller snap 重跑完整 enter；Back 才 `close('back')` 并清 UI。所有恢复后 controller snapshot 必须仍是进入目标的 active ID/rotation，不能二次旋转到默认 0°。切换 Pocket Play→Pocket Care 时顺序固定为旧 portal close/restore → 新 controller snap → 新 scene focus → 新 portal open；任何时刻仍只有一 frame/一 tracker。
- [ ] `tests/unit/portal-entry-coordinator.test.js` 用事件日志对 Pocket Play 与 Pocket Care 参数化，精确断言 `select:start → select:resolved → focus:start → focus:resolved → rect → portal:open`；focus 未 resolve 前 iframe count 为 0。再覆盖 focus reject、rect null、runtime ready timeout、iframe crash、Escape 和跨 LIVE 切换：全部恢复 overview/原吸附方位且迟到 continuation 无法重开旧 frame；其中 timeout/crash 必须同时满足 iframe count 0、Retry/Back 仍存在，Retry 重走完整顺序，Back 才清 UI。COMING SOON 不调用 focus/open。阶段 01 interaction 的 `onActivate(id)` 与可见 Enter 按钮都只调用这个 `enter(id)`；rail icon 只 select，不调用 coordinator。
- [ ] 在 `createMuseumApp` 为 LIVE 展位提供可见按钮 `<button data-action="enter-exhibit">Enter exhibit</button>`；COMING SOON 只有不可误导的 Archive label。门户内父层返回按钮固定为 `<button data-action="exit-runtime">Back to museum</button>`。proxy device click 和 Enter button 共用 coordinator；rail icon 只 select。coordinator 状态同步到 `root.dataset.cameraMode = overview|focusing|focused|restoring` 和 `root.dataset.focusedExhibit`，值只能在对应 scene Promise resolve 后变化，供无障碍状态和 E2E 观察，不能替代真实相机调用。组合根暴露 `setRuntimeSettings(settings)` 并原样返回 FocusPortal ack Promise，不直接访问 iframe，供阶段 05 偏好面板使用。注册一个可清理、串行化的 `visibilitychange` handler：活动 runtime 在 `document.hidden` 时 `suspend('visibility')`，恢复可见且 snapshot 为 `suspended` 时 `resume()`；destroy 时移除 listener，禁止并发 suspend/resume 越过 session generation。CSS 让 `.focus-portal` 只覆盖 `getProjectedScreenRect` 返回的设备屏幕范围，父场景仍挂载；错误 UI 回到 overview 后可置于展签旁，但不得留下全屏透明点击层。
- [ ] 运行 `npm test -- tests/unit/focus-portal.test.js && npm run build`，预期通过；提交：

```bash
git add src/runtime/focus-portal.js src/runtime/portal-entry-coordinator.js \
  src/runtime/portal-input-transform.js \
  src/museum/create-museum-app.js src/styles.css tests/unit/focus-portal.test.js \
  tests/unit/portal-entry-coordinator.test.js tests/unit/portal-input-transform.test.js \
  tests/unit/fixtures/focus-portal-fixtures.js
git commit -m "feat(portal): focus one recoverable runtime at a time"
```

## Task 3：让 Pocket Play 可真正暂停、恢复与释放输入

**Files:**

- Create: `apps/game-boy/src/portal/game-boy-runtime-adapter.ts`
- Modify: `apps/game-boy/src/core/base-scene.ts`
- Modify: `apps/game-boy/src/core/helpers/timeout.ts`
- Modify: `apps/game-boy/src/main-scene.ts`
- Modify: `apps/game-boy/src/scene/scene3d.ts`
- Modify: `apps/game-boy/src/scene/game-boy-scene/game-boy-scene-controller.ts`
- Modify: `apps/game-boy/src/scene/game-boy-scene/game-boy/game-boy.ts`
- Modify: `apps/game-boy/src/scene/game-boy-scene/game-boy-games/games/emulator/emulator-game.ts`

- [ ] 增加 `apps/game-boy/src/portal/game-boy-runtime-adapter.test.ts`，用完整 fake scene/audio/emulator 断言 pause 两次只停一次、RAF/Timeout/TWEEN/WasmBoy/audio/video 不推进，resume 不补暂停时间，release 后长按/拖动/按钮/Joypad 全归零；`setMuted(true/false)` 调用既有音频层且不改变 pause 状态。
- [ ] 运行 `npm test -- apps/game-boy/src/portal/game-boy-runtime-adapter.test.ts`，预期因 adapter 和 lifecycle 方法不存在而失败；随后 `npm --prefix apps/game-boy run build` 证明当前产品仍可编译。
- [ ] 将 `BaseScene` 的局部 RAF ID/Clock 提升为字段，并实现：

```ts
public readonly ready: Promise<void>;
private paused = false;
private rafId = 0;
private resumeWasmBoy = false;
private pausedTweens: TWEEN.Tween[] = [];

public async pause(): Promise<void> {
  if (this.paused) return;
  this.paused = true;
  cancelAnimationFrame(this.rafId);
  this.mainScene.releaseAll();
  this.pausedTweens = TWEEN.getAll().filter((tween) => {
    tween.pause(); return true;
  });
  Timeout.pauseAll();
  this.resumeWasmBoy = this.mainScene.pauseEmulatorIfRunning();
  await this.audioListener.context.suspend();
  this.mainScene.pauseVideos();
}

public async resume(): Promise<void> {
  if (!this.paused) return;
  this.clock.start();
  Timeout.resumeAll();
  this.pausedTweens.forEach((tween) => tween.resume());
  if (this.resumeWasmBoy) this.mainScene.resumeEmulator();
  await this.audioListener.context.resume();
  this.mainScene.resumeVideos();
  this.paused = false;
  this.animate();
}
```

`Timeout.pauseAll/resumeAll` 保存每个实例剩余毫秒；Controller 的 `releaseAll()` 清除 420ms 长按、结束 drag、释放 `pressedButtonType`；WasmBoy Joypad 四方向和 A/B/Start/Select 全置 false。paused 时忽略原生键盘。

`BaseScene.ready` 必须在 constructor 中同步创建，只由第一次完整执行
`createGameScene()` 与无固定延迟的 `afterAssetsLoaded()` 后 resolve；初始化失败时
reject。不得把 `ready` 实现为已经 resolve 的占位 Promise，也不得依赖 iframe
`load` 事件。这样 bridge 可以在资源加载前安装 listener，同时通过
`adapter.whenReady()` 等待真实场景就绪。

- [ ] 创建 adapter：

```ts
export class GameBoyRuntimeAdapter {
  constructor(private readonly scene: BaseScene) {}
  whenReady() { return this.scene.ready; }
  capabilities() { return ['pointer', 'pause', 'memory', 'settings', 'exit']; }
  pause() { return this.scene.pause(); }
  resume() { return this.scene.resume(); }
  setMuted(muted: boolean) { this.scene.setMuted(muted); }
  releaseAll() { this.scene.releaseAll(); }
  input(action: NormalizedInput) { this.scene.input(action); }
}
```

`BaseScene.input(action)` 把归一化坐标映射到 `pixiApp.screen.width/height` 后调用 `MainScene.onPointerMove/onPointerDown/onPointerUp`；`BaseScene.releaseAll()` 调用 `MainScene.releaseAll()`。这两个 public 方法是 adapter 的唯一输入入口，不暴露 private renderer 或 private `mainScene` 字段。

- [ ] 运行 `npm test -- apps/game-boy/src/portal/game-boy-runtime-adapter.test.ts && npm --prefix apps/game-boy run build`，预期 lifecycle/settings 测试与类型检查通过。
- [ ] 提交：

```bash
git add apps/game-boy/src/core apps/game-boy/src/main-scene.ts \
  apps/game-boy/src/scene apps/game-boy/src/portal/game-boy-runtime-adapter.ts \
  apps/game-boy/src/portal/game-boy-runtime-adapter.test.ts
git commit -m "feat(pocket-play): expose safe portal lifecycle"
```

## Task 4：接通 Pocket Play bridge 与一次插卡 Memory 事件

**Files:**

- Create: `apps/game-boy/src/portal/gamex-runtime-events.ts`
- Create: `apps/game-boy/src/portal/gamex-runtime-bridge.ts`
- Create: `apps/game-boy/src/portal/create-accessible-cartridge-controls.ts`
- Modify: `apps/game-boy/src/main.ts`
- Modify: `apps/game-boy/src/scene/game-boy-scene/cartridges/data/cartridges-config.ts`
- Modify: `apps/game-boy/src/scene/game-boy-scene/game-boy-scene-controller.ts`
- Modify: `apps/game-boy/src/scene/game-boy-scene/game-boy-debug.ts`
- Create: `tests/unit/pocket-play-bridge.test.js`

- [ ] 写失败测试：bridge 拒绝错误父窗/origin/倒退 seq；bridge 在模块初始化的同步阶段安装 `message` listener，hello 可早于 adapter ready 并被缓存；只有缓存了合法 hello 且 `adapter.whenReady()` resolve 后才各发送一次 ready/capabilities，重复 hello 或重复 ready resolve 不得重发；一次成功插卡只发一个 `interaction-complete/cartridge-inserted`；`gamex:settings { muted }` 精确调用 adapter `setMuted` 并回含 `replyTo/muted` 的同 type ack；pause/resume 的 adapter Promise 未完成前不得回 ack，完成后先写 `body[data-runtime-lifecycle]` 再回匹配 ack。
- [ ] 运行 `npm test -- tests/unit/pocket-play-bridge.test.js`，预期 bridge 文件不存在。
- [ ] `GameXRuntimeEvents` 只提供类型化 `emitMemory(payload: MemoryPayload)`；`MemoryPayload` 必填 `eventId/event/detail/energy/color`，禁止另留位置参数重载。在 `game-boy-scene-controller.ts` 卡带完成插入、current cartridge 与游戏类型都已设置的位置发送：

```ts
const cartridgeKey = getCartridgeManifestKey(cartridge.getType());
runtimeEvents.emitMemory({
  eventId: `cartridge-inserted:${cartridgeKey}`,
  event: 'interaction-complete',
  detail: 'cartridge-inserted',
  energy: 0.7,
  color: '#d9ff57',
});
```

`getCartridgeManifestKey(type)` 只读取 `CARTRIDGES_BY_TYPE_CONFIG[type].manifestKey`；该字段来自 authoritative homebrew manifest 的 `key`（例如 `ucity`），禁止用 enum 名、展示标题或 Three.js `Object3D.id` 推导。bridge 每 session 用 `eventId` Set 去重；不从高分刷新路径发 MVP memory。测试显式证明两个不同 `Object3D.id`、同一个 manifest key 只产生一次事件。

- [ ] `create-accessible-cartridge-controls.ts` 在 iframe 内提供真实、可见且可键盘操作的 `Accessible cartridge shelf`：从 authoritative `homebrew-cartridges.json`/生成 runtime catalog 动态渲染一个 `<button data-cartridge-id>`/条目的可访问名称 `Insert <title>`，不得硬编码数量或旧 enum。点击只调用 controller 已有的 `insertCartridge(cartridgeType)` 完整动画/ROM 启动路径，绝不直接调用 `emitMemory`；按钮状态通过 `aria-pressed` 与 `body[data-cartridge-state]` 反映。这样无精确 3D 指针的键盘用户和 E2E 都走同一条正式运行时逻辑。
- [ ] bridge 只监听同源父窗消息并调用 adapter；ready 后设置 `body[data-runtime-lifecycle="running"]`。收到 pause/resume 时必须先 await adapter 完成，再分别写 `paused/running`，最后发送带匹配 `replyTo` 的 ack；这样真实 iframe E2E 可观察“状态已完成后才 ack”，不能先回 ack 再异步暂停。
- [ ] bridge 对 `gamex:input/release-all` 使用顶部唯一 wire schema：ready 前忽略；ready 后 exact-key/finite/phase-buttons 校验通过才调用 adapter，非法、重复 seq、rect 外被父端过滤的 action 均不调用。测试覆盖 portal-local `down → held move → up` 和 `{ reason }` release-all，不接受嵌套 envelope。

`main.ts` 不得先 await `baseScene.ready` 再安装 bridge。固定启动顺序如下：

```ts
const baseScene = new BaseScene();
const adapter = new GameBoyRuntimeAdapter(baseScene);
const bridge = createGameXRuntimeBridge({
  adapter,
  parentWindow: window.parent,
  origin: window.location.origin,
});

bridge.install(); // 同步 addEventListener('message', ...)，不得 await
document.addEventListener('onLoad', () => {
  baseScene.createGameScene();
  baseScene.afterAssetsLoaded(); // 同时 resolve BaseScene.ready
}, { once: true });
void adapter.whenReady().then(
  () => bridge.markAdapterReady(),
  (error) => bridge.failReady(error),
);

if (import.meta.hot) {
  import.meta.hot.dispose(() => bridge.destroy());
}
```

bridge 内部持有 `cachedHello`、`adapterReady`、`readySent` 三个状态。`install()` 必须先注册 listener；合法 `gamex:hello` 到达时保存完整 envelope 并调用 `maybeAnnounceReady()`。`markAdapterReady()` 只设置 adapter 状态并调用同一函数。`maybeAnnounceReady()` 仅在 `cachedHello && adapterReady && !readySent` 时，从缓存 hello 取得 `sessionId/deviceId`，依次发送一次 ready 与一次 capabilities，再设置 `body[data-runtime-lifecycle="running"]` 和 `readySent=true`。非法 hello 不得覆盖缓存；同 session 重复 hello 只忽略，不重置 child seq；新 session 只能在上一 bridge 已 destroy、父端重新加载 iframe 后建立。`destroy()` 移除 listener 并使迟到的 `whenReady()` continuation 无效。删除固定 300 ms 延迟；把 `game-boy-debug.ts` 的 `postMessage('*')` 迁入 bridge 或删除。
- [ ] 运行 `npm test -- tests/unit/pocket-play-bridge.test.js && npm --prefix apps/game-boy run build`，预期通过；提交：

```bash
git add apps/game-boy/src/main.ts apps/game-boy/src/portal \
  apps/game-boy/src/scene/game-boy-scene/cartridges/data/cartridges-config.ts \
  apps/game-boy/src/scene/game-boy-scene/game-boy-scene-controller.ts \
  apps/game-boy/src/scene/game-boy-scene/game-boy-debug.ts tests/unit/pocket-play-bridge.test.js
git commit -m "feat(pocket-play): bridge insertion memories to GameX"
```

## Task 5：让 Pocket Care 可真正暂停、恢复与释放输入

**Files:**

- Create: `apps/dammagotchi/src/portal/dammagotchi-runtime-adapter.js`
- Modify: `apps/dammagotchi/src/script.js`
- Modify: `apps/dammagotchi/src/experience/experience.js`
- Modify: `apps/dammagotchi/src/experience/utils/time.js`
- Modify: `apps/dammagotchi/src/experience/utils/pointer.js`
- Modify: `apps/dammagotchi/src/experience/device/device.js`
- Modify: `apps/dammagotchi/src/experience/ui/countdown.js`
- Modify: `apps/dammagotchi/src/experience/ui/ui.js`
- Modify: `apps/dammagotchi/src/experience/ui/soundboard.js`

- [ ] 在 `dammagotchi-runtime-adapter.test.js` 用完整 fake Experience/Pointer/Soundboard 写失败测试：`whenReady()` 只跟随 `experience.readyPromise`；pause 500ms 后 `life.tick` 不变；resume 首帧 delta 正常；release 清空 `currentClicked`/drag controls/body classes 并回弹按钮；暂停清理 countdown/reset timeout；AudioContext 只在暂停前 running 时恢复；`setMuted(true/false)` 只委托 Soundboard，不改变 pause。
- [ ] 运行 `npm test -- apps/dammagotchi/src/portal/dammagotchi-runtime-adapter.test.js`，预期 lifecycle API 不存在；随后记录当前 `npm --prefix apps/dammagotchi run build` 基线。
- [ ] `Time.pause()` 取消 RAF，`resume()` 先 `timer.reset()` 再启动；`Pointer` 增加：

```text
moveNormalized(nx, ny) {
  this.x = nx * 2 - 1;
  this.y = -(ny * 2 - 1);
  this.update();
}
pressPrimary() {
  this.update();
  const callback = this.clickableObjects.get(this.currentIntersect);
  if (this.#enabled && callback?.start) {
    this.currentClicked = this.currentIntersect;
    this.camera.controls.enabled = false;
    callback.start();
  }
}
releasePrimary() {
  const callback = this.clickableObjects.get(this.currentClicked);
  if (callback?.end) callback.end();
  this.currentClicked = null;
  this.camera.controls.enabled = true;
}
releaseAll() {
  this.releasePrimary();
  this.camera.controls.enabled = true;
  this.canvas.classList.remove('grab', 'grabbing', 'pointer');
  this.drag?.dispatchEvent({ type: 'dragend' });
  this.experience.device.releaseButtons();
}
```

将 `device.js` 匿名 keydown 改为命名方法、保存引用并在 paused 时忽略；Countdown/UI 暴露 `cancelPending()`。Soundboard 记录 pause 前 context 状态，用 `suspend/resume`。

- [ ] `Experience.pause/resume/releaseAll` 幂等；保留现有 `ready` 资源事件 handler，并在 constructor 同步创建独立的 `readyPromise`，只在该 handler 完成 resources、device、UI 与首帧运行所需对象初始化后 resolve，失败时 reject。adapter 暴露 `whenReady() { return this.experience.readyPromise; }`，映射 move/down/up 到 Pointer 显式 API，`setMuted(muted)` 调用 Soundboard，capabilities 与 Pocket Play 一致。`script.js` 保存 `const experience = Experience.init(...)` 后立即创建 adapter；不得等待 `readyPromise` 才安装消息 listener。
- [ ] 运行 `npm test -- apps/dammagotchi/src/portal/dammagotchi-runtime-adapter.test.js && npm --prefix apps/dammagotchi run build`，预期 lifecycle/settings 测试与构建通过；提交：

```bash
git add apps/dammagotchi/src/script.js apps/dammagotchi/src/experience \
  apps/dammagotchi/src/portal/dammagotchi-runtime-adapter.js \
  apps/dammagotchi/src/portal/dammagotchi-runtime-adapter.test.js
git commit -m "feat(pocket-care): expose safe portal lifecycle"
```

## Task 6：接通 Pocket Care bridge 并聚合一次照料 Memory

**Files:**

- Create: `apps/dammagotchi/src/portal/gamex-runtime-bridge.js`
- Create: `apps/dammagotchi/src/portal/create-accessible-care-controls.js`
- Modify: `apps/dammagotchi/src/experience/ui/ui.js`
- Modify: `apps/dammagotchi/src/experience/life/stats.js`
- Modify: `apps/dammagotchi/src/script.js`
- Create: `tests/unit/pocket-care-bridge.test.js`

- [ ] 写失败测试：错误来源/重复 seq 被拒绝；bridge 在模块初始化的同步阶段安装 `message` listener，合法 hello 可早于 `Experience.readyPromise` 并被缓存，只有 hello 与 adapter ready 都满足后才各发送一次 ready/capabilities；`Stats.resolveNeeds()` 同步发多个 resolve 时，750ms 内只产生一条 canonical `care-resolved`；下一次独立照料仍可发；`gamex:settings { muted }` 调用 adapter 并回同 type ack；pause/resume 的 adapter Promise 未完成前不得回 ack，完成后先写 `body[data-runtime-lifecycle]` 再回匹配 ack。
- [ ] 运行 `npm test -- tests/unit/pocket-care-bridge.test.js`，预期实现不存在。
- [ ] bridge 与 Task 4 使用相同 envelope/ack 规则。监听现有 `resolve` 事件并聚合：
- [ ] 与 Pocket Play 参数化复用同一 input/release validator 与 wire-schema 测试：ready 后 local `down → held move → up` 精确调用 adapter，release reason 原样传入；ready 前、非法 keys/坐标/buttons、重复 seq 与矩形外 action不调用。

```js
import { isCareNeed } from '../../../../src/runtime/care-needs.js';

let careWindow = null;
function onResolved({ need }) {
  if (!isCareNeed(need)) return;
  if (careWindow) return;
  careWindow = window.setTimeout(() => { careWindow = null }, 750);
  send('gamex:memory', {
    eventId: `care-resolved:${sessionId}:${Date.now()}`,
    event: 'interaction-complete',
    detail: 'care-resolved',
    need,
    energy: 0.65,
    color: '#7de7ff',
  });
}
```

pause/destroy 清除聚合 timer。父端最终以当前 active record 覆盖子端 deviceId。

- [ ] canonical need taxonomy 只来自 Task 1 的 `src/runtime/care-needs.js`。bridge 与 accessible controls 从 `../../../../src/runtime/care-needs.js` import；`stats.js`、`ui.js` 从 `../../../../../src/runtime/care-needs.js` import；root test/E2E helper 直接 import 同一模块。所有 `body[data-active-need]` 赋值先过 `isCareNeed`，测试禁止出现第二份四值数组或手写 regex，也禁止另造 `mess/sleep/discipline`。`create-accessible-care-controls.js` 渲染 `Accessible care controls`，显示当前 need，并提供 A/B/C 与 `Resolve current need` 按钮。A/B/C 使用 adapter 的正式 down/up；最后一个按钮调用 `ui.js` 新增的 `selectNeedAndConfirm(need)`，该方法依次走现有 menu 选择、设备按压、动画、stats 更新和 resolve 事件，不直接触发 bridge 或修改 Memory Store。`body[data-care-state]` 仅暴露语义状态，便于屏幕阅读器与稳定 E2E。
- [ ] Pocket Care 使用与 Task 4 完全相同的 listener-first 握手状态机。`script.js` 固定为：

```js
const experience = Experience.init(document.querySelector('canvas.webgl'));
const adapter = new DammagotchiRuntimeAdapter(experience);
const bridge = createGameXRuntimeBridge({
  adapter,
  parentWindow: window.parent,
  origin: window.location.origin,
});

bridge.install(); // 同步缓存可能早于 Experience.readyPromise 的合法 hello
void adapter.whenReady().then(
  () => bridge.markAdapterReady(),
  (error) => bridge.failReady(error),
);

if (import.meta.hot) {
  import.meta.hot.dispose(() => bridge.destroy());
}
```

bridge 必须先同步安装 listener，再异步等待 adapter；内部同样使用
`cachedHello/adapterReady/readySent`，只有两项前置都满足时才发送一次
ready/capabilities，并设置 `body[data-runtime-lifecycle="running"]`。非法或重复
hello 不得覆盖缓存或重置 seq；`destroy()` 移除 listener 并屏蔽迟到 ready
continuation。bridge 输入直接调用 adapter，不合成 MouseEvent/KeyboardEvent。
pause/resume handler 必须 await adapter，依次设置 `paused/running` 后才发送匹配
ack；bridge 单测断言 ack 发生在状态与 adapter Promise 完成之后。
- [ ] 运行测试与 `npm --prefix apps/dammagotchi run build`，预期通过；提交：

```bash
git add apps/dammagotchi/src/portal/gamex-runtime-bridge.js \
  apps/dammagotchi/src/portal/create-accessible-care-controls.js \
  apps/dammagotchi/src/experience/ui/ui.js \
  apps/dammagotchi/src/experience/life/stats.js apps/dammagotchi/src/script.js \
  tests/unit/pocket-care-bridge.test.js
git commit -m "feat(pocket-care): bridge care memories to GameX"
```

## Task 7：验证、去重、存储并渲染 Memory Core

**Files:**

- Create: `src/memory/memory-event-validator.js`
- Create: `src/memory/memory-store.js`
- Create: `src/memory/create-memory-core.js`
- Create: `src/memory/create-memory-fragment.js`
- Create: `tests/unit/memory-event-validator.test.js`
- Create: `tests/unit/memory-store.test.js`
- Create: `tests/unit/memory-core.test.js`
- Modify: `src/museum/create-museum-scene.js`
- Modify: `src/runtime/focus-portal.js`

- [ ] 先在 `tests/unit/memory-event-validator.test.js` 写可复制的负例，锁定必填稳定 ID、device/detail 配对与唯一 canonical need；其余 store/core 测试继续覆盖 `${sessionId}:${eventId}` 去重、损坏/未知版本 localStorage 恢复默认、fragment 在 2 秒内抵达核心并增加能量：

```js
import { describe, expect, it } from 'vitest';
import { CARE_NEEDS } from '../../src/runtime/care-needs.js';
import { validateMemoryPayload } from '../../src/memory/memory-event-validator.js';

const play = {
  eventId: 'cartridge-inserted:ucity',
  event: 'interaction-complete',
  detail: 'cartridge-inserted',
  energy: 0.7,
  color: '#d9ff57',
};
const care = {
  eventId: 'care-resolved:pocket-care:1:1000',
  event: 'interaction-complete',
  detail: 'care-resolved',
  need: 'hungry',
  energy: 0.65,
  color: '#7de7ff',
};

describe('validateMemoryPayload', () => {
  it.each([
    [{ ...play, eventId: undefined }, 'pocket-play'],
    [{ ...play, eventId: '' }, 'pocket-play'],
    [{ ...play, eventId: `cartridge-inserted:${'x'.repeat(193)}` }, 'pocket-play'],
    [{ ...play, eventId: 'cartridge inserted:ucity' }, 'pocket-play'],
    [{ ...play, need: 'hungry' }, 'pocket-play'],
    [{ ...play, detail: 'care-resolved', need: 'hungry' }, 'pocket-play'],
    [play, 'unknown-device'],
    [{ ...care, detail: 'cartridge-inserted' }, 'pocket-care'],
    [{ ...care, need: 'mess' }, 'pocket-care'],
    [{ ...care, energy: 1.1 }, 'pocket-care'],
    [{ ...care, color: '#xyzxyz' }, 'pocket-care'],
  ])('rejects malformed or cross-device memory %#', (payload, deviceId) => {
    expect(validateMemoryPayload(payload, deviceId)).toBeNull();
  });

  it('accepts only the shared care taxonomy', () => {
    for (const need of CARE_NEEDS) {
      expect(validateMemoryPayload({ ...care, need }, 'pocket-care'))
        .toMatchObject({ deviceId: 'pocket-care', need });
    }
    expect(validateMemoryPayload(play, 'pocket-play'))
      .toMatchObject({ deviceId: 'pocket-play', eventId: play.eventId });
  });
});
```

同时创建完整的 `tests/unit/memory-store.test.js`，证明不仅非法 JSON，
连「可解析但结构损坏」的 v1 数据也会 fail closed 并原地修复：

```js
import { describe, expect, it } from 'vitest';
import {
  createMemoryStore,
  DEFAULT_MEMORY_STATE,
  MEMORY_STORAGE_KEY,
} from '../../src/memory/memory-store.js';

const validPlayFragment = {
  deviceId: 'pocket-play',
  eventId: 'cartridge-inserted:ucity',
  event: 'interaction-complete',
  detail: 'cartridge-inserted',
  energy: 0.7,
  color: '#d9ff57',
  timestamp: 1784880000000,
};

function storageWith(raw) {
  const values = new Map([[MEMORY_STORAGE_KEY, raw]]);
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

describe('createMemoryStore persisted-state gate', () => {
  it.each([
    ['invalid JSON', '{broken'],
    ['unknown version', JSON.stringify({ v: 2, energy: 0, fragments: [] })],
    ['non-numeric energy', JSON.stringify({
      v: 1, energy: '0', fragments: [],
    })],
    ['non-array fragments', JSON.stringify({
      v: 1, energy: 0, fragments: null,
    })],
    ['cross-device detail', JSON.stringify({
      v: 1,
      energy: 0.7,
      fragments: [{
        ...validPlayFragment,
        deviceId: 'pocket-care',
      }],
    })],
    ['unexpected privacy field', JSON.stringify({
      v: 1,
      energy: 0.7,
      fragments: [{
        ...validPlayFragment,
        cameraFrame: 'must-not-survive',
      }],
    })],
  ])('repairs %s to the canonical default', (_label, raw) => {
    const storage = storageWith(raw);
    const store = createMemoryStore({ storage });
    expect(store.getSnapshot()).toEqual(DEFAULT_MEMORY_STATE);
    expect(JSON.parse(storage.getItem(MEMORY_STORAGE_KEY)))
      .toEqual(DEFAULT_MEMORY_STATE);
  });

  it('restores one strict canonical v1 fragment', () => {
    const persisted = {
      v: 1,
      energy: 0.7,
      fragments: [validPlayFragment],
    };
    const store = createMemoryStore({
      storage: storageWith(JSON.stringify(persisted)),
    });
    expect(store.getSnapshot()).toEqual(persisted);
  });
});
```

- [ ] 运行 `npm test -- tests/unit/memory-*.test.js`，预期模块不存在。
- [ ] 实现 validator/store：

```js
import { isCareNeed } from '../runtime/care-needs.js';

const DETAIL_BY_DEVICE = Object.freeze({
  'pocket-play': 'cartridge-inserted',
  'pocket-care': 'care-resolved',
});
const EVENT_ID = /^[a-z0-9][a-z0-9:-]*$/i;
const PAYLOAD_KEYS = Object.freeze({
  'pocket-play': Object.freeze([
    'color', 'detail', 'energy', 'event', 'eventId',
  ]),
  'pocket-care': Object.freeze([
    'color', 'detail', 'energy', 'event', 'eventId', 'need',
  ]),
});

const isPlainObject = (value) =>
  value !== null
  && typeof value === 'object'
  && !Array.isArray(value)
  && Object.getPrototypeOf(value) === Object.prototype;

const hasExactKeys = (value, expected) =>
  isPlainObject(value)
  && Object.keys(value).sort().join('\n')
    === [...expected].sort().join('\n');

export function validateMemoryPayload(payload, activeDeviceId) {
  if (!Object.hasOwn(DETAIL_BY_DEVICE, activeDeviceId)) return null;
  if (!hasExactKeys(payload, PAYLOAD_KEYS[activeDeviceId])) return null;
  if (payload.event !== 'interaction-complete') return null;
  if (typeof payload.eventId !== 'string'
    || payload.eventId.length === 0
    || payload.eventId.length > 192
    || !EVENT_ID.test(payload.eventId)) return null;
  if (payload.detail !== DETAIL_BY_DEVICE[activeDeviceId]) return null;
  if (activeDeviceId === 'pocket-play' && Object.hasOwn(payload, 'need')) return null;
  if (activeDeviceId === 'pocket-care' && !isCareNeed(payload.need)) return null;
  if (!Number.isFinite(payload.energy) || payload.energy < 0 || payload.energy > 1) return null;
  if (!/^#[0-9a-f]{6}$/i.test(payload.color)) return null;
  return { ...payload, deviceId: activeDeviceId };
}
```

`src/memory/memory-store.js` 固定导出
`MEMORY_STORAGE_KEY = 'gamex:memory:v1'`、深冻结的
`DEFAULT_MEMORY_STATE` 和 `createMemoryStore({ storage, now = Date.now })`。
store API 只有 `append({ sessionId, event })`、`getSnapshot()` 与 `clear()`；
snapshot 每次返回深拷贝。

持久化读取必须先经过独立的 `validatePersistedMemoryState(value)`：

- 顶层必须是普通对象且恰好只有 `v/energy/fragments`；`v===1`，
  `energy` 是 0–8 的有限数，`fragments` 是最多 32 项的数组。
- Pocket Play fragment 必须恰好只有
  `deviceId/eventId/event/detail/energy/color/timestamp`；Pocket Care 额外且必须有
  `need`。`timestamp` 必须是非负有限数。
- 将 fragment 的 `deviceId/timestamp` 去掉后，必须再次通过上面的
  `validateMemoryPayload(payload, deviceId)`；因此 device/detail、eventId、
  canonical need、energy 与 color 使用同一事实源。不得直接信任持久化
  `deviceId`，不得保留额外身份、摄像头、关键点或帧字段。
- 顶层 `energy` 必须精确等于 fragments energy 求和后 clamp 到 8 的结果；
  不一致即整份拒绝，不能只信任缓存总数。
- JSON parse 失败、未知版本或任一结构/字段不合法时，立即把深拷贝默认值写回
  `MEMORY_STORAGE_KEY` 后返回默认 snapshot；不得把坏对象传给
  `MemoryCore.restore()`。

`memory-store.js` 的反序列化与最小 store 实现直接采用：

```js
import { validateMemoryPayload } from './memory-event-validator.js';

export const MEMORY_STORAGE_KEY = 'gamex:memory:v1';
export const DEFAULT_MEMORY_STATE = Object.freeze({
  v: 1,
  energy: 0,
  fragments: Object.freeze([]),
});

const STATE_KEYS = Object.freeze(['energy', 'fragments', 'v']);
const FRAGMENT_KEYS = Object.freeze({
  'pocket-play': Object.freeze([
    'color', 'detail', 'deviceId', 'energy',
    'event', 'eventId', 'timestamp',
  ]),
  'pocket-care': Object.freeze([
    'color', 'detail', 'deviceId', 'energy',
    'event', 'eventId', 'need', 'timestamp',
  ]),
});
const isPlainRecord = (value) =>
  value !== null
  && typeof value === 'object'
  && !Array.isArray(value)
  && Object.getPrototypeOf(value) === Object.prototype;
const exactKeys = (value, keys) =>
  isPlainRecord(value)
  && Object.keys(value).sort().join('\n')
    === [...keys].sort().join('\n');
const clone = (value) => structuredClone(value);

export function validatePersistedMemoryState(value) {
  if (!exactKeys(value, STATE_KEYS)
    || value.v !== 1
    || !Number.isFinite(value.energy)
    || value.energy < 0
    || value.energy > 8
    || !Array.isArray(value.fragments)
    || value.fragments.length > 32) return null;

  const fragments = [];
  for (const raw of value.fragments) {
    if (!Object.hasOwn(FRAGMENT_KEYS, raw?.deviceId)
      || !exactKeys(raw, FRAGMENT_KEYS[raw.deviceId])
      || !Number.isFinite(raw.timestamp)
      || raw.timestamp < 0) return null;
    const { deviceId, timestamp, ...payload } = raw;
    const validated = validateMemoryPayload(payload, deviceId);
    if (!validated) return null;
    fragments.push({ ...validated, timestamp });
  }
  const energy = Math.min(
    8,
    fragments.reduce((total, fragment) => total + fragment.energy, 0),
  );
  if (value.energy !== energy) return null;
  return { v: 1, energy, fragments };
}

function canonicalDefault(storage) {
  const fallback = clone(DEFAULT_MEMORY_STATE);
  try {
    storage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(fallback));
  } catch {
    // Storage failure must not prevent an in-memory safe default.
  }
  return fallback;
}

export function createMemoryStore({ storage, now = Date.now }) {
  let state;
  try {
    state = validatePersistedMemoryState(
      JSON.parse(storage.getItem(MEMORY_STORAGE_KEY)),
    );
  } catch {
    state = null;
  }
  if (!state) state = canonicalDefault(storage);
  const seen = new Set();

  const persist = () => {
    try {
      storage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Keep the validated in-memory state if persistence is unavailable.
    }
  };

  return {
    append({ sessionId, event }) {
      if (typeof sessionId !== 'string'
        || sessionId.length === 0
        || !isPlainRecord(event)) return { accepted: false };
      const { deviceId, ...payload } = event;
      const validated = validateMemoryPayload(payload, deviceId);
      if (!validated) return { accepted: false };
      const dedupeKey = `${sessionId}:${validated.eventId}`;
      if (seen.has(dedupeKey)) return { accepted: false };
      const timestamp = now();
      if (!Number.isFinite(timestamp) || timestamp < 0) {
        return { accepted: false };
      }
      seen.add(dedupeKey);
      const fragments = [
        ...state.fragments,
        { ...validated, timestamp },
      ].slice(-32);
      state = {
        v: 1,
        energy: Math.min(
          8,
          fragments.reduce(
            (total, fragment) => total + fragment.energy,
            0,
          ),
        ),
        fragments,
      };
      persist();
      return { accepted: true, event: clone(fragments.at(-1)) };
    },
    getSnapshot: () => clone(state),
    clear() {
      state = canonicalDefault(storage);
      seen.clear();
      return clone(state);
    },
  };
}
```

写入时 store 只保留最近 32 条 canonical
`{deviceId,eventId,event,detail,need,energy,color,timestamp}`；Pocket Play 项省略
`need`，总 energy clamp 到 8。保留 `eventId` 使状态可审计，但进程内去重键仍按
协议固定为当前 `${sessionId}:${eventId}`；`append()` 对重复键返回
`{ accepted: false }` 且不改写 storage。

- [ ] `createMemoryFragment({ from, color, reducedMotion })` 用小型 Icosahedron/轨迹飞向 `(0,1.1,0)`，正常模式 1200ms、减少动态 80ms。`createMemoryCore` 暴露：

```js
add(fragment)      // 立即更新目标能量并开始可视反馈
update(deltaMs)    // 核心亮度、尺度、地面轨迹
restore(state)
getSnapshot()
dispose()
```

每条有效 memory 在 scene 中 2 秒内增加 emissive/scale 和一条地面光轨；不直接由 iframe操作 Three.js。

- [ ] FocusPortal 收到已验证 memory 后按 `${sessionId}:${eventId}` 去重，写 store，并调用 `scene.addMemoryFragment(event)`；`createMuseumApp` 每次写入/恢复后同步 `root.dataset.memoryCount = String(store.getSnapshot().fragments.length)`，只反映真实 store。场景 HMR/dispose 清理所有 mesh/material。
- [ ] 运行 `npm test -- tests/unit/memory-*.test.js && npm run build`，预期通过；提交：

```bash
git add src/memory src/museum/create-museum-scene.js src/runtime/focus-portal.js \
  tests/unit/memory-event-validator.test.js tests/unit/memory-store.test.js tests/unit/memory-core.test.js
git commit -m "feat(memory): let play visibly change the museum"
```

## Task 8：完成双运行时 E2E 与阶段门禁

**Files:**

- Create: `tests/e2e/focus-portal.spec.js`
- Create: `tests/e2e/runtime-lifecycle.spec.js`
- Create: `tests/e2e/memory-core.spec.js`
- Create: `tests/e2e/helpers/runtime-actions.js`
- Create: `scripts/verify-runtime-adapters.mjs`
- Modify: `package.json`
- Modify: `playwright.config.js`

- [ ] 创建结构门禁，要求两 bridge、两 adapter、父端协议、唯一 `src/runtime/care-needs.js` 和 Memory 文件存在；扫描源与 build 拒绝 `postMessage(..., '*')`、未校验 `event.source`、`new KeyboardEvent`、`new MouseEvent`、`MutationObserver`，并拒绝 `care-needs.js` 及其唯一契约测试之外的 bridge/UI/helper/consumer tests 中出现第二份 canonical need 数组或手写四值 regex。
- [ ] E2E 覆盖：八展位仅两个有 Enter；ready 前不接收输入；DOM 永远最多一个 runtime iframe；切换前旧 iframe pause/timeout 移除；两个真实 iframe 都通过 production `visibilitychange → suspend/resume` 路径，并在 adapter 完成后留下匹配 pause/resume ack；Escape 恢复进入前方位；runtime timeout/crash 显示 Retry/Back 且父场景不空白。
- [ ] 对 Pocket Play/Pocket Care 参数化真实 entry 证据：进入前记录 active ID/rotation，点击 Enter 或真实 canvas proxy 后等待 `data-camera-mode="focused"`；断言 focus Promise 完成前 iframe 数为 0，完成后 `.focus-portal` bounding box 全部位于 canvas 内、显著小于 canvas（宽高均 `< 0.8 * canvas`）并随 viewport resize 重新对齐，而 iframe 精确填满 portal host。Back、Escape、ready timeout、crash 与跨 runtime 切换后均等待 `data-camera-mode="overview"`，active ID/rotation 等于各自进入前已吸附方位。至少一条 LIVE 用真实 `page.mouse` proxy 点击进入，证明阶段 01 hit-test → shared interaction → coordinator；rail icon click 仍只吸附、不自动打开。
- [ ] Air/DOM 坐标 E2E 使用同一 test-mode action observer：在投影 screen rect 中心、四角内侧各送一个全局 normalized move/down/up，两个 runtime 收到的 local 坐标分别约为 `0.5/0.5` 与对应边界；rect 外 open-palm hover 不进 child，held fist 越界被 clamp 且张手产生一次 up。resize 后重复中心用例，禁止在测试 helper 预先转换成 local 坐标。
- [ ] Memory E2E 分别走 Pocket Play 插卡与 Pocket Care 一次照料；2 秒 deadline 从第一次点击正式 runtime 控件之前开始，同时覆盖 runtime 完成状态与 Memory Core 变化。刷新后聚合 core 恢复；写入可解析但 schema 损坏的 v1 localStorage 后刷新，必须把持久化值原地修复为 canonical default、恢复 0 且无 pageerror。非法 JSON 与未知版本由 `memory-store.test.js` 覆盖。

- [ ] 创建可复用的真实操作 helper；它只点击正式展馆/运行时控件，禁止直接 `postMessage`、写 localStorage、调用 bridge 或设置 Memory DOM：

```js
import { expect } from '@playwright/test';
import { CARE_NEED_PATTERN } from '../../../src/runtime/care-needs.js';

export async function selectExhibit(page, id) {
  await page.locator(`[data-exhibit-id="${id}"]`).click();
  await expect(page.locator(`[data-exhibit-id="${id}"]`))
    .toHaveAttribute('aria-current', 'true');
}

export async function enterExhibit(page) {
  await page.getByRole('button', { name: 'Enter exhibit' }).click();
  await expect(page.locator('#app')).toHaveAttribute('data-camera-mode', 'focused');
  await expect(page.locator('iframe[data-runtime-state="ready"]')).toHaveCount(1);
}

function remaining(deadline) {
  return Math.max(1, deadline - Date.now());
}

export async function startPocketPlayCartridge(page, id = 'ucity', memoryCount) {
  const frame = page.frameLocator('iframe[data-device-id="pocket-play"]');
  const deadline = Date.now() + 2000;
  await frame.locator(`[data-cartridge-id="${id}"]`).click();
  await expect(frame.locator('body')).toHaveAttribute(
    'data-cartridge-state',
    'running',
    { timeout: remaining(deadline) },
  );
  if (memoryCount !== undefined) {
    await waitForMemoryCount(page, memoryCount, deadline);
  }
}

export async function resolvePocketCareNeed(page, memoryCount) {
  const frame = page.frameLocator('iframe[data-device-id="pocket-care"]');
  await expect(frame.locator('body')).toHaveAttribute(
    'data-active-need',
    CARE_NEED_PATTERN,
  );
  const deadline = Date.now() + 2000;
  await frame.getByRole('button', { name: 'Resolve current need' }).click();
  await expect(frame.locator('body')).toHaveAttribute(
    'data-care-state',
    'resolved',
    { timeout: remaining(deadline) },
  );
  if (memoryCount !== undefined) {
    await waitForMemoryCount(page, memoryCount, deadline);
  }
}

export async function waitForMemoryCount(page, count, deadline = Date.now() + 2000) {
  await expect(page.locator('#app')).toHaveAttribute(
    'data-memory-count',
    String(count),
    { timeout: remaining(deadline) },
  );
}

export async function exitRuntime(page) {
  await page.getByRole('button', { name: 'Back to museum' }).click();
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('#app')).toHaveAttribute('data-camera-mode', 'overview');
}
```

- [ ] 三个 spec 都写成完整、独立可运行的文件。`focus-portal.spec.js`：

```js
import { expect, test } from '@playwright/test';
import { enterExhibit, exitRuntime, selectExhibit } from './helpers/runtime-actions.js';

test('exposes only two live entries and never mounts two runtimes', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  for (const id of ['pocket-play', 'pocket-care']) {
    await selectExhibit(page, id);
    await expect(page.locator('[data-action="enter-exhibit"]')).toBeVisible();
  }
  for (const id of [
    'learning-computer', 'home-console', 'wide-handheld',
    'dual-lcd-pocket', 'block-handheld', 'arcade-terminal',
  ]) {
    await selectExhibit(page, id);
    await expect(page.locator('[data-action="enter-exhibit"]')).toHaveCount(0);
    await expect(page.getByText(/archive opening soon/i)).toBeVisible();
  }
  await selectExhibit(page, 'pocket-play');
  await enterExhibit(page);
  await expect(page.locator('.focus-portal iframe')).toHaveCount(1);
  await selectExhibit(page, 'pocket-care');
  await enterExhibit(page);
  await expect(page.locator('.focus-portal iframe')).toHaveCount(1);
  await expect(page.locator('iframe[data-device-id="pocket-play"]')).toHaveCount(0);
  await expect(page.locator('iframe[data-device-id="pocket-care"]')).toHaveCount(1);
  await exitRuntime(page);
  expect(errors).toEqual([]);
});

test('does not send normalized input before child ready', async ({ page }) => {
  await page.route('**/game-boy/index.html', (route) => route.fulfill({
    contentType: 'text/html',
    body: `<!doctype html><body data-input-count="0"><script>
      addEventListener('message', (event) => {
        if (event.data?.type === 'gamex:input') {
          document.body.dataset.inputCount =
            String(Number(document.body.dataset.inputCount) + 1);
        }
      });
    </script></body>`,
  }));
  await page.goto('/');
  await selectExhibit(page, 'pocket-play');
  await page.getByRole('button', { name: 'Enter exhibit' }).click();
  await expect(page.locator('iframe[data-runtime-state="loading"]')).toHaveCount(1);
  const canvas = page.locator('.museum-canvas');
  await canvas.dispatchEvent('pointerdown', {
    pointerType: 'mouse', pointerId: 1, buttons: 1, clientX: 200, clientY: 200,
  });
  await canvas.dispatchEvent('pointerup', {
    pointerType: 'mouse', pointerId: 1, buttons: 0, clientX: 240, clientY: 200,
  });
  const frame = page.frameLocator('iframe[data-device-id="pocket-play"]');
  await expect(frame.locator('body')).toHaveAttribute('data-input-count', '0');
});
```

`runtime-lifecycle.spec.js`：

```js
import { expect, test } from '@playwright/test';
import { enterExhibit, exitRuntime, selectExhibit } from './helpers/runtime-actions.js';

async function setDocumentHidden(page, hidden) {
  await page.evaluate((nextHidden) => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => nextHidden,
    });
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => nextHidden ? 'hidden' : 'visible',
    });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
}

test('releases on Escape and restores the selected museum azimuth', async ({ page }) => {
  await page.goto('/');
  await selectExhibit(page, 'pocket-play');
  const entryRotation = await page.locator('#app').getAttribute('data-orbit-rotation');
  await enterExhibit(page);
  await page.keyboard.press('Escape');
  await expect(page.locator('.focus-portal iframe')).toHaveCount(0);
  await expect(page.locator('#app')).toHaveAttribute('data-camera-mode', 'overview');
  await expect(page.locator('#app')).toHaveAttribute('data-orbit-rotation', entryRotation);
  await expect(page.locator('[data-exhibit-id="pocket-play"]'))
    .toHaveAttribute('aria-current', 'true');
});

test('both real iframe bridges ack pause only after suspend and resume complete', async ({ page }) => {
  await page.goto('/');
  for (const id of ['pocket-play', 'pocket-care']) {
    await selectExhibit(page, id);
    await enterExhibit(page);
    const iframe = page.locator(`iframe[data-device-id="${id}"]`);
    const runtime = page.frameLocator(`iframe[data-device-id="${id}"]`);
    await expect(runtime.locator('body'))
      .toHaveAttribute('data-runtime-lifecycle', 'running');

    await setDocumentHidden(page, true);
    await expect(runtime.locator('body'))
      .toHaveAttribute('data-runtime-lifecycle', 'paused');
    await expect(iframe).toHaveAttribute('data-runtime-state', 'paused');
    await expect(iframe).toHaveAttribute('data-last-runtime-ack', 'pause');

    await setDocumentHidden(page, false);
    await expect(runtime.locator('body'))
      .toHaveAttribute('data-runtime-lifecycle', 'running');
    await expect(iframe).toHaveAttribute('data-runtime-state', 'ready');
    await expect(iframe).toHaveAttribute('data-last-runtime-ack', 'resume');
    await exitRuntime(page);
  }
});

test('shows recoverable timeout UI while the museum stays mounted', async ({ page }) => {
  await page.route('**/dammagotchi/index.html', (route) => route.fulfill({
    contentType: 'text/html',
    body: '<!doctype html><title>silent runtime</title>',
  }));
  await page.goto('/');
  await selectExhibit(page, 'pocket-care');
  await page.getByRole('button', { name: 'Enter exhibit' }).click();
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible({ timeout: 9000 });
  await expect(page.getByRole('button', { name: 'Back to museum' })).toBeVisible();
  await expect(page.locator('.museum-canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Back to museum' }).click();
  await expect(page.locator('.focus-portal iframe')).toHaveCount(0);
});

test('recovers from an iframe crash signal without blanking the museum', async ({ page }) => {
  await page.goto('/');
  await selectExhibit(page, 'pocket-care');
  await enterExhibit(page);
  await page.locator('iframe[data-device-id="pocket-care"]').evaluate((frame) => {
    frame.dispatchEvent(new Event('error'));
  });
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Back to museum' })).toBeVisible();
  await expect(page.locator('.museum-canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Back to museum' }).click();
  await expect(page.locator('.focus-portal iframe')).toHaveCount(0);
});
```

`memory-core.spec.js`：

```js
import { expect, test } from '@playwright/test';
import {
  enterExhibit,
  exitRuntime,
  resolvePocketCareNeed,
  selectExhibit,
  startPocketPlayCartridge,
} from './helpers/runtime-actions.js';

test('two real interactions change and persist the Memory Core', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await selectExhibit(page, 'pocket-play');
  await enterExhibit(page);
  await startPocketPlayCartridge(page, 'ucity', 1);
  await exitRuntime(page);
  await selectExhibit(page, 'pocket-care');
  await enterExhibit(page);
  await resolvePocketCareNeed(page, 2);
  await exitRuntime(page);
  await page.reload();
  await expect(page.locator('#app')).toHaveAttribute('data-memory-count', '2');
  expect(errors).toEqual([]);
});

test('repairs parseable invalid v1 memory without a pageerror', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.evaluate((key) => {
    localStorage.setItem(key, JSON.stringify({
      v: 1,
      energy: '8',
      fragments: null,
    }));
  }, 'gamex:memory:v1');
  await page.reload();
  await expect(page.locator('#app')).toHaveAttribute('data-memory-count', '0');
  await expect.poll(() => page.evaluate((key) => (
    JSON.parse(localStorage.getItem(key))
  ), 'gamex:memory:v1')).toEqual({
    v: 1,
    energy: 0,
    fragments: [],
  });
  expect(errors).toEqual([]);
});
```

- [ ] 阶段 03 提交完整、可执行的 `playwright.config.js`，不依赖口头假设：

```js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  timeout: 30_000,
  expect: { timeout: 10_000 },
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

- [ ] 在 `package.json` 加：

```json
{
  "verify:runtime-adapters": "node scripts/verify-runtime-adapters.mjs",
  "test:runtime-unit": "vitest run apps/game-boy/src/portal/*.test.ts apps/dammagotchi/src/portal/*.test.js",
  "test:portals": "playwright test tests/e2e/focus-portal.spec.js tests/e2e/runtime-lifecycle.spec.js tests/e2e/memory-core.spec.js"
}
```

运行：

```bash
npm test
npm run test:runtime-unit
npm run verify:runtime-adapters
npm --prefix apps/game-boy run build
npm --prefix apps/dammagotchi run build
npm run build
npm run test:portals
```

预期：全部状态码 0，控制台无未处理错误。

- [ ] 提交：

```bash
git add scripts/verify-runtime-adapters.mjs tests/e2e package.json playwright.config.js
git commit -m "test(portal): prove two runtimes and memory lifecycle"
```

## 阶段完成门禁

- [ ] 运行 `git status --short`，确认没有生成目录和三份研究 JSON 被加入阶段提交。
- [ ] 重复执行 `npm test && npm run verify:runtime-adapters && npm run build && npm run test:portals`。
- [ ] 启动 `npm run preview`，人工完成进入 Pocket Play、插卡、退出、进入 Pocket Care、照料、退出；两条 Memory Fragment 均在 2 秒内改变中心核心。
- [ ] 页面隐藏、切换设备、iframe reload 与 Escape 时逐一确认按键不粘住、旧音频停止、父场景恢复。
