import { CARTRIDGE_TYPE } from './cartridges-config';
import { EMULATOR_GAMES_CONFIG } from '../../game-boy-games/games/emulator/emulator-games-config';

// Descriptions shown when a cartridge is LONG-PRESSED. Cartridges that run a
// real, open-licensed homebrew game merge their author/license/source from
// EMULATOR_GAMES_CONFIG; the rest describe the real Pokemon release they
// reproduce, or the built-in mini-game they carry.

type LocalizedText = { en: string; zh: string };

interface CartridgeInfo {
  // Big title on the card.
  title: LocalizedText;
  // Real cartridge release line (always shown, small).
  release: LocalizedText;
  // Short blurb about the playable game or the cartridge.
  blurb: LocalizedText;
  // 'emulator' pulls author/license/source from EMULATOR_GAMES_CONFIG.
  kind: 'emulator' | 'builtin' | 'display';
}

const CARTRIDGE_INFO_CONFIG: { [key in CARTRIDGE_TYPE]?: CartridgeInfo } = {
  // --- Real, playable open-source homebrew (runs on the emulator) ---
  [CARTRIDGE_TYPE.UsYellow]: {
    title: { en: 'Tobu Tobu Girl', zh: 'Tobu Tobu Girl（飞天少女）' },
    release: { en: 'Sleeve: Pokémon Yellow · US 1999 (DMG-APSE)', zh: '卡带外观：宝可梦 皮卡丘版 · 美版 1999（DMG-APSE）' },
    blurb: {
      en: 'Bounce ever higher off enemies to rescue your falling friend in this fast, charming arcade climber.',
      zh: '踩着敌人不断向上弹跳，救回坠落的伙伴——轻快可爱的街机跳跃游戏。',
    },
    kind: 'emulator',
  },
  [CARTRIDGE_TYPE.JpGold]: {
    title: { en: 'µCity (Micro City)', zh: 'µCity（微城市）' },
    release: { en: 'Sleeve: Pocket Monsters Gold · JP 1999 (DMG-AAUJ)', zh: '卡带外观：口袋妖怪 金 · 日版 1999（DMG-AAUJ）' },
    blurb: {
      en: 'Build and run your own city — zoning, budgets and traffic — a SimCity-style builder on real Game Boy hardware.',
      zh: '规划分区、管理预算与交通，经营属于你的城市——运行在真实 Game Boy 上的模拟城市。',
    },
    kind: 'emulator',
  },
  [CARTRIDGE_TYPE.JpSilver]: {
    title: { en: '2048', zh: '2048' },
    release: { en: 'Sleeve: Pocket Monsters Silver · JP 1999 (DMG-AAXJ)', zh: '卡带外观：口袋妖怪 银 · 日版 1999（DMG-AAXJ）' },
    blurb: {
      en: 'Slide and merge numbered tiles until you reach the 2048 tile in this addictive puzzle classic.',
      zh: '滑动合并数字方块，一路合成到 2048——经典上瘾的数字益智游戏。',
    },
    kind: 'emulator',
  },
  [CARTRIDGE_TYPE.UsCrystal]: {
    title: { en: 'GB Wordyl', zh: 'GB Wordyl（猜词）' },
    release: { en: 'Sleeve: Pokémon Crystal · US 2001 (CGB-BYTE)', zh: '卡带外观：宝可梦 水晶版 · 美版 2001（CGB-BYTE）' },
    blurb: {
      en: 'Guess the hidden five-letter word in six tries — a Wordle-style game made for the Game Boy.',
      zh: '六次机会猜出隐藏的五字母单词——Game Boy 上的 Wordle。',
    },
    kind: 'emulator',
  },
  [CARTRIDGE_TYPE.UsGold]: {
    title: { en: 'Carazu', zh: 'Carazu' },
    release: { en: 'Sleeve: Pokémon Gold · US 2000 (DMG-AAUE)', zh: '卡带外观：宝可梦 金版 · 美版 2000（DMG-AAUE）' },
    blurb: {
      en: 'A hand-crafted side-scrolling action platformer built from scratch for the Game Boy.',
      zh: '为 Game Boy 从零打造的横版动作平台游戏。',
    },
    kind: 'emulator',
  },
  [CARTRIDGE_TYPE.Puzzle]: {
    title: { en: 'Geometrix', zh: 'Geometrix' },
    release: { en: 'Sleeve: Pokémon Puzzle Challenge · US 2000 (CGB-BPNE)', zh: '卡带外观：宝可梦 益智挑战 · 美版 2000（CGB-BPNE）' },
    blurb: {
      en: 'A fast falling-piece puzzle game — clear the board before the shapes stack to the top.',
      zh: '快节奏的落块益智游戏——在方块堆到顶端前清空棋盘。',
    },
    kind: 'emulator',
  },
  [CARTRIDGE_TYPE.Tcg]: {
    title: { en: 'GB Corp.', zh: 'GB Corp.（游戏公司）' },
    release: { en: 'Sleeve: Pokémon Trading Card Game · US 2000 (DMG-AXQE)', zh: '卡带外观：宝可梦 集换卡牌 · 美版 2000（DMG-AXQE）' },
    blurb: {
      en: 'Run a tiny video-game company and juggle its departments in this quirky management game.',
      zh: '经营一家小型游戏公司，平衡各个部门——别具一格的经营模拟游戏。',
    },
    kind: 'emulator',
  },
  [CARTRIDGE_TYPE.UsSilver]: {
    title: { en: 'Shock Lobster', zh: 'Shock Lobster' },
    release: { en: 'Sleeve: Pokémon Silver · US 2000 (DMG-AAXE)', zh: '卡带外观：宝可梦 银版 · 美版 2000（DMG-AAXE）' },
    blurb: {
      en: 'Charge your shock and blast through waves of deep-sea foes in this arcade action game.',
      zh: '蓄力放电，冲破深海敌群——街机风格的动作游戏。',
    },
    kind: 'emulator',
  },

  // --- Built-in mini-games (kept in Storage) ---
  [CARTRIDGE_TYPE.Tetris]: {
    title: { en: 'Tetris', zh: '俄罗斯方块' },
    release: { en: 'Original GameX built-in game', zh: 'GameX 内置原生游戏' },
    blurb: {
      en: 'The falling-block classic, rebuilt natively in this scene. Stored above the stage — insert it from the Control panel.',
      zh: '经典的落块游戏，在本场景中原生重制。收纳在舞台上方——可从控制面板插入。',
    },
    kind: 'builtin',
  },
  [CARTRIDGE_TYPE.SpaceInvaders]: {
    title: { en: 'Space Invaders', zh: '太空侵略者' },
    release: { en: 'Original GameX built-in game', zh: 'GameX 内置原生游戏' },
    blurb: {
      en: 'The arcade shooter, rebuilt natively in this scene. Stored above the stage — insert it from the Control panel.',
      zh: '经典的街机射击游戏，在本场景中原生重制。收纳在舞台上方——可从控制面板插入。',
    },
    kind: 'builtin',
  },

  // --- Display cartridges: reproduce a real Pokemon release (boot splash) ---
  [CARTRIDGE_TYPE.JpRed]: {
    title: { en: 'Pocket Monsters Aka (Red)', zh: '口袋妖怪 赤' },
    release: { en: 'Japan · Feb 1996 (DMG-APAJ) — the very first', zh: '日本 · 1996 年 2 月（DMG-APAJ）——初代第一作' },
    blurb: {
      en: 'The cartridge that started it all. Displayed for its authentic label and shell; boots to a version splash.',
      zh: '开创一切的初代卡带。此处展示其原版贴纸与壳色，插入后显示版本开机画面。',
    },
    kind: 'display',
  },
  [CARTRIDGE_TYPE.JpGreen]: {
    title: { en: 'Pocket Monsters Midori (Green)', zh: '口袋妖怪 绿' },
    release: { en: 'Japan · Feb 1996 (DMG-APCJ)', zh: '日本 · 1996 年 2 月（DMG-APCJ）' },
    blurb: {
      en: 'The Japan-only companion to Red. Displayed for its authentic Venusaur label and grey shell.',
      zh: '与赤版同期、仅在日本发售的绿版。展示其原版妙蛙花贴纸与灰色外壳。',
    },
    kind: 'display',
  },
  [CARTRIDGE_TYPE.JpBlue]: {
    title: { en: 'Pocket Monsters Ao (Blue)', zh: '口袋妖怪 青' },
    release: { en: 'Japan · Oct 1996 (DMG-APEJ)', zh: '日本 · 1996 年 10 月（DMG-APEJ）' },
    blurb: {
      en: 'The refined Japanese Blue with upgraded art. Displayed for its authentic Blastoise label.',
      zh: '画面升级的日版青版。展示其原版水箭龟贴纸。',
    },
    kind: 'display',
  },
  [CARTRIDGE_TYPE.JpPikachu]: {
    title: { en: 'Pocket Monsters Pikachu (Yellow)', zh: '口袋妖怪 皮卡丘' },
    release: { en: 'Japan · Sep 1998 (DMG-APSJ)', zh: '日本 · 1998 年 9 月（DMG-APSJ）' },
    blurb: {
      en: 'The Pikachu Edition that followed the anime. Displayed for its authentic yellow label.',
      zh: '呼应动画的皮卡丘特别版。展示其原版黄色贴纸。',
    },
    kind: 'display',
  },
  [CARTRIDGE_TYPE.UsRed]: {
    title: { en: 'Pokémon Red', zh: '宝可梦 红版' },
    release: { en: 'North America · Sep 1998 (DMG-APAE)', zh: '北美 · 1998 年 9 月（DMG-APAE）' },
    blurb: {
      en: 'The Western debut with its iconic red Charizard shell. Displayed for its authentic label.',
      zh: '西方首发、标志性的红色喷火龙卡带。展示其原版贴纸与壳色。',
    },
    kind: 'display',
  },
  [CARTRIDGE_TYPE.UsBlue]: {
    title: { en: 'Pokémon Blue', zh: '宝可梦 蓝版' },
    release: { en: 'North America · Sep 1998 (DMG-APEE)', zh: '北美 · 1998 年 9 月（DMG-APEE）' },
    blurb: {
      en: 'The Western Blue with its blue Blastoise shell. Displayed for its authentic label.',
      zh: '西方蓝版、蓝色水箭龟卡带。展示其原版贴纸与壳色。',
    },
    kind: 'display',
  },
  [CARTRIDGE_TYPE.Pinball]: {
    title: { en: 'Pokémon Pinball', zh: '宝可梦 弹珠台' },
    release: { en: 'North America · Jun 1999 (DMG-VPHE) — with rumble', zh: '北美 · 1999 年 6 月（DMG-VPHE）——内置震动' },
    blurb: {
      en: 'The rumble-equipped pinball spin-off with its distinctive dark shell. Displayed for its authentic label.',
      zh: '内置震动马达的弹珠台外传，深色卡带极具辨识度。展示其原版贴纸。',
    },
    kind: 'display',
  },
};

export { CARTRIDGE_INFO_CONFIG, EMULATOR_GAMES_CONFIG };
export type { CartridgeInfo, LocalizedText };
