# GameX 开源游戏匹配卡带实现计划

> **执行要求：** 使用 `executing-plans` 技能逐项实施；每个任务遵循红灯、最小实现、绿灯、提交的顺序。不得删除 Tetris、Space Invaders、旧 Pokémon 标签清单或原始扫描文件；旧 Pokémon 素材退出活动构建管线后留在 `tools` 目录作为历史资料。

**目标：** 将马蹄形主陈列改造成 15 张“标签标题 = 实际开源游戏”的可玩卡带，同时把 Tetris 与 Space Invaders 保留在 `Archive` 收纳区。17 张卡带全部通过插入、输入、保存、刷新、读取、继续运行验收。

**架构：** `homebrew-cartridges.json` 是 15 张主陈列卡带的唯一事实来源，驱动标签、ROM、许可证和运行时配置验证。主陈列统一进入 WasmBoy；两张 Archive 卡带保留原生 Pixi 实现，通过版本化 `localStorage` 快照接入 `GameBoyGames` 的统一 Save / Load 门面。恢复原生快照时先完整校验，再一次性重建游戏状态，保证失败不改变当前局面。

**技术栈：** TypeScript 5.7、Three.js、PixiJS 8、WasmBoy 0.7.1、Vite、Sharp、Vitest、Node.js 验证脚本、Playwright 游戏客户端。

---

## 任务 1：把产品规格转成会失败的自动验证

**文件：**

- 修改：`scripts/verify-homebrew-cartridges.mjs`
- 修改：`scripts/verify-cartridge-layout.mjs`
- 修改：`package.json`

### 步骤 1：将主清单约束从 8 项改为 15 项

在 `verify-homebrew-cartridges.mjs` 固定主陈列顺序：

```js
const EXPECTED_MAIN_CARTRIDGES = [
  ['Adjustris', 'ADJUSTRIS', 'adjustris.gb'],
  ['BrekstasCat', "BREKSTA'S CAT", 'brekstascat.gb'],
  ['Airplanz', 'AIRPLANZ', 'airplanz.gb'],
  ['CrossConnect', 'CROSS CONNECT', 'cross-connect.gbc'],
  ['DysonsFear', "DYSON'S FEAR", 'dysons-fear.gb'],
  ['UnstoppableKnight', 'UNSTOPPABLE KNIGHT', 'unstoppable-knight.gb'],
  ['Wyrmhole', 'WYRMHOLE', 'wyrmhole.gb'],
  ['TobuTobuGirl', 'TOBU TOBU GIRL', 'tobutobugirl.gb'],
  ['MicroCity', 'MICRO CITY', 'ucity.gbc'],
  ['Game2048', '2048', '2048.gb'],
  ['GbCorp', 'GB CORP.', 'gbcorp.gb'],
  ['Carazu', 'CARAZU', 'carazu.gb'],
  ['ShockLobster', 'SHOCK LOBSTER', 'shock-lobster.gb'],
  ['Geometrix', 'GEOMETRIX', 'geometrix.gbc'],
  ['GbWordyl', 'GB WORDYL', 'gb-wordyl.gb'],
];
```

逐项验证唯一 `key`、`cartridgeType`、`title`、`romFile`、`sha256`、`releaseUrl`、`sourceUrl`、`licenseFile`、`outputs` 和 `theme`。验证 ROM 的 Nintendo Logo、Header checksum、Global checksum 和 SHA-256。

### 步骤 2：添加真实性与许可证约束

验证器必须拒绝：

- 活动卡带 ID 中的 `JpRed`、`UsYellow` 等 Pokémon 发行版名称；
- `CARTRIDGES_BY_TYPE_CONFIG` 中的 `GAME_TYPE.PocketCreatures`；
- `CARTRIDGE_INFO_CONFIG` 中的 `kind: 'display'` 和 `Sleeve: Pokémon`；
- 标签生成器读取 `pokemon-cartridges.json`、`tools/sources` 或调用网络；
- GPL 项缺少清单指定的许可证文本与源码归档。

旧的 `pokemon-cartridges.json` 和 `tools/sources` 只检查“仍存在但未被活动生成器引用”，不删除。

### 步骤 3：添加 15 + 2 布局约束

把 `verify-cartridge-layout.mjs` 的 `ARC_ORDER` 改成 15 个真实游戏 ID，继续复用圆环、镜像、间距和深度碗验证。固定：

```js
const ARCHIVE_ORDER = ['Tetris', 'SpaceInvaders'];
```

两张 Archive 卡必须继续位于 `y >= 6`，存在于控制面板的 `Archive` 选项组，且不计入主圆环。

### 步骤 4：添加统一存档静态约束

检查：

- `GameBoyGames` 暴露 `saveCurrentGameState` 与 `loadCurrentGameState`；
- 控制器不再调用 `saveEmulatorState` / `loadEmulatorState`；
- Tetris 和 Space Invaders 实现 `captureState` / `restoreState`；
- 存在两个固定存储键；
- Save / Load 在三种活动游戏类型下均启用。

### 步骤 5：运行验证并确认红灯原因正确

运行：

```bash
npm run verify:homebrew-cartridges
npm run verify:cartridge-layout
```

预期：第一个验证因清单仍为 8 项而失败；第二个验证因真实游戏 ID 尚未进入布局而失败。不能出现脚本语法错误或文件路径错误。

### 步骤 6：提交红灯测试

```bash
git add scripts/verify-homebrew-cartridges.mjs scripts/verify-cartridge-layout.mjs package.json
git commit -m "test(Game Boy): 固化十七张匹配卡带验收"
```

## 任务 2：补齐 15 款 ROM、来源与许可证交付

**文件：**

- 修改：`apps/game-boy/tools/homebrew-cartridges.json`
- 新增：`apps/game-boy/public/roms/adjustris.gb`
- 新增：`apps/game-boy/public/roms/brekstascat.gb`
- 新增：`apps/game-boy/public/roms/airplanz.gb`
- 新增：`apps/game-boy/public/roms/cross-connect.gbc`
- 新增：`apps/game-boy/public/roms/dysons-fear.gb`
- 新增：`apps/game-boy/public/roms/unstoppable-knight.gb`
- 新增：`apps/game-boy/public/roms/wyrmhole.gb`
- 修改：`apps/game-boy/public/roms/ATTRIBUTION.md`
- 新增：`apps/game-boy/public/roms/licenses/*`
- 新增：`apps/game-boy/public/roms/sources/*`

### 步骤 1：扩展 15 项清单

每项写入运行时身份、显示标题、版本、作者、许可证、Release URL、源码 URL、ROM SHA-256、许可证文件、GPL 源码归档、壳色、标签主题和两张输出纹理。前 7 项使用批准规格中的固定 Release URL 与 SHA-256；现有 8 项也计算并固定 SHA-256，避免仅凭文件名通过。

标签主题采用可直接生成的纯数据：

```json
{
  "background": "#182744",
  "accent": "#f5cb42",
  "secondary": "#58c7d9",
  "motif": "blocks",
  "series": "GAMEX HOMEBREW"
}
```

### 步骤 2：写入并复核 7 个已实机验证的 ROM

从已隔离审核目录复制对应字节到规范文件名；若审核目录不存在，再从规格固定的 GitHub Release URL 下载。逐个运行：

```bash
shasum -a 256 apps/game-boy/public/roms/adjustris.gb
shasum -a 256 apps/game-boy/public/roms/brekstascat.gb
shasum -a 256 apps/game-boy/public/roms/airplanz.gb
shasum -a 256 apps/game-boy/public/roms/cross-connect.gbc
shasum -a 256 apps/game-boy/public/roms/dysons-fear.gb
shasum -a 256 apps/game-boy/public/roms/unstoppable-knight.gb
shasum -a 256 apps/game-boy/public/roms/wyrmhole.gb
```

输出必须分别匹配设计规格中的七个哈希。

### 步骤 3：固定许可证与对应源码

把每款上游许可证文本保存为清单指向的文件。GPL 项保存与 ROM 版本对应的完整源码归档，并在 `ATTRIBUTION.md` 同行记录归档文件和 SHA-256。MIT、Zlib、CC0、CC BY 项也记录代码与素材许可证边界。

### 步骤 4：运行数据验证

```bash
npm run verify:homebrew-cartridges
```

预期：ROM、哈希、头部、许可证和源码交付相关检查通过；验证仍可因运行时卡带身份与标签尚未更新而失败。

### 步骤 5：提交素材数据

```bash
git add apps/game-boy/tools/homebrew-cartridges.json apps/game-boy/public/roms
git commit -m "feat(Game Boy): 补齐十五款开源卡带素材"
```

## 任务 3：生成与真实游戏一致的原创标签

**文件：**

- 修改：`apps/game-boy/tools/build-cartridges.mjs`
- 保留不改：`apps/game-boy/tools/pokemon-cartridges.json`
- 保留不改：`apps/game-boy/tools/sources/*`
- 新增或更新：`apps/game-boy/public/textures/baked-cartridge-*.jpg`

### 步骤 1：让生成器只读取主清单

把 `MANIFEST` 指向 `homebrew-cartridges.json`，移除扫描裁切逻辑。用 XML 转义后的清单字段生成 534×438 SVG；所有文字、主题几何图案和系列标都在本地生成。

### 步骤 2：实现标题排版和主题图形

实现确定性字号：

```js
function titleSize(title) {
  if (title.length <= 8) return 72;
  if (title.length <= 13) return 58;
  if (title.length <= 18) return 46;
  return 38;
}
```

按 `motif` 生成方块、轨道、城市、星场、字母格、圆环等原创 SVG 几何形；底部输出作者和许可证简称。不得嵌入 Pokémon 名称、Logo、角色或扫描图。

### 步骤 3：复用现有 UV 图集管线

同一张 SVG：

1. 旋转 270°；
2. 写入标准壳体图集；
3. 降低亮度与饱和度后写入 in-pocket 图集；
4. 保留清单中的壳体颜色。

### 步骤 4：生成并验证 30 张纹理

```bash
node apps/game-boy/tools/build-cartridges.mjs
npm run verify:homebrew-cartridges
```

预期：15 组标准与 in-pocket 纹理均为 1024×1024；生成器离线且不引用扫描资源。

### 步骤 5：提交标签管线

```bash
git add apps/game-boy/tools/build-cartridges.mjs apps/game-boy/public/textures
git commit -m "feat(Game Boy): 生成真实游戏名原创卡带标签"
```

## 任务 4：把主陈列身份、游戏映射和信息卡统一到清单

**文件：**

- 修改：`apps/game-boy/src/scene/game-boy-scene/cartridges/data/cartridges-config.ts`
- 修改：`apps/game-boy/src/scene/game-boy-scene/cartridges/cartridges-controller.ts`
- 修改：`apps/game-boy/src/scene/game-boy-scene/game-boy-games/games/emulator/emulator-games-config.ts`
- 修改：`apps/game-boy/src/scene/game-boy-scene/cartridges/data/cartridge-info-config.ts`
- 修改：`apps/game-boy/src/scene/game-boy-scene/game-boy-debug.ts`
- 修改：`apps/game-boy/src/scene/game-boy-scene/game-boy-games/game-boy-games.ts`
- 修改：`apps/game-boy/src/scene/game-boy-scene/game-boy-games/data/games-config.ts`
- 修改：`apps/game-boy/src/scene/game-boy-scene/game-boy-games/data/games-classes.ts`

### 步骤 1：重命名 15 个活动卡带 ID

`CARTRIDGE_TYPE` 保留 `Tetris` 与 `SpaceInvaders`，把 15 个 Pokémon 发行版 ID 按相同槽位顺序替换为真实游戏 ID。纹理名与清单一致；圆环坐标、旋转、振幅、速度和壳色不变。

### 步骤 2：统一映射到模拟器

15 个主陈列项的 `game` 全部设为 `GAME_TYPE.Emulator`。从活动游戏列表移除 `GAME_TYPE.PocketCreatures`，但保留 `games/pocket-creatures` 源码作为历史代码，不删除。

### 步骤 3：扩展模拟器配置和信息卡

`EMULATOR_GAMES_CONFIG` 精确覆盖 15 项。`CARTRIDGE_INFO_CONFIG`：

- 15 项均为 `kind: 'emulator'`；
- 标题、作者、许可证和源代码与主清单一致；
- `release` 为 `Open homebrew · 版本 · 年份`；
- Tetris 与 Space Invaders 为 `Archive · GameX built-in`。

### 步骤 4：把控制面板分成 Collection 与 Archive

在 `Game Boy` 文件夹中增加两个列表：

- `Collection`：15 张主陈列卡；
- `Archive`：Tetris、Space Invaders。

两个列表共用一个“Insert selected cartridge”动作，默认选择 Adjustris。不能把 Archive 项混入 15 张主列表。

### 步骤 5：运行类型、数据和布局验证

```bash
npm --prefix apps/game-boy run build
npm run verify:homebrew-cartridges
npm run verify:cartridge-layout
```

预期：身份、纹理、圆环与信息卡相关验证变绿；统一原生存档检查仍为红灯。

### 步骤 6：提交运行时身份改造

```bash
git add apps/game-boy/src/scene/game-boy-scene
git commit -m "feat(Game Boy): 匹配十五张卡带与开源游戏"
```

## 任务 5：先用单元测试定义原生快照与存储语义

**文件：**

- 修改：`apps/game-boy/package.json`
- 修改：`apps/game-boy/package-lock.json`
- 新增：`apps/game-boy/src/scene/game-boy-scene/game-boy-games/save/save-state-result.ts`
- 新增：`apps/game-boy/src/scene/game-boy-scene/game-boy-games/save/saveable-builtin-game.ts`
- 新增：`apps/game-boy/src/scene/game-boy-scene/game-boy-games/save/builtin-save-store.ts`
- 新增：`apps/game-boy/src/scene/game-boy-scene/game-boy-games/save/builtin-save-store.test.ts`

### 步骤 1：加入 Vitest

添加脚本：

```json
"test": "vitest run"
```

安装固定开发依赖并更新子应用锁文件：

```bash
npm --prefix apps/game-boy install --save-dev vitest@3.2.4
```

### 步骤 2：编写失败测试

测试内存版 `Storage`，覆盖：

1. 保存后使用精确键 `gamex:builtin-save:TETRIS:v1`；
2. 读取合法快照成功；
3. 缺失存档返回 `missing`；
4. 损坏 JSON 返回 `invalid`；
5. 错误版本或错误游戏 ID 返回 `invalid`；
6. `setItem` 抛错返回 `failed`；
7. 校验器不通过时不返回部分数据。

结果类型固定为：

```ts
type LoadStateResult<T> =
  | { status: 'loaded'; state: T }
  | { status: 'missing' }
  | { status: 'invalid' }
  | { status: 'failed' };
```

### 步骤 3：确认测试红灯

```bash
npm --prefix apps/game-boy test -- builtin-save-store
```

预期：因模块不存在而失败。

### 步骤 4：实现最小存储层并跑绿

`BuiltinSaveStore<T>` 接收游戏 ID、版本、类型守卫和 `Storage`；保存封装 `{ gameId, version, savedAt, state }`，读取时捕获解析与存储异常。

```bash
npm --prefix apps/game-boy test -- builtin-save-store
```

预期：全部通过。

### 步骤 5：提交存储契约

```bash
git add apps/game-boy/package.json apps/game-boy/package-lock.json apps/game-boy/src/scene/game-boy-scene/game-boy-games/save
git commit -m "test(Game Boy): 定义原生游戏快照存储契约"
```

## 任务 6：实现 Tetris 可恢复快照

**文件：**

- 新增：`apps/game-boy/src/scene/game-boy-scene/game-boy-games/games/tetris/state/tetris-save-state.ts`
- 新增：`apps/game-boy/src/scene/game-boy-scene/game-boy-games/games/tetris/state/tetris-save-state.test.ts`
- 修改：`apps/game-boy/src/scene/game-boy-scene/game-boy-games/games/tetris/tetris.ts`
- 修改：`apps/game-boy/src/scene/game-boy-scene/game-boy-games/games/tetris/screens/gameplay-screen/gameplay-screen.ts`
- 修改：`apps/game-boy/src/scene/game-boy-scene/game-boy-games/games/tetris/screens/gameplay-screen/field/field.ts`
- 修改：`apps/game-boy/src/scene/game-boy-scene/game-boy-games/games/tetris/screens/gameplay-screen/field/shape/shape.ts`
- 修改：`apps/game-boy/src/scene/game-boy-scene/game-boy-games/games/tetris/screens/gameplay-screen/next-shape.ts`

### 步骤 1：定义快照和守卫红灯测试

`TetrisSaveStateV1` 固定包含：

- `screen`；
- 20×10 棋盘格，每格为 `null` 或 `{ texture, tint, rotation }`；
- 当前方块类型、坐标、朝向；
- 下一个方块；
- `shapeFallTime`、`shapeFallInterval`；
- `lines`、当前等级行数、`score`、软降得分、`level`；
- `active`、`paused`、`gameOver`、快速下落与禁用下落状态。

测试合法状态、棋盘维度错误、非法方块、`NaN`、负分和未知画面。

### 步骤 2：确认守卫测试红灯

```bash
npm --prefix apps/game-boy test -- tetris-save-state
```

### 步骤 3：实现稳定捕获

在 `Field` 增加 `captureState()`。若消行动画正在运行，先同步完成已确定的行删除和计分，再捕获稳定棋盘；停止旧计时器，避免保存后回调再次修改状态。

### 步骤 4：实现事务式恢复

先用守卫验证整个对象；通过后：

1. 隐藏全部画面并重置；
2. 重建静态棋盘 Sprite；
3. 重建当前 Shape 的类型、位置和朝向；
4. 恢复下一个方块、计时、行数、分数与等级；
5. 恢复暂停、结束弹窗和可见画面；
6. 只在全部步骤成功时返回 `true`。

### 步骤 5：运行 Tetris 单元测试和构建

```bash
npm --prefix apps/game-boy test -- tetris-save-state
npm --prefix apps/game-boy run build
```

### 步骤 6：提交 Tetris 快照

```bash
git add apps/game-boy/src/scene/game-boy-scene/game-boy-games/games/tetris
git commit -m "feat(Game Boy): 支持俄罗斯方块状态存档"
```

## 任务 7：实现 Space Invaders 可恢复快照

**文件：**

- 新增：`apps/game-boy/src/scene/game-boy-scene/game-boy-games/games/space-invaders/state/space-invaders-save-state.ts`
- 新增：`apps/game-boy/src/scene/game-boy-scene/game-boy-games/games/space-invaders/state/space-invaders-save-state.test.ts`
- 修改：`apps/game-boy/src/scene/game-boy-scene/game-boy-games/games/space-invaders/space-invaders.ts`
- 修改：`apps/game-boy/src/scene/game-boy-scene/game-boy-games/games/space-invaders/screens/gameplay-screen/gameplay-screen.ts`
- 修改：`apps/game-boy/src/scene/game-boy-scene/game-boy-games/games/space-invaders/screens/gameplay-screen/player.ts`
- 修改：`apps/game-boy/src/scene/game-boy-scene/game-boy-games/games/space-invaders/screens/gameplay-screen/enemies-controller/enemies-controller.ts`
- 修改：`apps/game-boy/src/scene/game-boy-scene/game-boy-games/games/space-invaders/screens/gameplay-screen/enemies-controller/enemy.ts`
- 修改：`apps/game-boy/src/scene/game-boy-scene/game-boy-games/games/space-invaders/screens/gameplay-screen/missile/player-missile.ts`
- 修改：`apps/game-boy/src/scene/game-boy-scene/game-boy-games/games/space-invaders/screens/gameplay-screen/missile/enemy-missile.ts`
- 修改：`apps/game-boy/src/scene/game-boy-scene/game-boy-games/games/space-invaders/screens/gameplay-screen/ui-elements/player-lives.ts`
- 修改：`apps/game-boy/src/scene/game-boy-scene/game-boy-games/games/space-invaders/screens/gameplay-screen/ui-elements/score.ts`

### 步骤 1：定义快照和守卫红灯测试

`SpaceInvadersSaveStateV1` 固定包含：

- `screen`、`round`、`active`、`paused`；
- 玩家位置、方向、移动状态、射击冷却；
- 当前生命、分数；
- 敌人网格中的类型、行列、位置、存活、移动计时和射击状态；
- 玩家与敌人飞弹的位置、速度和活动状态；
- 敌群水平/垂直方向、步进和全局计时。

测试非法回合、越界玩家、负生命、未知敌人类型、非有限数值和错误飞弹结构。

### 步骤 2：确认守卫测试红灯

```bash
npm --prefix apps/game-boy test -- space-invaders-save-state
```

### 步骤 3：实现稳定捕获与实体快照

保存前停止爆炸和延迟删除回调；已命中的敌人按最终死亡状态捕获，已移除飞弹不写入快照。各实体暴露只包含可序列化值的 `captureState()`。

### 步骤 4：实现事务式恢复

完整校验后重置 Gameplay，再依次重建回合、UI、玩家、敌群、飞弹、冷却和当前画面。任何重建异常返回 `false`，由调用方保留读档前状态；实现时先在临时状态对象中完成所有可失败的转换，再提交到 Pixi 实体。

### 步骤 5：运行 Space Invaders 测试和构建

```bash
npm --prefix apps/game-boy test -- space-invaders-save-state
npm --prefix apps/game-boy run build
```

### 步骤 6：提交 Space Invaders 快照

```bash
git add apps/game-boy/src/scene/game-boy-scene/game-boy-games/games/space-invaders
git commit -m "feat(Game Boy): 支持太空侵略者状态存档"
```

## 任务 8：接通统一 Save / Load 门面与控制面板反馈

**文件：**

- 修改：`apps/game-boy/src/scene/game-boy-scene/game-boy-games/game-boy-games.ts`
- 修改：`apps/game-boy/src/scene/game-boy-scene/game-boy-scene-controller.ts`
- 修改：`apps/game-boy/src/scene/game-boy-scene/game-boy-debug.ts`
- 新增：`apps/game-boy/src/scene/game-boy-scene/game-boy-games/save/game-save-router.test.ts`

### 步骤 1：编写路由红灯测试

对三类当前游戏使用轻量 stub，断言：

- Emulator 调用 WasmBoy `saveState` / `loadState`；
- Tetris 使用 `gamex:builtin-save:TETRIS:v1`；
- Space Invaders 使用 `gamex:builtin-save:SPACE_INVADERS:v1`；
- 无游戏时返回 `unavailable`；
- 缺失原生存档返回 `missing`；
- 损坏快照返回 `invalid` 且不调用 `restoreState`。

### 步骤 2：实现统一门面

`GameBoyGames` 暴露：

```ts
public async saveCurrentGameState(): Promise<SaveStateResult>
public async loadCurrentGameState(): Promise<LoadStateResult>
```

按 `this.gameType` 路由 Emulator、Tetris、Space Invaders。其他类型和未运行状态返回 `unavailable`。

### 步骤 3：统一控制面板状态文案

控制器映射：

- `saved` → `Saved`；
- `loaded` → `Loaded`；
- `missing` → `No save state`；
- `invalid` / `failed` → `Load failed`；
- `unavailable` → `No game running`。

Save / Load 按钮在 Emulator、Tetris、Space Invaders 开始时均启用，停止时禁用。

### 步骤 4：运行路由、静态验证和构建

```bash
npm --prefix apps/game-boy test -- game-save-router
npm run verify:homebrew-cartridges
npm run verify:cartridge-layout
npm --prefix apps/game-boy run build
```

预期：原生快照与统一路由相关检查全部变绿。

### 步骤 5：提交统一存档

```bash
git add apps/game-boy/src/scene/game-boy-scene
git commit -m "feat(Game Boy): 统一十七张卡带存档入口"
```

## 任务 9：同步 Hub 并跑完整自动回归

**文件：**

- 更新：`public/game-boy/**`
- 修改：`docs/dev-notes/progress.md`

### 步骤 1：运行子应用测试与构建

```bash
npm --prefix apps/game-boy test
npm --prefix apps/game-boy run build
```

### 步骤 2：运行所有仓库验证

```bash
for script in $(node -e "const p=require('./package.json'); console.log(Object.keys(p.scripts).filter(k=>k.startsWith('verify:')).join(' '))"); do npm run "$script"; done
```

预期：所有 `verify:*` 退出码为 0。

### 步骤 3：运行 Hub 完整构建

```bash
npm run build
```

确认 `public/game-boy/roms`、`textures`、`licenses` 与 `sources` 是本次构建同步结果，不手工复制构建产物。

### 步骤 4：记录自动验证结果

在 `docs/dev-notes/progress.md` 记录测试数、验证脚本数、构建结果和 15 + 2 数据一致性。

### 步骤 5：提交构建同步

```bash
git add public/game-boy docs/dev-notes/progress.md
git commit -m "build(Game Boy): 同步匹配卡带发布产物"
```

## 任务 10：浏览器逐卡实玩验收 17/17

**文件：**

- 新增：`tmp/gamex-cartridge-acceptance.json`
- 新增：`tmp/gamex-cartridge-acceptance.html`
- 修改：`docs/dev-notes/progress.md`

### 步骤 1：启动开发服务器

```bash
npm run dev
```

使用 `develop-web-game` 技能规定的 Playwright 客户端连接 `http://127.0.0.1:5180/game-boy/`，不要另写替代浏览器驱动。

### 步骤 2：逐一验收 15 张 ROM 卡

每张卡使用独立页面上下文：

1. 从 Collection 选择并插入；
2. 确认信息卡标题、标签标题与模拟器配置一致；
3. 等待 LCD 出现非空、非 `LOAD ERROR` 画面；
4. 输入 Start、方向键和 A/B；
5. 对比输入前后 LCD 像素哈希，确认游戏响应；
6. 点击 Save，确认 `Saved`；
7. 记录 LCD 像素哈希；
8. 刷新，重新插入同一卡；
9. 点击 Load，确认 `Loaded`；
10. 等待两帧后确认恢复画面不是启动画面且继续更新；
11. 保存启动后与读档后截图；
12. 记录控制台错误。

### 步骤 3：实玩验收 Tetris

从 Archive 插入 Tetris，进入 Gameplay，移动/旋转/软降若干步，记录棋盘、当前方块、分数、等级；保存、刷新、重插、读取后逐项相等，并继续软降一格。

### 步骤 4：实玩验收 Space Invaders

从 Archive 插入 Space Invaders，进入 Gameplay，移动并射击，记录回合、玩家位置、生命、分数和存活敌人数；保存、刷新、重插、读取后逐项相等，并继续移动或射击。

### 步骤 5：生成可审计报告

`tmp/gamex-cartridge-acceptance.json` 每项包含：

```json
{
  "cartridge": "Adjustris",
  "labelTitle": "ADJUSTRIS",
  "runtimeTitle": "ADJUSTRIS",
  "booted": true,
  "inputChangedFrame": true,
  "saved": true,
  "loaded": true,
  "continued": true,
  "consoleErrors": []
}
```

`tmp/gamex-cartridge-acceptance.html` 汇总 17/17 结果并嵌入截图相对路径。报告只在 17 项全部通过时显示绿色总结果。

### 步骤 6：记录实玩结果

在 `docs/dev-notes/progress.md` 写明 17/17 逐卡结果、失败重试和证据目录。

### 步骤 7：提交验收记录

若 `tmp` 被忽略，仅提交 `docs/dev-notes/progress.md`，报告保留在工作区供用户打开：

```bash
git add docs/dev-notes/progress.md
git commit -m "test(Game Boy): 完成十七张卡带实玩验收"
```

## 任务 11：最终回归与完成判断

**文件：**

- 修改：`docs/dev-notes/progress.md`

### 步骤 1：再次运行全套测试、验证与构建

```bash
npm --prefix apps/game-boy test
npm --prefix apps/game-boy run build
for script in $(node -e "const p=require('./package.json'); console.log(Object.keys(p.scripts).filter(k=>k.startsWith('verify:')).join(' '))"); do npm run "$script"; done
npm run build
git diff --check
```

### 步骤 2：核对发布树

核对：

- 主清单正好 15 项；
- Archive 正好 2 项；
- 发布目录正好包含清单中的 15 个 ROM；
- 30 张活动标签纹理存在；
- 15 项署名与许可证完整；
- GPL 项源码归档存在且哈希匹配；
- 17 项自动/浏览器存读档路径都有证据。

### 步骤 3：检查工作区边界

```bash
git status --short
git diff --stat
```

确认未覆盖用户对 `2026-07-24-gamex-open-orbit-museum-design.md` 的修改，也未纳入三个 `sources/research_*.json` 未跟踪文件。

### 步骤 4：写入最终结果

把最终测试命令、通过数量、17/17 报告路径、已知非阻塞限制写入 `docs/dev-notes/progress.md`，再运行 `git diff --check`。

### 步骤 5：提交最终说明

```bash
git add docs/dev-notes/progress.md
git commit -m "docs(Game Boy): 记录匹配卡带最终验证"
```

