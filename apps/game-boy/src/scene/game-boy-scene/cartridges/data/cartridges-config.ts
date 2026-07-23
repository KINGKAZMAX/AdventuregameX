import * as THREE from 'three';
import { GAME_TYPE } from '../../game-boy-games/data/games-config';

// 15 official Pokemon releases arranged on ONE symmetric horseshoe arc in
// CHRONOLOGICAL order — oldest at the lower-left, sweeping up and over the top,
// newest at the lower-right — plus the two original cartridges kept in STORAGE
// (parked off-screen; insertable from the Control panel). The enum lists them
// in arc order (lower-left → top → lower-right).
enum CARTRIDGE_TYPE {
  // storage
  Tetris = 'TETRIS',
  SpaceInvaders = 'SPACE_INVADERS',
  // horseshoe arc, lower-left → top → lower-right (chronological)
  JpRed = 'JP_RED',            // 1996-02 JP  (lower-left, oldest)
  JpGreen = 'JP_GREEN',        // 1996-02 JP
  JpBlue = 'JP_BLUE',          // 1996-10 JP
  JpPikachu = 'JP_PIKACHU',    // 1998-09 JP
  UsRed = 'US_RED',            // 1998-09 US
  UsBlue = 'US_BLUE',          // 1998-09 US
  Pinball = 'PINBALL',         // 1999-06 US
  UsYellow = 'US_YELLOW',      // 1999-10 US  (top centre)
  JpGold = 'JP_GOLD',          // 1999-11 JP
  JpSilver = 'JP_SILVER',      // 1999-11 JP
  Tcg = 'TCG',                 // 2000-04 US
  UsGold = 'US_GOLD',          // 2000-10 US
  UsSilver = 'US_SILVER',      // 2000-10 US
  Puzzle = 'PUZZLE',           // 2000-12 US
  UsCrystal = 'US_CRYSTAL',    // 2001-07 US  (lower-right, newest)
}

const CARTRIDGES_CONFIG = {
  positions: {
    insert: {
      middle: new THREE.Vector3(-2.6, 3.6, 1.2),
      beforeInsert: new THREE.Vector3(0, 2.8, -0.28),
      slot: new THREE.Vector3(0, 1.03, -0.28),
    },
    eject: {
      beforeEject: new THREE.Vector3(0, 2.8, -0.28),
      middle: new THREE.Vector3(-2.2, 3.5, -0.3),
    }
  },
  floating: {
    // All 15 releases sit on ONE symmetric horseshoe around the Game Boy,
    // ordered chronologically from the lower-left (oldest) up and over the top
    // to the lower-right (newest). Even angular steps on a shared CIRCLE
    // (centre y=0.3, r=4.0) give uniform spacing so no cartridge overlaps its
    // neighbour and none hides behind the Game Boy. A symmetric depth "bowl"
    // (top nearest z=-0.30, ends furthest z=-0.75) makes any residual edge
    // overlap read as cleanly fanned tiles. Mirrored pairs (i, 14-i) share
    // |x|, y, z, amplitude and speed.
    [CARTRIDGE_TYPE.JpRed]: {
      startPosition: new THREE.Vector3(-2.29, -2.98, -0.75),
      rotation: new THREE.Vector3(-3, 5, 4),
      amplitude: 0.03,
      speed: 0.34,
    },
    [CARTRIDGE_TYPE.JpGreen]: {
      startPosition: new THREE.Vector3(-3.31, -1.95, -0.686),
      rotation: new THREE.Vector3(-3, 7, 5),
      amplitude: 0.035,
      speed: 0.42,
    },
    [CARTRIDGE_TYPE.JpBlue]: {
      startPosition: new THREE.Vector3(-3.89, -0.64, -0.621),
      rotation: new THREE.Vector3(-3, 8, 6),
      amplitude: 0.035,
      speed: 0.48,
    },
    [CARTRIDGE_TYPE.JpPikachu]: {
      startPosition: new THREE.Vector3(-3.97, 0.80, -0.557),
      rotation: new THREE.Vector3(-3, 9, 6),
      amplitude: 0.04,
      speed: 0.38,
    },
    [CARTRIDGE_TYPE.UsRed]: {
      startPosition: new THREE.Vector3(-3.54, 2.17, -0.493),
      rotation: new THREE.Vector3(-3, 8, 5),
      amplitude: 0.04,
      speed: 0.44,
    },
    [CARTRIDGE_TYPE.UsBlue]: {
      startPosition: new THREE.Vector3(-2.65, 3.30, -0.429),
      rotation: new THREE.Vector3(-3, 6, 4),
      amplitude: 0.035,
      speed: 0.5,
    },
    [CARTRIDGE_TYPE.Pinball]: {
      startPosition: new THREE.Vector3(-1.41, 4.04, -0.364),
      rotation: new THREE.Vector3(-3, 3, 2),
      amplitude: 0.04,
      speed: 0.36,
    },
    [CARTRIDGE_TYPE.UsYellow]: {
      startPosition: new THREE.Vector3(0, 4.30, -0.30),
      rotation: new THREE.Vector3(-3, 0, 0),
      amplitude: 0.04,
      speed: 0.32,
    },
    [CARTRIDGE_TYPE.JpGold]: {
      startPosition: new THREE.Vector3(1.41, 4.04, -0.364),
      rotation: new THREE.Vector3(-3, -3, -2),
      amplitude: 0.04,
      speed: 0.36,
    },
    [CARTRIDGE_TYPE.JpSilver]: {
      startPosition: new THREE.Vector3(2.65, 3.30, -0.429),
      rotation: new THREE.Vector3(-3, -6, -4),
      amplitude: 0.035,
      speed: 0.5,
    },
    [CARTRIDGE_TYPE.Tcg]: {
      startPosition: new THREE.Vector3(3.54, 2.17, -0.493),
      rotation: new THREE.Vector3(-3, -8, -5),
      amplitude: 0.04,
      speed: 0.44,
    },
    [CARTRIDGE_TYPE.UsGold]: {
      startPosition: new THREE.Vector3(3.97, 0.80, -0.557),
      rotation: new THREE.Vector3(-3, -9, -6),
      amplitude: 0.04,
      speed: 0.38,
    },
    [CARTRIDGE_TYPE.UsSilver]: {
      startPosition: new THREE.Vector3(3.89, -0.64, -0.621),
      rotation: new THREE.Vector3(-3, -8, -6),
      amplitude: 0.035,
      speed: 0.48,
    },
    [CARTRIDGE_TYPE.Puzzle]: {
      startPosition: new THREE.Vector3(3.31, -1.95, -0.686),
      rotation: new THREE.Vector3(-3, -7, -5),
      amplitude: 0.035,
      speed: 0.42,
    },
    [CARTRIDGE_TYPE.UsCrystal]: {
      startPosition: new THREE.Vector3(2.29, -2.98, -0.75),
      rotation: new THREE.Vector3(-3, -5, -4),
      amplitude: 0.03,
      speed: 0.34,
    },
    // Storage: the original cartridges are parked far above the visible
    // stage; inserting them from the Control panel flies them in.
    [CARTRIDGE_TYPE.Tetris]: {
      startPosition: new THREE.Vector3(-0.9, 7.5, -1.0),
      rotation: new THREE.Vector3(0, 0, 0),
      amplitude: 0.02,
      speed: 0.3,
    },
    [CARTRIDGE_TYPE.SpaceInvaders]: {
      startPosition: new THREE.Vector3(0.9, 7.5, -1.0),
      rotation: new THREE.Vector3(0, 0, 0),
      amplitude: 0.02,
      speed: 0.3,
    },
  }
}

const CARTRIDGES_BY_TYPE_CONFIG = {
  [CARTRIDGE_TYPE.Tetris]: {
    texture: 'baked-cartridge-tetris',
    textureInPocket: 'baked-cartridge-tetris-in-pocket',
    game: GAME_TYPE.Tetris,
  },
  [CARTRIDGE_TYPE.SpaceInvaders]: {
    texture: 'baked-cartridge-space-invaders',
    textureInPocket: 'baked-cartridge-space-invaders-in-pocket',
    game: GAME_TYPE.SpaceInvaders,
  },
  [CARTRIDGE_TYPE.JpRed]: {
    texture: 'baked-cartridge-jp-red',
    textureInPocket: 'baked-cartridge-jp-red-in-pocket',
    game: GAME_TYPE.PocketCreatures,
  },
  [CARTRIDGE_TYPE.JpGreen]: {
    texture: 'baked-cartridge-jp-green',
    textureInPocket: 'baked-cartridge-jp-green-in-pocket',
    game: GAME_TYPE.PocketCreatures,
  },
  [CARTRIDGE_TYPE.JpBlue]: {
    texture: 'baked-cartridge-jp-blue',
    textureInPocket: 'baked-cartridge-jp-blue-in-pocket',
    game: GAME_TYPE.PocketCreatures,
  },
  [CARTRIDGE_TYPE.JpPikachu]: {
    texture: 'baked-cartridge-jp-pikachu',
    textureInPocket: 'baked-cartridge-jp-pikachu-in-pocket',
    game: GAME_TYPE.PocketCreatures,
  },
  [CARTRIDGE_TYPE.UsRed]: {
    texture: 'baked-cartridge-us-red',
    textureInPocket: 'baked-cartridge-us-red-in-pocket',
    game: GAME_TYPE.PocketCreatures,
  },
  [CARTRIDGE_TYPE.UsBlue]: {
    texture: 'baked-cartridge-us-blue',
    textureInPocket: 'baked-cartridge-us-blue-in-pocket',
    game: GAME_TYPE.PocketCreatures,
  },
  [CARTRIDGE_TYPE.Pinball]: {
    texture: 'baked-cartridge-pinball',
    textureInPocket: 'baked-cartridge-pinball-in-pocket',
    game: GAME_TYPE.PocketCreatures,
  },
  [CARTRIDGE_TYPE.UsYellow]: {
    texture: 'baked-cartridge-us-yellow',
    textureInPocket: 'baked-cartridge-us-yellow-in-pocket',
    game: GAME_TYPE.Emulator,
  },
  [CARTRIDGE_TYPE.JpGold]: {
    texture: 'baked-cartridge-jp-gold',
    textureInPocket: 'baked-cartridge-jp-gold-in-pocket',
    game: GAME_TYPE.Emulator,
  },
  [CARTRIDGE_TYPE.JpSilver]: {
    texture: 'baked-cartridge-jp-silver',
    textureInPocket: 'baked-cartridge-jp-silver-in-pocket',
    game: GAME_TYPE.Emulator,
  },
  [CARTRIDGE_TYPE.Tcg]: {
    texture: 'baked-cartridge-tcg',
    textureInPocket: 'baked-cartridge-tcg-in-pocket',
    game: GAME_TYPE.Emulator,
  },
  [CARTRIDGE_TYPE.UsGold]: {
    texture: 'baked-cartridge-us-gold',
    textureInPocket: 'baked-cartridge-us-gold-in-pocket',
    game: GAME_TYPE.Emulator,
  },
  [CARTRIDGE_TYPE.UsSilver]: {
    texture: 'baked-cartridge-us-silver',
    textureInPocket: 'baked-cartridge-us-silver-in-pocket',
    game: GAME_TYPE.Emulator,
  },
  [CARTRIDGE_TYPE.Puzzle]: {
    texture: 'baked-cartridge-puzzle',
    textureInPocket: 'baked-cartridge-puzzle-in-pocket',
    game: GAME_TYPE.Emulator,
  },
  [CARTRIDGE_TYPE.UsCrystal]: {
    texture: 'baked-cartridge-us-crystal',
    textureInPocket: 'baked-cartridge-us-crystal-in-pocket',
    game: GAME_TYPE.Emulator,
  },
}

export {
  CARTRIDGES_CONFIG,
  CARTRIDGES_BY_TYPE_CONFIG,
  CARTRIDGE_TYPE,
};
