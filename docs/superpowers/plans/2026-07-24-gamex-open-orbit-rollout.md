# GameX 开放环形博物馆实施总览

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 按可独立验收的五个阶段，把现有双 iframe 入口升级为一座白色、360° 可旋转、八展位、双运行时、可积累记忆且支持 Air Control 的离线比赛作品。

**架构：** 先建立不依赖外部模型的单 renderer 展馆，再接入可审计资产管线；随后用安全父子协议连接两个既有运行时和 Memory Core；最后接入摄像头输入，并以权利、离线、性能、可访问性和 120 秒演示做发布加固。每阶段都保持可构建、可预览、可回退。

**技术栈：** Vite 6、Three.js 0.185.1、Vitest 4.1.10、happy-dom 20.11.1、Playwright 1.61.1、glTF Transform 4.4.1、MediaPipe Tasks Vision 0.10.35、Web Worker、原生 ES modules。

---

## 执行前提

- 先在当前 `main` 精确执行 `git add docs/superpowers/specs/2026-07-24-gamex-open-orbit-museum-design.md`，并对 rollout + 01–05 六份被忽略计划执行 `git add -f <exact paths>`，提交并推送该书面基线；确认三个未跟踪 research JSON 未暂存后，才从这个已含计划的 commit 创建 `codex/gamex-open-orbit-museum` 分支和独立 worktree。禁止从尚未跟踪这些计划的旧 `main` 创建执行 worktree。
- 保留工作区中三个未跟踪的 `sources/research_*.json`；任何阶段都不得把它们误加入提交。
- `docs/superpowers/` 被 `.gitignore` 忽略；实现过程中更新计划进度时使用精确路径 `git add -f docs/superpowers/plans/<file>`。
- 每完成一个阶段，先运行该计划列出的阶段门禁，再开始下一阶段。

## 计划与依赖

| 顺序 | 计划 | 独立交付 | 进入条件 | 完成门禁 |
| --- | --- | --- | --- | --- |
| 1 | [01 白色环形展馆基础](./2026-07-24-gamex-01-museum-foundation.md) | 单一 Three.js 世界、8 个程序化展品、proxy 点击、聚焦/恢复 API、玻璃导航、旋转与吸附 | 当前 `main` | 单元测试、10-record 扩展性、proxy-only Raycaster、Playwright 基础流与 production build |
| 2 | [02 开放资产管线](./2026-07-24-gamex-02-open-asset-pipeline.md) | 8/8 可核验模型、清单、哈希、加工、加载与失败降级 | 阶段 1 | 许可 fail-closed、模型预算、离线资产与 8 个加载/降级用例 |
| 3 | [03 FocusPortal 与 Memory Core](./2026-07-24-gamex-03-focus-portals-memory.md) | 两个安全可暂停运行时、统一输入协议、两类 Memory Fragment | 阶段 1；可与阶段 2 开发，但合并在阶段 2 之后 | origin/source/seq 测试、双运行时生命周期、2 秒内核心变化 |
| 4 | [04 Air Control](./2026-07-24-gamex-04-air-control.md) | 手掌移动、握拳按住、张手释放、全故障 release-all | 阶段 3 | 状态机、单帧在途、权限降级、模拟推理 E2E、真机矩阵 |
| 5 | [05 比赛与离线加固](./2026-07-24-gamex-05-competition-hardening.md) | 权利披露、原创化、离线包、性能/无障碍、120 秒可验证引导演示 | 阶段 2–4 | 全套测试、资源预算、无远程依赖、控制台零未处理错误、preview 视觉验收 |

## 阶段间契约

### DeviceRegistry

所有后续模块只读取 `src/museum/device-registry.js`。MVP/本轮发布门禁固定 `RELEASE_EXHIBIT_COUNT === 8`，阶段 2 仍必须把八条记录全部提升为 `reviewStatus: 'approved'` 并提供来源、许可和哈希，不能放宽成 `>= 8`。同时 registry validator（显式 expectedCount）、ring/controller/scene slot/玻璃 rail 原语按 `records.length` 工作，并以至少 10 条 synthetic records 验证；未来改发布计数与加记录不重写结构。阶段 1 允许 `modelUrl: null` 与 `reviewStatus: 'pending'`，仅渲染程序化玻璃骨架。运行时 URL 一律使用基于 `import.meta.env.BASE_URL` 的相对路径。

两个 LIVE runtime 的公开路径也是跨阶段冻结契约：Pocket Play 为 `${BASE}game-boy/index.html`，Pocket Care 为 `${BASE}dammagotchi/index.html`。`prepare-apps.mjs` 只能分别复制到 `public/game-boy` 与 `public/dammagotchi`，最终必须真实存在 `dist/game-boy/index.html` 与 `dist/dammagotchi/index.html`；禁止引入 `/apps/` alias 或在比赛阶段重写 registry。base/competition 离线 verifier 都从 registry 反向解析并检查这两个文件，真实 iframe E2E 必须成功进入两个运行时。

### Exhibit slot、命中与相机

阶段 1 为每条记录创建稳定 slot，其中 `visual`、不可见 raycast proxy 与 screen anchor 身份分离；复杂 GLB 永不进入 Raycaster。6 CSS px click-vs-drag 只在共享 exhibit interaction 实现，canvas device 与 glass icon 都走同一 selection/snap，只有 proxy activation 可进入 LIVE coordinator。阶段 2 hydration 只能替换/淡入既有 slot 的 `visual` child，成功、失败与 fallback 都不得重建 slot、proxy 或 anchor，也不得丢失 `hitTestExhibit/focusExhibit/restoreOverview/getProjectedScreenRect`。

阶段 3 的唯一入口顺序是 `await controller.select(id) → await scene.focusExhibit(id) → screenRect-bounded FocusPortal`；Back、Escape、失败、超时和切换都恢复 overview 与进入前已吸附方位。Pocket Play/Pocket Care 共用同一 API 和 entry coordinator，不得按 runtime 分叉相机实现。

### InputRouter

阶段 1 的鼠标与触摸统一变成 `move/down/up/release-all` 指针语义；键盘保留有名称的展位选择、Enter/Escape 与子运行时原生无障碍控制，不伪造 pointer/keyboard event。阶段 3 让 DOM/Air 统一动作都经 `museumTarget → 阶段 1 shared interaction → proxy hit-test`，并路由到活动门户；全局 museum `nx/ny` 只在 FocusPortal target 内按 canvas/shell/current screen rect 唯一转换为 iframe-local 0–1。进入 portal 的 canonical target reason 为 `target-change`，visibility/Escape/runtime-switch 保留语义 release reason；禁止另造门户专用 reason。阶段 4 只新增 `source: 'air-control'` 的指针生产者，不绕过路由，也不伪造浏览器事件。

### Runtime Protocol

阶段 3 固定协议版本 `v: 1`，并实现 `hello/ready/capabilities/pause/resume/settings/exit/memory/input/release-all/error`；`pause/resume/settings` 都有同 type ack。阶段 4 复用其中的 `input/release-all`，阶段 5 只调用既有 `settings { muted }`，不再改变消息格式。

### 资源与发布预算

- 展馆首屏 GLB 与纹理合计不超过 4 MiB。
- Air Control 的 SDK、WASM 与约 8.37 MiB 模型只在明确启用后请求。
- DPR 上限 1.5；父 renderer 永远只有一个；活动子运行时永远最多一个。
- `public/` 与 `dist/` 是生成目录，源资产只放在 `assets/`，由构建脚本复制。
- Pocket Play 比赛集固定为 6 个可审计上游 ROM + 2 个可重复构建的 GameX 原创 ROM；GPL/AGPL/WasmBoy 对应源码与 notices 从同一 preview origin 免费下载。

## 最终验收串联

- [ ] 在全新 worktree 依次执行五份计划，不跳过任何失败测试步骤。
- [ ] 运行 `npm ci && npm test`，预期所有 Vitest 套件通过。
- [ ] 运行 `npm run build:competition && npm run test:e2e:competition && npm run verify:competition`；Playwright 只服务已构建的 `dist/`，最后门禁确认根/两个子应用零 sourcemap、零外部运行时依赖、零 `pageerror/console.error`。
- [ ] 运行 `npm run preview:competition`，在输出 URL 完成桌面、窄屏、减少动态和摄像头拒绝四条人工路径。
- [ ] 按计划中的 120 秒脚本演示 Pocket Play、Memory Fragment、Pocket Care、六个 Coming Soon 和 Air Control 可选路径。
- [ ] 在 `CREDITS.md` 与 About/Credits UI 核对每项上游、许可、修改、原创边界和对应源码下载后，再标记比赛候选版本。

## 规格验收映射

| # | 规格第 16 节验收目标 | 实施位置 | 自动/人工证据 |
| --- | --- | --- | --- |
| 1 | 白色单场景首屏看见全部 8 台 | 01 Task 4–5 | `fit-camera.test.js` 的桌面/390px 投影视锥断言；preview 全景截图 |
| 2 | 拖满 360°，8 图标精确吸附 | 01 Task 2–4、6、8 | 跨 0/360 seam；canvas proxy 与 glass icon 同一 selection/snap；10 synthetic registry/ring/controller/rail overflow 单测；鼠标与 touch 逐一命中 8 个 active ID |
| 3 | 8/8 开放模型与完整来源/哈希 | 02 Task 1–6 | `sources.json`、四视图 review、manifest、`verify:assets` |
| 4 | 单模型失败仍有玻璃替身 | 02 Task 7–10 | HTTP 404/hash/parse E2E 与 `data-asset-state="fallback"` |
| 5 | 同时最多一个子运行时 | 01 Task 5 + 03 Task 2、8 | snap→focus→projected screen rect→single iframe 的顺序单测；screen-bounded portal/resize/restore 与 iframe count E2E |
| 6 | 两运行时 ready/pause/resume/exit/memory | 03 Task 2–6、8 | 双 adapter 生命周期；两 LIVE 共用 entry/camera API；Back/Escape/error 恢复原方位的真实 iframe E2E |
| 7 | 首次互动后 2 秒内核心变化 | 03 Task 7–8 | Memory Core fake-clock；helper 在第一次正式控件点击前启动单一 deadline 的双 runtime E2E |
| 8 | 主动启用；掌移、拳 down/held、掌 up | 03 Task 1–2 + 04 Task 3、6–8 | 状态机、Air proxy 点击 LIVE、global→portal-local transform、fake-camera E2E、20 次真机记录 |
| 9 | 丢手/错误/切换/后台/停止均 release-all | 03 Task 1–2 + 04 Task 3、5–8 | canonical target-change/语义 lifecycle reason、六类释放原因、track ended 与真机矩阵 |
| 10 | 帧/截图/关键点不上传或持久化 | 04 Task 1、4、6–8 | 结构扫描、Network 检查、Worker compact boundary |
| 11 | 拒绝/无摄像头时三类常规输入完整 | 01 Task 6–8 + 04 Task 7–8 | 权限拒绝后鼠标/触摸/键盘各完成两个真实 runtime 主流程 |
| 12 | 120 秒离线完成、零未处理错误 | 05 Task 5、8 | competition preview 上阻断外网后完成两 Memory + 六占位；Judge Demo 与 pageerror/console 收集 |
| 13 | 构建、结构、交互、真机性能通过 | 各阶段门禁 + 05 Task 7–8 | `verify:competition`、bundle budget、设备矩阵 |
| 14 | 根级署名、许可证、来源与原创说明 | 02 review + 05 Task 1–3、6、8 | 生成式 CREDITS、strict rights schema、GPL/AGPL source lock、可见 Credits/source dialog |

只有表中 14 行全部具备对应证据，才允许创建比赛候选 tag；“手工看起来正常”不能替代自动门禁，未实测的平台不得标记通过。
