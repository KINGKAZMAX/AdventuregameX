// Real, playable and redistributable homebrew ROMs bundled with GameX.
// Order and identity mirror tools/homebrew-cartridges.json.

import { CARTRIDGE_TYPE } from '../../../cartridges/data/cartridges-config';

interface EmulatorGameConfig {
  title: string;
  romFile: string;
  author: string;
  license: string;
  sourceUrl: string;
}

const EMULATOR_GAMES_CONFIG: { [cartridgeType: string]: EmulatorGameConfig } = {
  [CARTRIDGE_TYPE.Adjustris]: {
    title: 'ADJUSTRIS',
    romFile: 'adjustris.gb',
    author: 'Dave VanEe',
    license: 'CC0-1.0',
    sourceUrl: 'https://github.com/tbsp/Adjustris/tree/v1.1',
  },
  [CARTRIDGE_TYPE.BrekstasCat]: {
    title: 'BREKSTA\'S CAT',
    romFile: 'brekstascat.gb',
    author: 'NotImplementedLife',
    license: 'GPL-3.0',
    sourceUrl: 'https://github.com/NotImplementedLife/brekstascat/tree/1.3',
  },
  [CARTRIDGE_TYPE.Airplanz]: {
    title: 'AIRPLANZ',
    romFile: 'airplanz.gb',
    author: 'NotImplementedLife',
    license: 'GPL-3.0',
    sourceUrl: 'https://github.com/NotImplementedLife/AIRPLANZ/tree/1.2',
  },
  [CARTRIDGE_TYPE.CrossConnect]: {
    title: 'CROSS CONNECT',
    romFile: 'cross-connect.gbc',
    author: 'Quinn Painter',
    license: 'MIT',
    sourceUrl: 'https://github.com/QuinnPainter/CrossConnect/tree/1.0',
  },
  [CARTRIDGE_TYPE.DysonsFear]: {
    title: 'DYSON\'S FEAR',
    romFile: 'dysons-fear.gb',
    author: 'Zeta0134',
    license: 'GPL-3.0',
    sourceUrl: 'https://github.com/zeta0134/ludum-dare-42/tree/v2.0',
  },
  [CARTRIDGE_TYPE.UnstoppableKnight]: {
    title: 'UNSTOPPABLE KNIGHT',
    romFile: 'unstoppable-knight.gb',
    author: 'Rafael Garcia',
    license: 'MIT',
    sourceUrl: 'https://github.com/Rafagars/Unstoppable-Knight-GB/tree/2.2.2',
  },
  [CARTRIDGE_TYPE.Wyrmhole]: {
    title: 'WYRMHOLE',
    romFile: 'wyrmhole.gb',
    author: 'Quinn Painter',
    license: 'MIT',
    sourceUrl: 'https://github.com/QuinnPainter/Wyrmhole/tree/1.1',
  },
  [CARTRIDGE_TYPE.TobuTobuGirl]: {
    title: 'TOBU TOBU GIRL',
    romFile: 'tobutobugirl.gb',
    author: 'Tangram Games',
    license: 'MIT + CC BY 4.0',
    sourceUrl: 'https://github.com/SimonLarsen/tobutobugirl/tree/048a22c2d7ebbe25811322e8692803fa86bb643a',
  },
  [CARTRIDGE_TYPE.MicroCity]: {
    title: 'MICRO CITY',
    romFile: 'ucity.gbc',
    author: 'AntonioND',
    license: 'GPL-3.0-or-later',
    sourceUrl: 'https://github.com/AntonioND/ucity/tree/v1.3',
  },
  [CARTRIDGE_TYPE.Game2048]: {
    title: '2048',
    romFile: '2048.gb',
    author: 'Sanqui',
    license: 'Zlib',
    sourceUrl: 'https://github.com/Sanqui/2048-gb/tree/e44f94f898c1e0de7caa1160c82c0da36ff5eb05',
  },
  [CARTRIDGE_TYPE.GbCorp]: {
    title: 'GB CORP.',
    romFile: 'gbcorp.gb',
    author: 'Dr. Ludos',
    license: 'MIT',
    sourceUrl: 'https://github.com/drludos/GBcorp/tree/1.0',
  },
  [CARTRIDGE_TYPE.Carazu]: {
    title: 'CARAZU',
    romFile: 'carazu.gb',
    author: 'Matt Holtkamp',
    license: 'GPL-3.0',
    sourceUrl: 'https://github.com/mholtkamp/carazu/tree/70ff274ef0de949424ebc1935d3d8bcac4685140',
  },
  [CARTRIDGE_TYPE.ShockLobster]: {
    title: 'SHOCK LOBSTER',
    romFile: 'shock-lobster.gb',
    author: 'Dave VanEe',
    license: 'Zlib',
    sourceUrl: 'https://github.com/tbsp/shock-lobster/tree/3',
  },
  [CARTRIDGE_TYPE.Geometrix]: {
    title: 'GEOMETRIX',
    romFile: 'geometrix.gbc',
    author: 'AntonioND',
    license: 'GPL-3.0-or-later',
    sourceUrl: 'https://github.com/AntonioND/geometrix/tree/v1.0.1',
  },
  [CARTRIDGE_TYPE.GbWordyl]: {
    title: 'GB WORDYL',
    romFile: 'gb-wordyl.gb',
    author: 'bbbbbr',
    license: 'GPL-3.0',
    sourceUrl: 'https://github.com/bbbbbr/gb-wordyl/tree/v0.85',
  },
};

export { EMULATOR_GAMES_CONFIG };
export type { EmulatorGameConfig };
