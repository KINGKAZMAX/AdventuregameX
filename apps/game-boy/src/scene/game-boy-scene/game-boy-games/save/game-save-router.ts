import { GAME_TYPE } from '../data/games-config';
import type { BuiltinSaveStore } from './builtin-save-store';
import type { LoadStateResult, SaveStateResult } from './save-state-result';

interface EmulatorSaveAdapter {
  saveState: () => Promise<SaveStateResult>;
  loadState: () => Promise<LoadStateResult>;
}

interface BuiltinSaveAdapter<State = unknown> {
  captureState: () => State;
  restoreState: (state: State) => boolean;
}

type GameSaveAdapter = EmulatorSaveAdapter | BuiltinSaveAdapter;
type GameSaveAdapters = Partial<Record<GAME_TYPE, GameSaveAdapter>>;
type BuiltinSaveStores = Partial<Record<GAME_TYPE, BuiltinSaveStore<any>>>;

async function routeSaveCurrentGameState(
  gameType: GAME_TYPE | null,
  games: GameSaveAdapters,
  stores: BuiltinSaveStores,
): Promise<SaveStateResult> {
  if (gameType === null) {
    return { status: 'unavailable' };
  }

  try {
    if (gameType === GAME_TYPE.Emulator) {
      const game = games[gameType] as EmulatorSaveAdapter | undefined;
      return game ? game.saveState() : { status: 'unavailable' };
    }

    const game = games[gameType] as BuiltinSaveAdapter | undefined;
    const store = stores[gameType];
    if (!game || !store) {
      return { status: 'unavailable' };
    }
    return store.save(game.captureState());
  } catch {
    return { status: 'failed' };
  }
}

async function routeLoadCurrentGameState(
  gameType: GAME_TYPE | null,
  games: GameSaveAdapters,
  stores: BuiltinSaveStores,
): Promise<LoadStateResult> {
  if (gameType === null) {
    return { status: 'unavailable' };
  }

  try {
    if (gameType === GAME_TYPE.Emulator) {
      const game = games[gameType] as EmulatorSaveAdapter | undefined;
      return game ? game.loadState() : { status: 'unavailable' };
    }

    const game = games[gameType] as BuiltinSaveAdapter | undefined;
    const store = stores[gameType];
    if (!game || !store) {
      return { status: 'unavailable' };
    }

    const result = store.load();
    if (result.status !== 'loaded') {
      return result;
    }
    return game.restoreState(result.state) ? { status: 'loaded' } : { status: 'failed' };
  } catch {
    return { status: 'failed' };
  }
}

export { routeLoadCurrentGameState, routeSaveCurrentGameState };
export type { BuiltinSaveAdapter, BuiltinSaveStores, EmulatorSaveAdapter, GameSaveAdapters };
