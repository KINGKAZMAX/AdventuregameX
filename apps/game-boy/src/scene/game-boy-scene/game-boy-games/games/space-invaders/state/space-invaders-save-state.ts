type SpaceInvadersScreenState = 'TITLE' | 'GAMEPLAY' | 'ROUND' | 'GAME_OVER';
type PlayerMovementState = 'LEFT' | 'RIGHT' | 'NONE';
type EnemyMovementDirection = 'LEFT' | 'RIGHT';
type SpaceInvadersEnemyType = 'Enemy01' | 'Enemy02';
type EnemyMissileType = 'ELECTRIC';

interface SpaceInvadersPlayerState {
  x: number;
  y: number;
  movement: PlayerMovementState;
  active: boolean;
}

interface SpaceInvadersEnemyState {
  type: SpaceInvadersEnemyType;
  x: number;
  y: number;
  textureIndex: number;
  speed: number;
  moveTime: number;
  moveInterval: number;
  direction: EnemyMovementDirection;
  shooting: boolean;
}

interface SpaceInvadersPlayerMissileState {
  x: number;
  y: number;
}

interface SpaceInvadersEnemyMissileState {
  x: number;
  y: number;
  type: EnemyMissileType;
  textureIndex: number;
}

interface SpaceInvadersGameplayState {
  active: boolean;
  paused: boolean;
  reloadTime: number;
  player: SpaceInvadersPlayerState;
  lives: number;
  score: number;
  enemies: (SpaceInvadersEnemyState | null)[][];
  enemyDirection: EnemyMovementDirection;
  previousEnemyDirection: EnemyMovementDirection;
  playerMissiles: SpaceInvadersPlayerMissileState[];
  enemyMissiles: SpaceInvadersEnemyMissileState[];
}

interface SpaceInvadersSaveStateV1 {
  version: 1;
  screen: SpaceInvadersScreenState;
  round: number;
  gameplay: SpaceInvadersGameplayState;
}

const screens = new Set<SpaceInvadersScreenState>(['TITLE', 'GAMEPLAY', 'ROUND', 'GAME_OVER']);
const playerMovements = new Set<PlayerMovementState>(['LEFT', 'RIGHT', 'NONE']);
const enemyDirections = new Set<EnemyMovementDirection>(['LEFT', 'RIGHT']);
const enemyTypes = new Set<SpaceInvadersEnemyType>(['Enemy01', 'Enemy02']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNonNegative(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return isNonNegative(value) && Number.isInteger(value);
}

function isPlayerState(value: unknown): value is SpaceInvadersPlayerState {
  return isRecord(value)
    && isFiniteNumber(value.x)
    && isFiniteNumber(value.y)
    && typeof value.movement === 'string'
    && playerMovements.has(value.movement as PlayerMovementState)
    && typeof value.active === 'boolean';
}

function isEnemyState(value: unknown): value is SpaceInvadersEnemyState {
  return isRecord(value)
    && typeof value.type === 'string'
    && enemyTypes.has(value.type as SpaceInvadersEnemyType)
    && isFiniteNumber(value.x)
    && isFiniteNumber(value.y)
    && isNonNegativeInteger(value.textureIndex)
    && isNonNegative(value.speed)
    && isNonNegative(value.moveTime)
    && isNonNegative(value.moveInterval)
    && typeof value.direction === 'string'
    && enemyDirections.has(value.direction as EnemyMovementDirection)
    && typeof value.shooting === 'boolean';
}

function isPlayerMissileState(value: unknown): value is SpaceInvadersPlayerMissileState {
  return isRecord(value) && isFiniteNumber(value.x) && isFiniteNumber(value.y);
}

function isEnemyMissileState(value: unknown): value is SpaceInvadersEnemyMissileState {
  return isRecord(value)
    && isFiniteNumber(value.x)
    && isFiniteNumber(value.y)
    && value.type === 'ELECTRIC'
    && isNonNegativeInteger(value.textureIndex);
}

function isGameplayState(value: unknown): value is SpaceInvadersGameplayState {
  if (!isRecord(value)
    || !Array.isArray(value.enemies)
    || value.enemies.length !== 5
    || !value.enemies.every((row) => Array.isArray(row)
      && row.length === 8
      && row.every((enemy) => enemy === null || isEnemyState(enemy)))) {
    return false;
  }

  return typeof value.active === 'boolean'
    && typeof value.paused === 'boolean'
    && isNonNegative(value.reloadTime)
    && isPlayerState(value.player)
    && isNonNegativeInteger(value.lives)
    && isNonNegativeInteger(value.score)
    && typeof value.enemyDirection === 'string'
    && enemyDirections.has(value.enemyDirection as EnemyMovementDirection)
    && typeof value.previousEnemyDirection === 'string'
    && enemyDirections.has(value.previousEnemyDirection as EnemyMovementDirection)
    && Array.isArray(value.playerMissiles)
    && value.playerMissiles.every(isPlayerMissileState)
    && Array.isArray(value.enemyMissiles)
    && value.enemyMissiles.every(isEnemyMissileState);
}

function isSpaceInvadersSaveStateV1(value: unknown): value is SpaceInvadersSaveStateV1 {
  return isRecord(value)
    && value.version === 1
    && typeof value.screen === 'string'
    && screens.has(value.screen as SpaceInvadersScreenState)
    && Number.isInteger(value.round)
    && (value.round as number) >= 1
    && isGameplayState(value.gameplay);
}

export { isSpaceInvadersSaveStateV1 };
export type {
  EnemyMovementDirection,
  EnemyMissileType,
  PlayerMovementState,
  SpaceInvadersEnemyMissileState,
  SpaceInvadersEnemyState,
  SpaceInvadersGameplayState,
  SpaceInvadersPlayerMissileState,
  SpaceInvadersPlayerState,
  SpaceInvadersSaveStateV1,
  SpaceInvadersScreenState,
};
