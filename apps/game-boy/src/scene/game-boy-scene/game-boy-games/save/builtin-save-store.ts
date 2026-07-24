type BuiltinSaveResult = { status: 'saved' } | { status: 'failed' };

type BuiltinLoadResult<State> =
  | { status: 'loaded'; state: State }
  | { status: 'missing' }
  | { status: 'invalid' }
  | { status: 'failed' };

interface BuiltinSaveStoreOptions<State> {
  storage: Storage;
  gameId: string;
  version: number;
  key?: string;
  isState: (value: unknown) => value is State;
}

interface SaveEnvelope<State> {
  gameId: string;
  version: number;
  savedAt: string;
  state: State;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export class BuiltinSaveStore<State> {
  public readonly key: string;

  private readonly storage: Storage;
  private readonly gameId: string;
  private readonly version: number;
  private readonly isState: (value: unknown) => value is State;

  constructor(options: BuiltinSaveStoreOptions<State>) {
    this.storage = options.storage;
    this.gameId = options.gameId;
    this.version = options.version;
    this.isState = options.isState;
    this.key = options.key ?? `gamex:builtin-save:${this.gameId}:v${this.version}`;
  }

  public save(state: State): BuiltinSaveResult {
    const envelope: SaveEnvelope<State> = {
      gameId: this.gameId,
      version: this.version,
      savedAt: new Date().toISOString(),
      state,
    };

    try {
      this.storage.setItem(this.key, JSON.stringify(envelope));
      return { status: 'saved' };
    } catch {
      return { status: 'failed' };
    }
  }

  public load(): BuiltinLoadResult<State> {
    let raw: string | null;
    try {
      raw = this.storage.getItem(this.key);
    } catch {
      return { status: 'failed' };
    }

    if (raw === null) {
      return { status: 'missing' };
    }

    try {
      const envelope: unknown = JSON.parse(raw);
      if (!isRecord(envelope)
        || envelope.gameId !== this.gameId
        || envelope.version !== this.version
        || typeof envelope.savedAt !== 'string'
        || !this.isState(envelope.state)) {
        return { status: 'invalid' };
      }
      return { status: 'loaded', state: envelope.state };
    } catch {
      return { status: 'invalid' };
    }
  }
}

export type { BuiltinLoadResult, BuiltinSaveResult, BuiltinSaveStoreOptions };
