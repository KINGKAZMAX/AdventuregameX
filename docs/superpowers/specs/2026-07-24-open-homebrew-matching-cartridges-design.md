# GameX 开源游戏匹配卡带设计规格

- 日期：2026-07-24
- 状态：对话设计已由用户确认，等待书面规格审阅
- 适用范围：GameX 的 Game Boy 场景

## 目标

将当前卡带收藏改造成 15 张可直接游玩的开源 GB/GBC 卡带，并保证每一张都同时满足：

1. 卡带标签的大标题与实际启动游戏完全一致；
2. 插入后进入完整、可操作的游戏，而不是展示画面；
3. 使用同一套 Save state / Load state 控件保存并恢复；
4. 保留 1996–2001 年掌机卡带的配色、印刷质感与标签构图；
5. 不继续使用 Pokémon 名称、Logo、角色、官方标签扫描或商业 ROM。

## 已批准的视觉方向

保留现有 15 个卡带壳体的颜色与马蹄形陈列位置。标签改为 GameX 自制图稿：

- 主标题使用真实开源游戏名，必须在正常镜头距离下可辨认；
- 构图参考 1990 年代末掌机标签常见的放射线、网点、金属渐变、粗描边标题与角标；
- 左上角统一使用 `GAMEX HOMEBREW` 系列标；
- 底部显示游戏类型、作者和开放许可证简称；
- 每款使用与玩法对应的原创几何图案，例如方块、城市天际线、字母格、轨道或抽象生物轮廓；
- 不复刻 Pokémon 字标、角色剪影、官方产品编号或具体官方版式。

标准贴纸与插入机身后的暗色贴纸由同一份 SVG 标签生成，避免两套资源发生标题偏差。

## 最终卡带集合

卡带顺序沿用现有马蹄形布局，从左下向上再到右下。壳体颜色沿用当前 15 个槽位。

| 顺序 | 新卡带 ID | 标签标题 | ROM | 许可证 | 当前壳体配色来源 |
|---:|---|---|---|---|---|
| 1 | `Adjustris` | ADJUSTRIS | `adjustris.gb` | CC0-1.0 | JP Red 灰 |
| 2 | `BrekstasCat` | BREKSTA'S CAT | `brekstascat.gb` | GPL-3.0 | JP Green 灰 |
| 3 | `Airplanz` | AIRPLANZ | `airplanz.gb` | GPL-3.0 | JP Blue 灰 |
| 4 | `CrossConnect` | CROSS CONNECT | `cross-connect.gbc` | MIT | JP Pikachu 灰 |
| 5 | `DysonsFear` | DYSON'S FEAR | `dysons-fear.gb` | GPL-3.0 | US Red 红 |
| 6 | `UnstoppableKnight` | UNSTOPPABLE KNIGHT | `unstoppable-knight.gb` | MIT | US Blue 蓝 |
| 7 | `Wyrmhole` | WYRMHOLE | `wyrmhole.gb` | MIT | Pinball 黑 |
| 8 | `TobuTobuGirl` | TOBU TOBU GIRL | `tobutobugirl.gb` | MIT + CC BY 4.0 | US Yellow 黄 |
| 9 | `MicroCity` | MICRO CITY | `ucity.gbc` | GPL-3.0-or-later | JP Gold 深蓝 |
| 10 | `Game2048` | 2048 | `2048.gb` | Zlib | JP Silver 深灰 |
| 11 | `GbCorp` | GB CORP. | `gbcorp.gb` | MIT | TCG 黑 |
| 12 | `Carazu` | CARAZU | `carazu.gb` | GPL-3.0 | US Gold 金 |
| 13 | `ShockLobster` | SHOCK LOBSTER | `shock-lobster.gb` | Zlib | US Silver 银 |
| 14 | `Geometrix` | GEOMETRIX | `geometrix.gbc` | GPL-3.0-or-later | Puzzle 深绿 |
| 15 | `GbWordyl` | GB WORDYL | `gb-wordyl.gb` | GPL-3.0 | US Crystal 水晶蓝 |

## 新增 ROM 的固定来源

实现只使用作者 GitHub Release 发布的下列文件，并在写入仓库前校验 SHA-256：

| 游戏 | Release 文件 | SHA-256 |
|---|---|---|
| Adjustris v1.1 | `https://github.com/tbsp/Adjustris/releases/download/v1.1/adjustris.gb` | `b6c8affe6d906419cfc99ff459718f33a1868af03254a2f65cea2a9430394712` |
| Breksta's Cat 1.3 | `https://github.com/NotImplementedLife/brekstascat/releases/download/1.3/brekstascat_1_3.gb` | `e46dc09ce51b0bf3ca5c4539350ab7e2d4ea4d428329540605aa0a978ac3ece8` |
| AIRPLANZ 1.2 | `https://github.com/NotImplementedLife/AIRPLANZ/releases/download/1.2/AIRPLANZ_1_2.gb` | `5cdc8d6d3fffe403083df240208082ba0b8d7390a4b8fa93f955904094b8d1ef` |
| CrossConnect 1.0 | `https://github.com/QuinnPainter/CrossConnect/releases/download/1.0/CrossConnect.gbc` | `5465e7b4aa37ee0d630d2e63a026f282e8d17c213a2bd9f087417e68061e8b95` |
| Dyson's Fear v2.0 | `https://github.com/zeta0134/ludum-dare-42/releases/download/v2.0/ludum-dare-42-v2.0.gb` | `37802cae4b5b6df5c13e5a1cac563c4879246a420c6741cb5eb2e058d5a2ea0d` |
| Unstoppable Knight 2.2.2 | `https://github.com/Rafagars/Unstoppable-Knight-GB/releases/download/2.2.2/knight.gb` | `191c7fad34e643ab5f1083cd8f1a0582a4cef2bfee068bf36e18805f8bc40aaf` |
| Wyrmhole 1.1 | `https://github.com/QuinnPainter/Wyrmhole/releases/download/1.1/Wyrmhole.gb` | `a5e07f89119ee9c93aa50ec1ff828b2441781fa9b1a137f03af7b6c53ce03252` |

## 数据与组件边界

### 1. 单一卡带清单

`apps/game-boy/tools/homebrew-cartridges.json` 扩展为 15 项，成为标题、ROM、作者、许可证、来源、壳色、标签主题和纹理输出名的唯一事实来源。

运行时代码仍使用 TypeScript 配置，但自动验证器必须逐项比对 JSON 清单与：

- `CARTRIDGE_TYPE`；
- `CARTRIDGES_BY_TYPE_CONFIG`；
- `EMULATOR_GAMES_CONFIG`；
- `CARTRIDGE_INFO_CONFIG`；
- 生成后的两张纹理；
- `public/roms` 中的 ROM 与署名文件。

### 2. 卡带身份与布局分离

旧的 `JpRed`、`UsYellow` 等 Pokémon 发行版名称改为真实游戏 ID。马蹄形坐标仍按数组顺序保存，不再用发行版名称表达布局。

全部 15 张卡带映射到 `GAME_TYPE.Emulator`。`PocketCreatures` 不再进入活动游戏集合，也不再有任何卡带指向它。

### 3. 移除两张隐藏卡带

`Tetris` 与 `SpaceInvaders` 目前是可从控制面板插入的隐藏卡带，但不支持统一的模拟器状态存档。它们从 `CARTRIDGE_TYPE`、卡带配置和可选卡带菜单中移除，因此最终可选卡带总数固定为 15。

原生 Tetris / Space Invaders 游戏代码可以留作内部历史代码，但不能再通过用户界面作为卡带启动，也不能计入验收集合。

### 4. 标签生成器

`apps/game-boy/tools/build-cartridges.mjs` 不再裁切 Pokémon 扫描图，而是根据 15 项清单生成原创 SVG 标签，再复用现有 Sharp 管线：

1. 生成 534×438 的直立 SVG；
2. 使用标题长度对应的字号与自动换行；
3. 添加系列标、类型、作者、许可证和原创主题图形；
4. 旋转 270° 后写入标准 1024×1024 UV 图集；
5. 对同一标签降低亮度，写入 in-pocket 图集。

生成器不得联网，不得读取 `tools/sources` 下的 Pokémon 扫描图。

### 5. 游戏信息卡

长按信息卡的标题、说明、作者、许可证和源代码链接全部来自真实游戏。`release` 字段改为开源版本信息，例如 `Open homebrew · v1.1 · 2017`，不再出现 `Sleeve: Pokémon ...`。

所有 15 项的 `kind` 均为 `emulator`。

### 6. 统一存档

继续使用 WasmBoy 现有流程：

1. `saveState()` 暂停模拟器并创建状态；
2. `saveLoadedCartridge()` 将状态和电池 RAM 写入 IndexedDB；
3. `getSaveStates()` 按当前 ROM 头部读取本卡带状态；
4. `loadState()` 恢复最新状态并继续运行。

保存状态按 ROM 头部隔离。ROM-only 游戏也能使用模拟器状态存档；带 battery RAM 的游戏同时保存原生进度。

Save / Load 在未运行游戏、没有存档或 IndexedDB 失败时继续显示明确状态，不伪报成功。

## 许可证交付

`apps/game-boy/public/roms/ATTRIBUTION.md` 覆盖全部 15 款游戏，记录版本、作者、许可证、Release URL、源码 URL 和 ROM SHA-256。

每款游戏的许可证文本放入 `public/roms/licenses/`。GPL 游戏还需在 `public/roms/sources/` 提供对应版本的完整源码归档，构建后与 ROM 一起进入 Hub 静态目录。

Wyrmhole、CrossConnect、Unstoppable Knight 等含第三方字体、音乐或美术的项目，沿用作者 README 中的署名并收录到 `ATTRIBUTION.md`。

## 错误处理

- ROM 缺失或校验不符：构建验证直接失败，不产生可发布产物；
- 标签标题与 ROM 配置不一致：验证失败；
- ROM 在 WasmBoy 中启动失败：屏幕显示 `LOAD ERROR`，逐卡验收失败；
- 保存失败：控制面板显示 `Save failed`；
- 没有存档：显示 `No save state`；
- 读档失败：显示 `Load failed`；
- 标签生成失败：构建脚本退出非零，不保留半套新图集作为通过结果。

## TDD 与自动验证

生产代码之前先扩展验证器并确认红灯，至少覆盖：

1. 清单必须正好 15 项，游戏 ID、标题、ROM 文件和纹理输出均唯一；
2. 每项均映射 `GAME_TYPE.Emulator`；
3. 运行时不存在 Pokémon 卡带 ID、`PocketCreatures` 映射、显示型卡带或 Pokémon 袖套文案；
4. 不存在 Tetris / Space Invaders 可选卡带；
5. 每个 ROM 存在、SHA-256 与清单一致、Nintendo Logo 和两个校验和有效；
6. 每项有标准与 in-pocket 1024×1024 图集；
7. 标签生成器不读取 Pokémon 扫描图且不联网；
8. 每项有完整署名和许可证文件，GPL 项有源码归档；
9. 15 项全部具备 Save / Load 运行时路径。

红灯原因必须是当前产品仍有 8 项清单、7 张展示卡、Pokémon 标签和两张无统一存档的隐藏卡，而不是测试脚本错误。

## 浏览器逐卡验收

对 15 张卡带逐一执行独立场景，避免存档和模拟器上下文串扰：

1. 打开 Game Boy 页面并等待马蹄形陈列稳定；
2. 截图确认标签标题可见且保持对应壳色；
3. 插入该卡带，等待 ROM 启动；
4. 发送 `START`、方向键和 `A/B` 的短输入序列；
5. 确认画面响应且无 `LOAD ERROR`；
6. 保存状态并确认 `Saved`；
7. 刷新页面，重新插入同一卡带；
8. 读取状态并确认 `Loaded`，模拟器恢复运行；
9. 检查控制台没有新增错误；
10. 为每款保留启动后和读档后的截图证据。

最后运行 TypeScript、所有 `verify:*`、Game Boy 子应用构建、Hub 完整构建，并确认同步后的 `public/game-boy` 仍包含 15 个 ROM、纹理、许可证和 GPL 源码归档。

## 完成标准

只有以下证据同时成立才算完成：

- 可选卡带数量恰好为 15；
- 15/15 的标签标题与 ROM 配置一致；
- 15/15 能启动并响应输入；
- 15/15 能跨页面保存、读档并继续运行；
- 15/15 的信息卡与许可证资料真实对应；
- 所有自动验证与完整构建通过；
- 逐卡截图和控制台记录未发现漏项或新错误。
