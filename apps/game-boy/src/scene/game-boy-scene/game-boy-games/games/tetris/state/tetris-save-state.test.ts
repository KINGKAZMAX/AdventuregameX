import { describe, expect, test } from 'vitest';

function validState() {
  return {
    version: 1,
    screen: 'GAMEPLAY',
    gameplay: {
      board: Array.from({ length: 20 }, () => Array.from({ length: 10 }, () => null)),
      currentShape: {
        type: 'T',
        x: 4,
        y: 7,
        direction: 'RIGHT',
        distanceFallen: 4,
      },
      nextShape: 'I',
      shapeFallTime: 120,
      shapeFallInterval: 450,
      lines: 3,
      linesCurrentLevel: 3,
      score: 980,
      softDropScore: 2,
      level: 1,
      active: true,
      paused: false,
      gameOver: false,
      fastFallArmed: true,
      fastFalling: false,
      fallingDisabled: false,
    },
  };
}

describe('isTetrisSaveStateV1', () => {
  test('accepts a complete stable snapshot', async () => {
    const { isTetrisSaveStateV1 } = await import('./tetris-save-state');
    expect(isTetrisSaveStateV1(validState())).toBe(true);
  });

  test.each([
    ['wrong board height', () => validState().gameplay.board.pop()],
    ['wrong board width', () => validState().gameplay.board[0].pop()],
    ['unknown shape', () => { validState().gameplay.currentShape!.type = 'Q'; }],
    ['non-finite timer', () => { validState().gameplay.shapeFallTime = Number.NaN; }],
    ['negative score', () => { validState().gameplay.score = -1; }],
    ['unknown screen', () => { validState().screen = 'BONUS'; }],
  ])('rejects %s', async (_name, mutate) => {
    const { isTetrisSaveStateV1 } = await import('./tetris-save-state');
    const state = validState();
    if (_name === 'wrong board height') {
      state.gameplay.board.pop();
    } else if (_name === 'wrong board width') {
      state.gameplay.board[0].pop();
    } else if (_name === 'unknown shape') {
      state.gameplay.currentShape!.type = 'Q';
    } else if (_name === 'non-finite timer') {
      state.gameplay.shapeFallTime = Number.NaN;
    } else if (_name === 'negative score') {
      state.gameplay.score = -1;
    } else {
      state.screen = 'BONUS';
    }
    void mutate;
    expect(isTetrisSaveStateV1(state)).toBe(false);
  });
});
