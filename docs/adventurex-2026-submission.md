# AdventureX 2026 提交内容（提交就绪版 — 2026-07-26 凌晨整理）

> 只保留今晚可以诚实证明的内容。之前草稿里六个赛道的"必须补充"清单一项都没有真正完成
> （无 Verify Agent、无 Injective 集成、无灵光使用记录、无 B 站内容、无可安装 PICO APK、
> 无真实用户测试记录），所以本版本**不预选任何合作方赛道**，只报主题。如果你愿意亲口
> 向评委承认"这块还没做完"，也可以自行勾选任意赛道——但不要在文书里写这些赛道要求的
> 具体证据，因为都不存在。

## 1. 基本信息

### 项目名称
```text
自由意志 GameX｜8-bit 记忆穿越馆
```

### 一句话介绍
```text
自由意志 GameX 是一座可以被进入的数字记忆博物馆：玩家穿越像素化的童年，在卡匣、游戏与虚拟宠物之间重新唤醒一段陪伴，并将它保存为可以继续抵达的记忆。
```

### 英文副标题
```text
Free Will｜8-bit Memory Odyssey
```

## 2. 主题

```text
8bit 元境
```

> 最终名称以 Portal 下拉选项为准。只选这一个主题，不额外报合作方赛道。

## 3. 项目详细介绍（Markdown，可直接粘贴）

```markdown
# 自由意志 GameX｜8-bit 记忆穿越馆

## 我们为什么做
我们曾经把童年藏进一块屏幕：插入卡匣，按下开机键，在微弱的像素光里度过一整个下午。
自由意志 GameX 为这些记忆建造了一座可以穿越的数字博物馆——保存的不是冷冰冰的硬件，
而是人与设备相遇时的温度。

## 自由意志 GameX 是什么
一座可进入、可操作、可留下痕迹的 8-bit 数字记忆馆。用户可以旋转一台可交互的 3D
掌机、从环形卡匣墙上选择并插入卡匣，在浏览器里真实运行 15 款开放许可的 Game Boy /
Game Boy Color homebrew 游戏（不是模拟片段，是完整可玩、可存档读档的真实游戏）；
也可以照料一只虚拟宠物，喂食、换色、听它在每次回来时的问候。

## 核心体验
1. 旋转 3D 掌机，从对称环形卡匣墙上选择卡匣并插入，重新点亮屏幕。
2. 在浏览器中运行 15 款真实的开放许可 Game Boy/GBC homebrew 游戏，存档/读档跨刷新保留。
3. 两款内置原创小游戏（Tetris、Space Invaders）收纳在"Archive"中，同样可插入、可存档。
4. 照料虚拟宠物，喂食、换色主题、在再次相遇时留下个人痕迹。
5. 双语（中/英）、原创 chiptune 背景音乐（Web Audio API 实时合成，非版权曲目）。

## 8-bit 元境主题契合
我们不把 8-bit 当作怀旧滤镜，而当作仍能承载灵魂的语言：像素是过去的坐标，卡匣是记忆
的入口，存档则像一颗微小而坚定的心脏，让离开的人还能从原处继续出发。

## 技术实现
- Three.js：3D 掌机、卡匣与环形展示、相机与交互
- PixiJS：掌机 LCD 中的 2D 画面渲染
- WebAssembly + WasmBoy：浏览器内真实运行开放许可 ROM
- Vite、TypeScript、JavaScript：多应用构建与集成
- IndexedDB / localStorage：游戏存档、宠物状态、用户设置持久化
- Web Audio API：实时合成原创 chiptune

## 权利与开源边界
入口整合代码由 KINGKAZMAX 制作，MIT 协议。所有可玩游戏均为公开许可的 Game Boy /
GBC homebrew 作品，逐一列出作者、许可证与源码链接，见仓库 `ATTRIBUTION.md`；
WasmBoy 模拟器为 GPL-3.0-or-later。不冒充任何第三方素材为原创，不使用任何未获授权
的商业角色/品牌素材。
```

## 4. 技术栈字段
```text
JavaScript, TypeScript, Three.js, PixiJS, WebAssembly, WasmBoy, Vite, Web Audio API, IndexedDB, HTML5 Canvas, iframe, PostMessage
```

## 5. 建议标签
```text
游戏、互动叙事、数字纪念、文化、娱乐、音乐、图像
```

## 6. 主题色
```text
#3c3c43
```
（当前实际 UI 用的灰色调，不是旧草稿里的 `#9AA36A` 橄榄绿——那个颜色已经不再使用。）

## 7. 外部链接

### GitHub（已就绪：public + 已加 `adventurex2026` topic）
```text
https://github.com/KINGKAZMAX/AdventuregameX
```

### 项目尝试链接（可选）
```text
[如果想提交在线可玩 Demo，需要先部署到一个 HTTPS 地址（Vercel/Netlify/GitHub Pages
均可，几分钟能搞定）；如果 Expo 现场直接用笔记本本地演示，这一项可以留空——官方规则
写的是可选]
```

### 小红书发布链接
```text
[需要团队一人现在发一篇图文笔记或视频，带 #adventurex #夏天属于黑客松 标签，然后把
链接贴在这里]
```

## 8. 图片/视频轮播图
```text
[ ] 第一张必须是 16:9 封面 —— 已生成一版候选：
    docs/reference/submission/cover-16x9-candidate.png（从 GAMEX-横屏漂浮4K 1.png 裁切）
    请自行确认这张图能不能代表当前真实版本，不满意就换一张真实运行截图
[ ] 3D 掌机互动截图（建议现在开着的 http://localhost:5180 直接截）
[ ] 卡匣插入 + homebrew 游戏实际运行截图
[ ] 虚拟宠物照料截图
[ ] 60–90 秒演示视频（Expo 现场用 Slide + 现场操作即可，不强制先剪好视频）
```

## 9. 团队成员
```text
[队友最多 3 人（不含自己），到 Portal 里逐一填写——这个我不知道，需要你自己填]
```

## 10. 赛道（本版本不预选，见文件顶部说明）
```text
（留空，或由你自行决定要不要现场向评委承认"进行中"来换一个赛道尝试）
```

## 11. 提交前最终检查（诚实版，对照官方规则）
```text
[x] 项目代码已上传 GitHub，仓库为 public，已加 adventurex2026 topic
[ ] 主题已在 Portal 中选择：8bit 元境
[ ] 小红书图文/视频已发布，带 #adventurex #夏天属于黑客松，链接已填入表单
[ ] Slide Show 已准备好（见 docs/reference/submission/expo-slides.html）
[ ] 项目介绍/文书字段已按上面内容填入 Portal
[ ] 团队成员已在 Portal 填写完整
[ ] GitHub 仓库链接已填入
[ ] 小红书链接已填入
[ ] （可选）在线 Demo 链接已填入，或现场用本地演示
[ ] 已点击"保存修改"
[ ] 已点击"提交审核"
[ ] Portal 状态显示"已提交/审核中"，已截图留档
```
