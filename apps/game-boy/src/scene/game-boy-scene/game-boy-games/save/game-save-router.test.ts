import { describe, expect, it, vi } from 'vitest';
import { GAME_TYPE } from '../data/games-config';
import { BuiltinSaveStore } from './builtin-save-store';
import { routeLoadCurrentGameState, routeSaveCurrentGameState } from './game-save-router';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  public get length(): number {
    return this.values.size;
  }

  public clear(): void {
    this.values.clear();
  }

  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  public key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  public removeItem(key: string): void {
    this.values.delete(key);
  }

  public setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function createStore(storage: Storage, gameId: string, key: string): BuiltinSaveStore<any> {
  return new BuiltinSaveStore({
    storage,
    gameId,
    version: 1,
    key,
    isState: (value): value is any => typeof value === 'object' && value !== null,
  });
}

describe('GameBoyGames unified save routing', () => {
  it('delegates Emulator save and load to WasmBoy-backed methods', async () => {
    const saveState = vi.fn().mockResolvedValue({ status: 'saved' });
    const loadState = vi.fn().mockResolvedValue({ status: 'loaded' });
    const games = { [GAME_TYPE.Emulator]: { saveState, loadState } };

    await expect(routeSaveCurrentGameState(GAME_TYPE.Emulator, games, {}))
      .resolves.toEqual({ status: 'saved' });
    await expect(routeLoadCurrentGameState(GAME_TYPE.Emulator, games, {}))
      .resolves.toEqual({ status: 'loaded' });
    expect(saveState).toHaveBeenCalledOnce();
    expect(loadState).toHaveBeenCalledOnce();
  });

  it.each([
    [GAME_TYPE.Tetris, 'gamex:builtin-save:TETRIS:v1'],
    [GAME_TYPE.SpaceInvaders, 'gamex:builtin-save:SPACE_INVADERS:v1'],
  ])('saves %s under its exact versioned key', async (gameType, key) => {
    const storage = new MemoryStorage();
    const captureState = vi.fn(() => ({ version: 1, gameType }));
    const games = { [gameType]: { captureState, restoreState: vi.fn() } };
    const stores = { [gameType]: createStore(storage, gameType, key) };

    await expect(routeSaveCurrentGameState(gameType, games, stores))
      .resolves.toEqual({ status: 'saved' });
    expect(storage.getItem(key)).not.toBeNull();
    expect(captureState).toHaveBeenCalledOnce();
  });

  it('returns unavailable when no game is running', async () => {
    await expect(routeSaveCurrentGameState(null, {}, {})).resolves.toEqual({ status: 'unavailable' });
    await expect(routeLoadCurrentGameState(null, {}, {})).resolves.toEqual({ status: 'unavailable' });
  });

  it('returns missing when a built-in game has no save', async () => {
    const storage = new MemoryStorage();
    const restoreState = vi.fn();
    const games = { [GAME_TYPE.Tetris]: { restoreState, captureState: vi.fn() } };
    const stores = {
      [GAME_TYPE.Tetris]: createStore(storage, GAME_TYPE.Tetris, 'gamex:builtin-save:TETRIS:v1'),
    };

    await expect(routeLoadCurrentGameState(GAME_TYPE.Tetris, games, stores))
      .resolves.toEqual({ status: 'missing' });
    expect(restoreState).not.toHaveBeenCalled();
  });

  it('rejects a corrupt built-in snapshot without restoring it', async () => {
    const storage = new MemoryStorage();
    const key = 'gamex:builtin-save:SPACE_INVADERS:v1';
    storage.setItem(key, '{"gameId":"SPACE_INVADERS","version":1,"savedAt":"now","state":null}');
    const restoreState = vi.fn();
    const games = { [GAME_TYPE.SpaceInvaders]: { restoreState, captureState: vi.fn() } };
    const stores = {
      [GAME_TYPE.SpaceInvaders]: createStore(storage, GAME_TYPE.SpaceInvaders, key),
    };

    await expect(routeLoadCurrentGameState(GAME_TYPE.SpaceInvaders, games, stores))
      .resolves.toEqual({ status: 'invalid' });
    expect(restoreState).not.toHaveBeenCalled();
  });
});
