type TetrisScreenState = 'LICENSE' | 'TITLE' | 'GAMEPLAY';
type TetrisShapeType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z' | 'INVISIBLE';
type TetrisShapeDirection = 'UP' | 'RIGHT' | 'DOWN' | 'LEFT';

interface TetrisBlockState {
  texture: string;
  tint: number;
  rotation: number;
}

interface TetrisShapeState {
  type: TetrisShapeType;
  x: number;
  y: number;
  direction: TetrisShapeDirection;
  distanceFallen: number;
}

interface TetrisGameplayState {
  board: (TetrisBlockState | null)[][];
  currentShape: TetrisShapeState | null;
  nextShape: TetrisShapeType | null;
  shapeFallTime: number;
  shapeFallInterval: number;
  lines: number;
  linesCurrentLevel: number;
  score: number;
  softDropScore: number;
  level: number;
  active: boolean;
  paused: boolean;
  gameOver: boolean;
  fastFallArmed: boolean;
  fastFalling: boolean;
  fallingDisabled: boolean;
}

interface TetrisSaveStateV1 {
  version: 1;
  screen: TetrisScreenState;
  gameplay: TetrisGameplayState;
}

const shapeTypes = new Set<TetrisShapeType>(['I', 'J', 'L', 'O', 'S', 'T', 'Z', 'INVISIBLE']);
const shapeDirections = new Set<TetrisShapeDirection>(['UP', 'RIGHT', 'DOWN', 'LEFT']);
const screens = new Set<TetrisScreenState>(['LICENSE', 'TITLE', 'GAMEPLAY']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isTetrisBlockState(value: unknown): value is TetrisBlockState {
  if (!isRecord(value)) {
    return false;
  }
  return typeof value.texture === 'string'
    && value.texture.length > 0
    && typeof value.tint === 'number'
    && Number.isInteger(value.tint)
    && value.tint >= 0
    && Number.isFinite(value.rotation);
}

function isTetrisShapeState(value: unknown): value is TetrisShapeState {
  if (!isRecord(value)) {
    return false;
  }
  return typeof value.type === 'string'
    && shapeTypes.has(value.type as TetrisShapeType)
    && Number.isInteger(value.x)
    && Number.isInteger(value.y)
    && typeof value.direction === 'string'
    && shapeDirections.has(value.direction as TetrisShapeDirection)
    && isFiniteNonNegative(value.distanceFallen);
}

function isTetrisGameplayState(value: unknown): value is TetrisGameplayState {
  if (!isRecord(value) || !Array.isArray(value.board) || value.board.length !== 20) {
    return false;
  }
  if (!value.board.every((row) => Array.isArray(row)
    && row.length === 10
    && row.every((block) => block === null || isTetrisBlockState(block)))) {
    return false;
  }

  const nextShapeIsValid = value.nextShape === null
    || (typeof value.nextShape === 'string' && shapeTypes.has(value.nextShape as TetrisShapeType));

  return (value.currentShape === null || isTetrisShapeState(value.currentShape))
    && nextShapeIsValid
    && isFiniteNonNegative(value.shapeFallTime)
    && isFiniteNonNegative(value.shapeFallInterval)
    && isFiniteNonNegative(value.lines)
    && isFiniteNonNegative(value.linesCurrentLevel)
    && isFiniteNonNegative(value.score)
    && isFiniteNonNegative(value.softDropScore)
    && isFiniteNonNegative(value.level)
    && typeof value.active === 'boolean'
    && typeof value.paused === 'boolean'
    && typeof value.gameOver === 'boolean'
    && typeof value.fastFallArmed === 'boolean'
    && typeof value.fastFalling === 'boolean'
    && typeof value.fallingDisabled === 'boolean';
}

function isTetrisSaveStateV1(value: unknown): value is TetrisSaveStateV1 {
  if (!isRecord(value)) {
    return false;
  }
  return value.version === 1
    && typeof value.screen === 'string'
    && screens.has(value.screen as TetrisScreenState)
    && isTetrisGameplayState(value.gameplay);
}

export { isTetrisSaveStateV1 };
export type {
  TetrisBlockState,
  TetrisGameplayState,
  TetrisSaveStateV1,
  TetrisScreenState,
  TetrisShapeDirection,
  TetrisShapeState,
  TetrisShapeType,
};
