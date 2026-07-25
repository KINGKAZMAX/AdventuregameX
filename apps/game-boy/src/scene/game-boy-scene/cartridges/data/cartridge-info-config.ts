import { CARTRIDGE_TYPE } from './cartridges-config';
import { EMULATOR_GAMES_CONFIG } from '../../game-boy-games/games/emulator/emulator-games-config';

type LocalizedText = { en: string; zh: string };

interface CartridgeInfo {
  title: LocalizedText;
  release: LocalizedText;
  blurb: LocalizedText;
  kind: 'emulator' | 'builtin';
}

const CARTRIDGE_INFO_CONFIG: { [key in CARTRIDGE_TYPE]?: CartridgeInfo } = {
  [CARTRIDGE_TYPE.Adjustris]: {
    title: { en: 'Adjustris', zh: 'Adjustris' },
    release: { en: 'Open homebrew · v1.1 · 2017', zh: '开源自制游戏 · v1.1 · 2017' },
    blurb: { en: 'Shift entire rows to fit falling pieces in a clever block puzzle.', zh: '移动整行来拼合落下的方块，是一款巧妙的落块益智游戏。' },
    kind: 'emulator',
  },
  [CARTRIDGE_TYPE.BrekstasCat]: {
    title: { en: 'Breksta\'s Cat', zh: 'Breksta\'s Cat' },
    release: { en: 'Open homebrew · 1.3 · 2021', zh: '开源自制游戏 · 1.3 · 2021' },
    blurb: { en: 'Guide a determined cat through compact puzzle-platform stages.', zh: '带领一只坚定的小猫闯过紧凑的解谜平台关卡。' },
    kind: 'emulator',
  },
  [CARTRIDGE_TYPE.Airplanz]: {
    title: { en: 'AIRPLANZ', zh: 'AIRPLANZ' },
    release: { en: 'Open homebrew · 1.2 · 2021', zh: '开源自制游戏 · 1.2 · 2021' },
    blurb: { en: 'Pilot a tiny aircraft through a fast monochrome arcade challenge.', zh: '驾驶小型飞机，完成快速的黑白街机挑战。' },
    kind: 'emulator',
  },
  [CARTRIDGE_TYPE.CrossConnect]: {
    title: { en: 'CrossConnect', zh: 'CrossConnect' },
    release: { en: 'Open homebrew · 1.0 · 2022', zh: '开源自制游戏 · 1.0 · 2022' },
    blurb: { en: 'Reconnect a colourful network by rotating and matching its paths.', zh: '旋转并匹配线路，重新接通彩色网络。' },
    kind: 'emulator',
  },
  [CARTRIDGE_TYPE.DysonsFear]: {
    title: { en: 'Dyson\'s Fear', zh: 'Dyson\'s Fear' },
    release: { en: 'Open homebrew · v2.0 · 2019', zh: '开源自制游戏 · v2.0 · 2019' },
    blurb: { en: 'Survive a tightening field in this tense compact action game.', zh: '在不断收紧的场地中求生，体验紧张的动作挑战。' },
    kind: 'emulator',
  },
  [CARTRIDGE_TYPE.UnstoppableKnight]: {
    title: { en: 'Unstoppable Knight', zh: 'Unstoppable Knight' },
    release: { en: 'Open homebrew · 2.2.2 · 2021', zh: '开源自制游戏 · 2.2.2 · 2021' },
    blurb: { en: 'Run, jump and battle through a complete pocket-sized adventure.', zh: '奔跑、跳跃并战斗，完成一场掌上冒险。' },
    kind: 'emulator',
  },
  [CARTRIDGE_TYPE.Wyrmhole]: {
    title: { en: 'Wyrmhole', zh: 'Wyrmhole' },
    release: { en: 'Open homebrew · 1.1 · 2022', zh: '开源自制游戏 · 1.1 · 2022' },
    blurb: { en: 'Dive through a twisting arcade wormhole and chase a high score.', zh: '穿越扭曲的街机虫洞，挑战更高分数。' },
    kind: 'emulator',
  },
  [CARTRIDGE_TYPE.TobuTobuGirl]: {
    title: { en: 'Tobu Tobu Girl', zh: 'Tobu Tobu Girl（飞天少女）' },
    release: { en: 'Open homebrew · 2017 release', zh: '开源自制游戏 · 2017 发行版' },
    blurb: { en: 'Bounce ever higher off enemies to rescue your falling friend.', zh: '踩着敌人不断向上弹跳，救回坠落的伙伴。' },
    kind: 'emulator',
  },
  [CARTRIDGE_TYPE.MicroCity]: {
    title: { en: 'Micro City', zh: 'Micro City（微城市）' },
    release: { en: 'Open homebrew · v1.3 · 2025', zh: '开源自制游戏 · v1.3 · 2025' },
    blurb: { en: 'Zone, budget and grow a complete city on Game Boy Color.', zh: '规划分区、管理预算，在 Game Boy Color 上经营城市。' },
    kind: 'emulator',
  },
  [CARTRIDGE_TYPE.Game2048]: {
    title: { en: '2048', zh: '2048' },
    release: { en: 'Open homebrew · e44f94f · 2015', zh: '开源自制游戏 · e44f94f · 2015' },
    blurb: { en: 'Slide and merge numbered tiles until they reach 2048.', zh: '滑动并合并数字方块，直到合成 2048。' },
    kind: 'emulator',
  },
  [CARTRIDGE_TYPE.GbCorp]: {
    title: { en: 'GB Corp.', zh: 'GB Corp.（游戏公司）' },
    release: { en: 'Open homebrew · 1.0 · 2021', zh: '开源自制游戏 · 1.0 · 2021' },
    blurb: { en: 'Manage a tiny game studio and balance its quirky departments.', zh: '经营一家小型游戏工作室，平衡各个部门。' },
    kind: 'emulator',
  },
  [CARTRIDGE_TYPE.Carazu]: {
    title: { en: 'Carazu', zh: 'Carazu' },
    release: { en: 'Open homebrew · v1.0 · 2016', zh: '开源自制游戏 · v1.0 · 2016' },
    blurb: { en: 'Explore a hand-built side-scrolling action adventure.', zh: '探索手工打造的横版动作冒险世界。' },
    kind: 'emulator',
  },
  [CARTRIDGE_TYPE.ShockLobster]: {
    title: { en: 'Shock Lobster', zh: 'Shock Lobster' },
    release: { en: 'Open homebrew · 3 · 2022', zh: '开源自制游戏 · 3 · 2022' },
    blurb: { en: 'Charge your shock and blast through waves of deep-sea foes.', zh: '蓄力放电，冲破一波波深海敌人。' },
    kind: 'emulator',
  },
  [CARTRIDGE_TYPE.Geometrix]: {
    title: { en: 'Geometrix', zh: 'Geometrix' },
    release: { en: 'Open homebrew · v1.0.1 · 2018', zh: '开源自制游戏 · v1.0.1 · 2018' },
    blurb: { en: 'Clear a colourful field before geometric pieces stack too high.', zh: '在几何方块堆到顶端前清理彩色棋盘。' },
    kind: 'emulator',
  },
  [CARTRIDGE_TYPE.GbWordyl]: {
    title: { en: 'GB Wordyl', zh: 'GB Wordyl（猜词）' },
    release: { en: 'Open homebrew · v0.85 · 2022', zh: '开源自制游戏 · v0.85 · 2022' },
    blurb: { en: 'Guess a hidden five-letter word in six tries.', zh: '用六次机会猜出隐藏的五字母单词。' },
    kind: 'emulator',
  },
  [CARTRIDGE_TYPE.Tetris]: {
    title: { en: 'Tetris', zh: '俄罗斯方块' },
    release: { en: 'Archive · GameX built-in', zh: 'Archive 收纳 · GameX 原生游戏' },
    blurb: { en: 'The original native falling-block game, preserved in Archive.', zh: '原有的原生落块游戏，完整保留在 Archive 收纳区。' },
    kind: 'builtin',
  },
  [CARTRIDGE_TYPE.SpaceInvaders]: {
    title: { en: 'Space Invaders', zh: '太空侵略者' },
    release: { en: 'Archive · GameX built-in', zh: 'Archive 收纳 · GameX 原生游戏' },
    blurb: { en: 'The original native arcade shooter, preserved in Archive.', zh: '原有的原生街机射击游戏，完整保留在 Archive 收纳区。' },
    kind: 'builtin',
  },
};

export { CARTRIDGE_INFO_CONFIG, EMULATOR_GAMES_CONFIG };
export type { CartridgeInfo, LocalizedText };
