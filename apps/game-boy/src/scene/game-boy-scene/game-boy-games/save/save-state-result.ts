type SaveStateResult =
  | { status: 'saved' }
  | { status: 'failed' }
  | { status: 'unavailable' };

type LoadStateResult<T = never> =
  | { status: 'loaded'; state?: T }
  | { status: 'missing' }
  | { status: 'invalid' }
  | { status: 'failed' }
  | { status: 'unavailable' };

export type { LoadStateResult, SaveStateResult };
