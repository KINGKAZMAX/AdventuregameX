// Real, playable homebrew Game Boy ROMs bundled with GameX.
// Every entry is an open-licensed homebrew game whose license permits
// redistribution; see public/roms/ATTRIBUTION.md for full credits.
// Keyed by CARTRIDGE_TYPE value.

import { CARTRIDGE_TYPE } from '../../../cartridges/data/cartridges-config';

interface EmulatorGameConfig {
  title: string;
  romFile: string;
  author: string;
  license: string;
  sourceUrl: string;
}

const EMULATOR_GAMES_CONFIG: { [cartridgeType: string]: EmulatorGameConfig } = {
  [CARTRIDGE_TYPE.UsYellow]: {
    title: 'TOBU TOBU GIRL',
    romFile: 'tobutobugirl.gb',
    author: 'Tangram Games',
    license: 'MIT + CC BY 4.0',
    sourceUrl: 'https://github.com/SimonLarsen/tobutobugirl',
  },
  [CARTRIDGE_TYPE.JpGold]: {
    title: 'MICRO CITY',
    romFile: 'ucity.gbc',
    author: 'AntonioND',
    license: 'GPL-3.0-or-later',
    sourceUrl: 'https://github.com/AntonioND/ucity',
  },
  [CARTRIDGE_TYPE.JpSilver]: {
    title: '2048',
    romFile: '2048.gb',
    author: 'Sanqui',
    license: 'Zlib',
    sourceUrl: 'https://github.com/Sanqui/2048-gb',
  },
  [CARTRIDGE_TYPE.UsCrystal]: {
    title: 'GB WORDYL',
    romFile: 'gb-wordyl.gb',
    author: 'bbbbbr',
    license: 'GPL-3.0',
    sourceUrl: 'https://github.com/bbbbbr/gb-wordyl',
  },
  [CARTRIDGE_TYPE.UsGold]: {
    title: 'CARAZU',
    romFile: 'carazu.gb',
    author: 'mholtkamp',
    license: 'GPL-3.0',
    sourceUrl: 'https://github.com/mholtkamp/carazu',
  },
  [CARTRIDGE_TYPE.Puzzle]: {
    title: 'GEOMETRIX',
    romFile: 'geometrix.gbc',
    author: 'AntonioND',
    license: 'GPL-3.0-or-later',
    sourceUrl: 'https://github.com/AntonioND/geometrix',
  },
  [CARTRIDGE_TYPE.Tcg]: {
    title: 'GB CORP.',
    romFile: 'gbcorp.gb',
    author: 'Dr. Ludos',
    license: 'MIT',
    sourceUrl: 'https://github.com/drludos/GBcorp',
  },
  [CARTRIDGE_TYPE.UsSilver]: {
    title: 'SHOCK LOBSTER',
    romFile: 'shock-lobster.gb',
    author: 'Dave VanEe',
    license: 'Zlib',
    sourceUrl: 'https://github.com/tbsp/shock-lobster',
  },
};

export { EMULATOR_GAMES_CONFIG };
export type { EmulatorGameConfig };
