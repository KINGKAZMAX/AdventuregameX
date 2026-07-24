import { describe, expect, test } from 'vitest';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

type ExampleState = { score: number; label: string };

const isExampleState = (value: unknown): value is ExampleState => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const state = value as Partial<ExampleState>;
  return Number.isFinite(state.score) && typeof state.label === 'string';
};

async function createStore(storage: Storage = new MemoryStorage()) {
  const module = await import('./builtin-save-store');
  return {
    storage,
    store: new module.BuiltinSaveStore<ExampleState>({
      storage,
      gameId: 'TETRIS',
      version: 1,
      isState: isExampleState,
    }),
  };
}

describe('BuiltinSaveStore', () => {
  test('saves a versioned envelope under the exact game key', async () => {
    const { storage, store } = await createStore();

    expect(store.save({ score: 12, label: 'ready' })).toEqual({ status: 'saved' });

    const raw = storage.getItem('gamex:builtin-save:TETRIS:v1');
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toMatchObject({
      gameId: 'TETRIS',
      version: 1,
      state: { score: 12, label: 'ready' },
    });
  });

  test('loads a valid state', async () => {
    const { store } = await createStore();
    store.save({ score: 42, label: 'loaded' });

    expect(store.load()).toEqual({
      status: 'loaded',
      state: { score: 42, label: 'loaded' },
    });
  });

  test('returns missing when no snapshot exists', async () => {
    const { store } = await createStore();
    expect(store.load()).toEqual({ status: 'missing' });
  });

  test('returns invalid for damaged JSON', async () => {
    const { storage, store } = await createStore();
    storage.setItem('gamex:builtin-save:TETRIS:v1', '{broken');
    expect(store.load()).toEqual({ status: 'invalid' });
  });

  test.each([
    { gameId: 'SPACE_INVADERS', version: 1, savedAt: '2026-07-25T00:00:00.000Z', state: { score: 1, label: 'wrong game' } },
    { gameId: 'TETRIS', version: 2, savedAt: '2026-07-25T00:00:00.000Z', state: { score: 1, label: 'wrong version' } },
    { gameId: 'TETRIS', version: 1, savedAt: '2026-07-25T00:00:00.000Z', state: { score: 'bad', label: 'wrong state' } },
  ])('returns invalid for an incompatible envelope', async (envelope) => {
    const { storage, store } = await createStore();
    storage.setItem('gamex:builtin-save:TETRIS:v1', JSON.stringify(envelope));
    expect(store.load()).toEqual({ status: 'invalid' });
  });

  test('returns failed when browser storage throws', async () => {
    const storage = new MemoryStorage();
    storage.setItem = () => {
      throw new Error('quota exceeded');
    };
    const { store } = await createStore(storage);
    expect(store.save({ score: 7, label: 'blocked' })).toEqual({ status: 'failed' });
  });
});
