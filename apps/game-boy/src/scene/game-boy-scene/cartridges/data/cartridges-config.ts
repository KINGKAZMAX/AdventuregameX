import * as THREE from 'three';
import { GAME_TYPE } from '../../game-boy-games/data/games-config';

// Fifteen truthful open-homebrew cartridges arranged on one symmetric
// horseshoe, plus the two original GameX cartridges kept in Archive.
enum CARTRIDGE_TYPE {
  // Archive
  Tetris = 'TETRIS',
  SpaceInvaders = 'SPACE_INVADERS',
  // Main horseshoe, lower-left → top → lower-right
  Adjustris = 'ADJUSTRIS',
  BrekstasCat = 'BREKSTAS_CAT',
  Airplanz = 'AIRPLANZ',
  CrossConnect = 'CROSS_CONNECT',
  DysonsFear = 'DYSONS_FEAR',
  UnstoppableKnight = 'UNSTOPPABLE_KNIGHT',
  Wyrmhole = 'WYRMHOLE',
  TobuTobuGirl = 'TOBU_TOBU_GIRL',
  MicroCity = 'MICRO_CITY',
  Game2048 = 'GAME_2048',
  GbCorp = 'GB_CORP',
  Carazu = 'CARAZU',
  ShockLobster = 'SHOCK_LOBSTER',
  Geometrix = 'GEOMETRIX',
  GbWordyl = 'GB_WORDYL',
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
    // Preserve the approved shared circle (centre y=0.3, r=4.0), symmetric
    // depth bowl and all existing per-slot shell colours.
    [CARTRIDGE_TYPE.Adjustris]: {
      startPosition: new THREE.Vector3(-2.29, -2.98, -0.75),
      rotation: new THREE.Vector3(-3, 5, 4),
      amplitude: 0.03,
      speed: 0.34,
    },
    [CARTRIDGE_TYPE.BrekstasCat]: {
      startPosition: new THREE.Vector3(-3.31, -1.95, -0.686),
      rotation: new THREE.Vector3(-3, 7, 5),
      amplitude: 0.035,
      speed: 0.42,
    },
    [CARTRIDGE_TYPE.Airplanz]: {
      startPosition: new THREE.Vector3(-3.89, -0.64, -0.621),
      rotation: new THREE.Vector3(-3, 8, 6),
      amplitude: 0.035,
      speed: 0.48,
    },
    [CARTRIDGE_TYPE.CrossConnect]: {
      startPosition: new THREE.Vector3(-3.97, 0.80, -0.557),
      rotation: new THREE.Vector3(-3, 9, 6),
      amplitude: 0.04,
      speed: 0.38,
    },
    [CARTRIDGE_TYPE.DysonsFear]: {
      startPosition: new THREE.Vector3(-3.54, 2.17, -0.493),
      rotation: new THREE.Vector3(-3, 8, 5),
      amplitude: 0.04,
      speed: 0.44,
    },
    [CARTRIDGE_TYPE.UnstoppableKnight]: {
      startPosition: new THREE.Vector3(-2.65, 3.30, -0.429),
      rotation: new THREE.Vector3(-3, 6, 4),
      amplitude: 0.035,
      speed: 0.5,
    },
    [CARTRIDGE_TYPE.Wyrmhole]: {
      startPosition: new THREE.Vector3(-1.41, 4.04, -0.364),
      rotation: new THREE.Vector3(-3, 3, 2),
      amplitude: 0.04,
      speed: 0.36,
    },
    [CARTRIDGE_TYPE.TobuTobuGirl]: {
      startPosition: new THREE.Vector3(0, 4.30, -0.30),
      rotation: new THREE.Vector3(-3, 0, 0),
      amplitude: 0.04,
      speed: 0.32,
    },
    [CARTRIDGE_TYPE.MicroCity]: {
      startPosition: new THREE.Vector3(1.41, 4.04, -0.364),
      rotation: new THREE.Vector3(-3, -3, -2),
      amplitude: 0.04,
      speed: 0.36,
    },
    [CARTRIDGE_TYPE.Game2048]: {
      startPosition: new THREE.Vector3(2.65, 3.30, -0.429),
      rotation: new THREE.Vector3(-3, -6, -4),
      amplitude: 0.035,
      speed: 0.5,
    },
    [CARTRIDGE_TYPE.GbCorp]: {
      startPosition: new THREE.Vector3(3.54, 2.17, -0.493),
      rotation: new THREE.Vector3(-3, -8, -5),
      amplitude: 0.04,
      speed: 0.44,
    },
    [CARTRIDGE_TYPE.Carazu]: {
      startPosition: new THREE.Vector3(3.97, 0.80, -0.557),
      rotation: new THREE.Vector3(-3, -9, -6),
      amplitude: 0.04,
      speed: 0.38,
    },
    [CARTRIDGE_TYPE.ShockLobster]: {
      startPosition: new THREE.Vector3(3.89, -0.64, -0.621),
      rotation: new THREE.Vector3(-3, -8, -6),
      amplitude: 0.035,
      speed: 0.48,
    },
    [CARTRIDGE_TYPE.Geometrix]: {
      startPosition: new THREE.Vector3(3.31, -1.95, -0.686),
      rotation: new THREE.Vector3(-3, -7, -5),
      amplitude: 0.035,
      speed: 0.42,
    },
    [CARTRIDGE_TYPE.GbWordyl]: {
      startPosition: new THREE.Vector3(2.29, -2.98, -0.75),
      rotation: new THREE.Vector3(-3, -5, -4),
      amplitude: 0.03,
      speed: 0.34,
    },
    // Archive: the original cartridges stay parked above the visible stage
    // and remain insertable from the Control panel.
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
  [CARTRIDGE_TYPE.Adjustris]: {
    texture: 'baked-cartridge-adjustris',
    textureInPocket: 'baked-cartridge-adjustris-in-pocket',
    game: GAME_TYPE.Emulator,
  },
  [CARTRIDGE_TYPE.BrekstasCat]: {
    texture: 'baked-cartridge-brekstas-cat',
    textureInPocket: 'baked-cartridge-brekstas-cat-in-pocket',
    game: GAME_TYPE.Emulator,
  },
  [CARTRIDGE_TYPE.Airplanz]: {
    texture: 'baked-cartridge-airplanz',
    textureInPocket: 'baked-cartridge-airplanz-in-pocket',
    game: GAME_TYPE.Emulator,
  },
  [CARTRIDGE_TYPE.CrossConnect]: {
    texture: 'baked-cartridge-cross-connect',
    textureInPocket: 'baked-cartridge-cross-connect-in-pocket',
    game: GAME_TYPE.Emulator,
  },
  [CARTRIDGE_TYPE.DysonsFear]: {
    texture: 'baked-cartridge-dysons-fear',
    textureInPocket: 'baked-cartridge-dysons-fear-in-pocket',
    game: GAME_TYPE.Emulator,
  },
  [CARTRIDGE_TYPE.UnstoppableKnight]: {
    texture: 'baked-cartridge-unstoppable-knight',
    textureInPocket: 'baked-cartridge-unstoppable-knight-in-pocket',
    game: GAME_TYPE.Emulator,
  },
  [CARTRIDGE_TYPE.Wyrmhole]: {
    texture: 'baked-cartridge-wyrmhole',
    textureInPocket: 'baked-cartridge-wyrmhole-in-pocket',
    game: GAME_TYPE.Emulator,
  },
  [CARTRIDGE_TYPE.TobuTobuGirl]: {
    texture: 'baked-cartridge-tobu-tobu-girl',
    textureInPocket: 'baked-cartridge-tobu-tobu-girl-in-pocket',
    game: GAME_TYPE.Emulator,
  },
  [CARTRIDGE_TYPE.MicroCity]: {
    texture: 'baked-cartridge-micro-city',
    textureInPocket: 'baked-cartridge-micro-city-in-pocket',
    game: GAME_TYPE.Emulator,
  },
  [CARTRIDGE_TYPE.Game2048]: {
    texture: 'baked-cartridge-2048',
    textureInPocket: 'baked-cartridge-2048-in-pocket',
    game: GAME_TYPE.Emulator,
  },
  [CARTRIDGE_TYPE.GbCorp]: {
    texture: 'baked-cartridge-gb-corp',
    textureInPocket: 'baked-cartridge-gb-corp-in-pocket',
    game: GAME_TYPE.Emulator,
  },
  [CARTRIDGE_TYPE.Carazu]: {
    texture: 'baked-cartridge-carazu',
    textureInPocket: 'baked-cartridge-carazu-in-pocket',
    game: GAME_TYPE.Emulator,
  },
  [CARTRIDGE_TYPE.ShockLobster]: {
    texture: 'baked-cartridge-shock-lobster',
    textureInPocket: 'baked-cartridge-shock-lobster-in-pocket',
    game: GAME_TYPE.Emulator,
  },
  [CARTRIDGE_TYPE.Geometrix]: {
    texture: 'baked-cartridge-geometrix',
    textureInPocket: 'baked-cartridge-geometrix-in-pocket',
    game: GAME_TYPE.Emulator,
  },
  [CARTRIDGE_TYPE.GbWordyl]: {
    texture: 'baked-cartridge-gb-wordyl',
    textureInPocket: 'baked-cartridge-gb-wordyl-in-pocket',
    game: GAME_TYPE.Emulator,
  },
}

export {
  CARTRIDGES_CONFIG,
  CARTRIDGES_BY_TYPE_CONFIG,
  CARTRIDGE_TYPE,
};
