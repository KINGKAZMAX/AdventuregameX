import { describe, expect, it } from 'vitest';
import { isSpaceInvadersSaveStateV1, type SpaceInvadersSaveStateV1 } from './space-invaders-save-state';

function createValidState(): SpaceInvadersSaveStateV1 {
  return {
    version: 1,
    screen: 'GAMEPLAY',
    round: 3,
    gameplay: {
      active: true,
      paused: false,
      reloadTime: 180,
      player: {
        x: 72,
        y: 136,
        movement: 'NONE',
        active: true,
      },
      lives: 2,
      score: 120,
      enemies: Array.from({ length: 5 }, (_, row) => Array.from({ length: 8 }, (_, column) => ({
        type: 'Enemy01',
        x: 20 + column * 16,
        y: 32 + row * 8,
        textureIndex: 1,
        speed: 2,
        moveTime: 120,
        moveInterval: 250,
        direction: 'RIGHT',
        shooting: row === 4,
      }))),
      enemyDirection: 'RIGHT',
      previousEnemyDirection: 'RIGHT',
      playerMissiles: [{ x: 75, y: 80 }],
      enemyMissiles: [{ x: 40, y: 92, type: 'ELECTRIC', textureIndex: 2 }],
    },
  };
}

describe('isSpaceInvadersSaveStateV1', () => {
  it('accepts a complete gameplay snapshot', () => {
    expect(isSpaceInvadersSaveStateV1(createValidState())).toBe(true);
  });

  it('accepts an empty enemy slot after a kill', () => {
    const state = createValidState();
    state.gameplay.enemies[2][4] = null;
    expect(isSpaceInvadersSaveStateV1(state)).toBe(true);
  });

  it('rejects an unknown screen', () => {
    const state = createValidState() as unknown as Record<string, unknown>;
    state.screen = 'PAUSE';
    expect(isSpaceInvadersSaveStateV1(state)).toBe(false);
  });

  it('rejects a non-positive round', () => {
    const state = createValidState();
    state.round = 0;
    expect(isSpaceInvadersSaveStateV1(state)).toBe(false);
  });

  it('rejects a malformed enemy grid', () => {
    const state = createValidState();
    state.gameplay.enemies.pop();
    expect(isSpaceInvadersSaveStateV1(state)).toBe(false);
  });

  it('rejects an unknown movement state', () => {
    const state = createValidState();
    state.gameplay.player.movement = 'UP' as SpaceInvadersSaveStateV1['gameplay']['player']['movement'];
    expect(isSpaceInvadersSaveStateV1(state)).toBe(false);
  });

  it('rejects non-finite timers and coordinates', () => {
    const state = createValidState();
    state.gameplay.reloadTime = Number.NaN;
    expect(isSpaceInvadersSaveStateV1(state)).toBe(false);

    state.gameplay.reloadTime = 0;
    state.gameplay.enemyMissiles[0].y = Number.POSITIVE_INFINITY;
    expect(isSpaceInvadersSaveStateV1(state)).toBe(false);
  });

  it('rejects negative lives and scores', () => {
    const state = createValidState();
    state.gameplay.lives = -1;
    expect(isSpaceInvadersSaveStateV1(state)).toBe(false);

    state.gameplay.lives = 1;
    state.gameplay.score = -10;
    expect(isSpaceInvadersSaveStateV1(state)).toBe(false);
  });
});
