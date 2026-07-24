# GameX 复古设备与开放 3D 资产调研

日期：2026-07-24
范围：360° 环形展馆、首期 8 个展位、开放 3D 资产、Three.js 接入与参赛权利边界。

## 结论

1. 首期应保留现有两个可玩设备，并把其余六个展位做成具有不同轮廓和交互暗示的原创化设备原型。
2. “小霸王学习机”是最有中国地域辨识度的参照，但没有找到权利链足够干净、可直接作为比赛最终资产的 SB-926/SB-486D 公开模型。因此首发不做忠实复刻，改为 `Retro Learning Computer`：以 jampakdd 的 CC BY 复古电脑低模为资产基础，并吸收“小霸王 + 中华学习机 CEC-I”的历史语义，重做品牌、配色、控制区和精确外壳。
3. Poly Pizza 与 Sketchfab 上有多项明确标记为 CC Attribution 的可下载资产，可用于内部原型或作为拓扑参考。其中 Poly Pizza 的通用模型直接提供 OBJ/glTF，接入成本最低。
4. CC BY 授权只覆盖创作者有权授权的模型表达，不自动授予设备商标、产品外观、屏幕角色、ROM 或游戏画面的权利。最终比赛版仍应去品牌化、重做材质与轮廓，并保留逐资产署名及修改记录。
5. 首发六个 Coming Soon 展位都必须绑定一项已核实的开放许可 3D 资产。Three.js 程序化玻璃外壳只用于模型尚未完成下载时的首屏骨架，以及 GLB 加载、许可校验或性能检查失败时的降级，不替代开放资产要求。

## 推荐的首期 8 个展位

| ID | 展品名 | 状态 | 历史参照 | MVP 资产策略 | 后续交互 |
|---|---|---|---|---|---|
| 01 | Pocket Play | LIVE | 竖版卡带掌机 | 保留现有可玩设备，参赛前原创化品牌与材质 | 插卡、开机、按键、游玩 |
| 02 | Pocket Care | LIVE | 掌上电子宠物 | 保留现有可玩设备，参赛前原创化角色与外壳 | 孵化、喂食、照料 |
| 03 | Retro Learning Computer | SOON | 小霸王第一代电脑学习机、CEC-I | jampakdd CC BY 复古电脑低模为基础；重做外壳、卡槽与控制区 | 插入“学习卡”、键盘发光、BASIC 终端 |
| 04 | Cartridge Home Console | SOON | FC 兼容机与早期家用卡带主机 | Poly Pizza 通用 CC Attribution 家用主机低模；重做仓门和控制器 | 卡带悬浮、仓门开合、双控制器 |
| 05 | Wide Handheld | SOON | 横版掌机 | 通用 CC BY 横版低模作原型，最终重做轮廓与按钮 | 摇杆视差、屏幕扫描线 |
| 06 | Dual LCD Pocket | SOON | 双屏 LCD 掌机 | 625-triangle CC BY 折叠掌机可作技术原型，最终重做轮廓 | 开合、双屏、段码动画 |
| 07 | Block Matrix Handheld | SOON | 1990 年代 Brick Game 类掌机 | 2.1k-triangle CC BY 模型可作原型；删除 Tetris 名称与屏幕 | 点阵呼吸、方块重组 |
| 08 | Arcade Terminal | SOON | 多游戏街机系统 | 使用通用 CC BY 街机低模做比例参考，再原创化机柜 | 摇杆、多个游戏槽、CanvasTexture 吸引画面 |

推荐历史来源：

- 小霸王官方品牌史：<https://www.suborsmart.com/about.aspx?fid=n1%3A1%3A1>
- 小霸王 SB-486 / SB-486D 展示资料：<https://retro.chiba.tw/zh-cn/consoles/subor/>
- Google Arts & Culture 的 Subor D21R 藏品页：<https://artsandculture.google.com/asset/video-game-console-subor-video-game-system-d21r-famicom-clone-subor/pwGOQtXJbDC_eA?hl=en>
- 中国计算机学会的中华学习机 CEC-I 资料：<https://www.ccf.org.cn/Computing_history/Full_List/2021/yllsjy/2022-04-21/760882.shtml>
- Centre for Computing History 的 Vectrex 资料：<https://www.computinghistory.org.uk/sec/15376/Vectrex/>
- SNK Neo Geo Museum 的多游戏系统资料：<https://neogeomuseum.snk-corp.co.jp/english/whats/index.php>
- Nintendo Game & Watch 型号演变：<https://www.nintendo.com/tw/hardware/gamewatch/history.html>
- Home Computer Museum 的 Watara Supervision 资料：<https://www.homecomputermuseum.nl/collectie/hartung-spiele-berlin/supervision-9205/>
- Digital Game Museum 的 Dreamcast Controller / VMU 资料：<https://www.digitalgamemuseum.org/consolecontrollerevolution/analog/dreamcast/>

## 可下载 3D 资产候选

以下“可用”仅指模型页面声明的下载与许可证状态，不代表已完成商标、外观或赛事规则审查。

| 资产 | 作者 / 平台 | 页面披露 | 许可证标记 | 建议 |
|---|---|---|---|---|
| Retro Computer With Mouse And Keyboard | jampakdd / Sketchfab | 可下载；1.5k triangles；通用复古电脑 | CC Attribution | 首选 Retro Learning Computer 资产基础；重新设计成键盘主机与学习卡结构 |
| Handheld game console | Poly by Google / Poly Pizza | OBJ/glTF；通用折叠掌机 | CC Attribution | 优先用于 Dual LCD Pocket 原型；最终去除可识别品牌轮廓 |
| Retro Handheld | Michael Fuchs / Poly Pizza | OBJ/glTF；通用低模 | CC Attribution | 用于横版或倾斜屏掌机的比例研究 |
| Handheld videogame console | Poly by Google / Poly Pizza | OBJ/glTF；通用便携主机 | CC Attribution | 可作为另一种横向掌机占位 |
| Videogame | Poly by Google / Poly Pizza | OBJ/glTF；通用家用主机 | CC Attribution | 可作为家用主机占位，不用于小霸王最终外形 |
| Arcade Cabinet | Chris Ross / Poly Pizza | OBJ/glTF；低模街机 | CC Attribution | 可作 Multi-Slot Arcade 原型 |
| Arcade Machine | J-Toastie / Poly Pizza | OBJ/glTF；低模街机 | CC Attribution | 街机备用方案 |
| Keyboard | Poly by Google / Poly Pizza | OBJ/glTF；低模键盘 | CC Attribution | 可用于 Chinese Learning Terminal 的灰盒原型 |
| Dendy Junior | otztava / Sketchfab | 可下载；17.5k triangles | CC Attribution | 仅作为 FC 兼容机历史/比例参考；不直接进入比赛版 |
| NES Console | Mark / Sketchfab | 可下载；2.9k triangles；无机身标识 | CC Attribution | 轻量家用主机灰盒参考；最终仍需重做可识别外观 |
| PlayStation Portable (low poly) | Senkinsky / Sketchfab | 可下载；2.2k triangles | CC Attribution | 横版掌机技术原型；正式版更改轮廓、控制区与名称 |
| Low Poly Nintendo DS Lite | Asith / Sketchfab | 可下载；625 triangles；作者说明含动画 | CC Attribution | 折叠机最佳轻量原型；正式版重做铰链比例、双屏边框和按键 |
| Tetris Brick Game | alikulovd4 / Sketchfab | 可下载；2.1k triangles；2048² 贴图 | CC Attribution | 改成原创 Block Matrix Handheld；删除 Tetris 名称、标识和屏幕内容 |
| Arcade cabinet (animated) | Jungle Jim / Sketchfab | 可下载；16.5k triangles；原始文件含视频纹理动画 | CC Attribution | 机柜比例参考；Three.js 中重做原创 CanvasTexture 屏幕 |
| brick game | hoti28 / Sketchfab | 可下载；1.6k triangles | CC Attribution | 可增加为后续第 9 个“Matrix Handheld” |
| Game & Watch 3D Model | Rolando Rodríguez / Sketchfab | 可下载；2.3k triangles | CC Attribution | 双屏/LCD 类结构参考；最终避免复制品牌外观 |
| Game Boy Low-Poly | ItsKevin / Sketchfab | 可下载；1k triangles | CC Attribution | 轻量，但现有 LIVE 设备已经有模型，无需替换 |
| Tamagotchi | david.holubec / Sketchfab | 可下载；34.1k triangles | CC Attribution | 可作造型参考；现有 LIVE 设备已经有模型 |

直达资产页：

- <https://sketchfab.com/3d-models/retro-computer-with-mouse-and-keyboard-b0a0b822b3be444ab751414c657658c8>
- <https://poly.pizza/m/fw194G1mJA9>
- <https://poly.pizza/m/2nwiJ7W4kkz>
- <https://poly.pizza/m/5kxD7n4F3lv>
- <https://poly.pizza/m/7jHiQIMZkRs>
- <https://poly.pizza/m/b9lf-ax7x99>
- <https://poly.pizza/m/GLDkMhiynM>
- <https://poly.pizza/m/3oFfQCSsUmQ>
- <https://sketchfab.com/3d-models/dendy-junior-c05cb0fb636c4384a854e171b5f66e10>
- <https://sketchfab.com/3d-models/nes-console-be009d7934d44512966b4fde47f63a19>
- <https://sketchfab.com/3d-models/playstation-portable-low-poly-605b9202aa83410585e31d02a1d50972>
- <https://sketchfab.com/3d-models/low-poly-nintendo-ds-lite-handheld-console-b3660f0432ac4da4a6693f5e2134e27d>
- <https://sketchfab.com/3d-models/tetris-brick-game-1673b76dc0974dd58762e299fbdc3a00>
- <https://sketchfab.com/3d-models/arcade-cabinet-animated-7be522b744cf428e8bc813608bfc44d8>
- <https://sketchfab.com/3d-models/brick-game-fe21fb14599f410e89d173c9e492d27d>
- <https://sketchfab.com/3d-models/game-watch-3d-model-231d4f7905204344a8dc7a91d3aa85b8>
- <https://sketchfab.com/3d-models/game-boy-3d-model-low-poly-7dadb04be00844119df5d3273740470b>
- <https://sketchfab.com/3d-models/tamagotchi-e1570963f72a486686aa7d095ace5f03>

排除或谨慎使用：

- 仅“免费”但没有清楚许可证的模型。
- CC BY-NC：比赛可能包含奖金、赞助、宣传或商业展示，不应假定属于非商业使用。
- CC BY-ND：无法合法分发修改后的去品牌化模型。
- 从游戏 ROM、Model Resource、厂商游戏或其他作品中提取的模型，即使上传页写 CC BY 也不能建立可靠权利链。
- 小霸王忠实模型搜索结果中出现的“仅限学习交流”与积分下载资产不适合作为比赛最终资产。

CC BY 4.0 允许复制、再分发和改作，包括商业目的，但必须署名、链接许可证并标明修改；同时明确提醒其他权利可能仍需另行许可：<https://creativecommons.org/licenses/by/4.0/>

## Three.js 接入架构

### 单一展馆世界

根应用新增一个 Three.js `MuseumScene`，只创建一个展馆 WebGL renderer。8 个展台、中央记忆核心、地面、灯光和设备外壳都属于这个场景。

现有 Game Boy 与 Dammagotchi 是两个独立 WebGL 应用，不能低风险地直接合并进同一个 renderer。建议使用“场景门户”：

1. 用户从展馆点击 LIVE 设备。
2. 父场景相机推进到设备屏幕。
3. 设备屏幕位置出现与透视对齐的 HTML/iframe 互动层。
4. 父场景保持挂载并暂停高成本效果。
5. 退出时移除互动层，相机返回进入前的方位。

视觉上仍是同一个展馆与同一台设备进入聚焦态，同时避免同时运行三个重型 WebGL 世界。

### 设备注册表

所有展位由单一注册表生成，至少包含：

```text
id
exhibitNumber
name
year
status: live | coming-soon
azimuth
icon
placeholderArchetype
modelUrl
modelLicense
runtimeUrl
interactionHint
```

场景展位、右上角玻璃图标、展签、URL 状态和署名页都读取这份数据。新增第 9 台设备只增加注册表记录。

### 模型加载与交互

- 统一使用 GLB/glTF 2.0；Khronos 将 glTF 定义为面向运行时、紧凑且可互操作的 3D 传输格式。
- `GLTFLoader` 接入 Meshopt 或 Draco 几何压缩，并用 KTX2/Basis 压缩纹理。
- `LoadingManager` 负责进度、错误和中止；模型 404 时使用程序化占位，不让展位消失。
- Raycaster 不直接命中复杂模型，而命中每台设备的简单隐形 proxy box，保证桌面和触控命中稳定。
- 重复展台、灯环和地面标记用 `InstancedMesh` 减少 draw calls。
- 设备近景、环形中景和远景使用 LOD；只有当前聚焦设备加载高细节版本。
- 模型动画只开放明确定义的节点，例如 `screen_hinge`、`cartridge_slot`、`button_a`，避免运行时依赖模型内部任意命名。

官方技术来源：

- glTF 2.0 规范：<https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html>
- Three.js GLTFLoader：<https://threejs.org/docs/pages/GLTFLoader.html>
- Three.js KTX2Loader：<https://threejs.org/docs/pages/KTX2Loader.html>
- Three.js LoadingManager：<https://threejs.org/docs/pages/LoadingManager.html>
- Three.js Raycaster：<https://threejs.org/docs/pages/Raycaster.html>
- Three.js InstancedMesh：<https://threejs.org/docs/pages/InstancedMesh.html>
- Three.js LOD：<https://threejs.org/docs/pages/LOD.html>
- glTF Transform：<https://github.com/donmccurdy/glTF-Transform>

## 建议的模型预算

这些是 GameX 的项目目标，不是 Three.js 官方硬限制：

- 首屏先渲染 8 个程序化骨架，再渐进替换为注册表绑定的开放许可模型；外部模型不阻塞进入展馆，但最终稳定状态必须显示所选开放资产或明确的错误降级状态。
- 单个中景设备：不超过 25k triangles、1 张 1024² 主贴图。
- 单个聚焦设备：不超过 50k triangles；只有聚焦时允许 2048² 贴图。
- 展馆初始 GLB/纹理下载总量：目标不超过 4 MB。
- 移动端 device pixel ratio 上限：1.5。
- 同时活跃的子应用 runtime：1 个；离开的 runtime 必须 pause 或销毁。
- 所有外部资产都要经过 `inspect → dedup/prune → meshopt/draco → texture resize/KTX2 → validate` 的可复现流程。

## 资产清单字段

每个被采用的外部模型都应进入 `assets-manifest.json` 或等价文档：

```text
assetId
title
creator
sourceUrl
downloadedAt
license
licenseUrl
originalSha256
modifications
outputFile
outputSha256
trademarkRemoved
reviewStatus
```

## 原始检索结果

- `sources/research_retro_device_taxonomy.json`
- `sources/research_open_retro_3d_assets.json`
- `sources/research_threejs_asset_pipeline.json`
