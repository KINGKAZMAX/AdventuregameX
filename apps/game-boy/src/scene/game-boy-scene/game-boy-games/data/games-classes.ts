import SpaceInvaders from "../games/space-invaders/space-invaders";
import Tetris from "../games/tetris/tetris";
import EmulatorGame from "../games/emulator/emulator-game";
import PocketCreatures from "../games/pocket-creatures/pocket-creatures";
import { GAME_TYPE } from "./games-config";

const GAMES_CLASSES = {
  [GAME_TYPE.Tetris]: Tetris,
  [GAME_TYPE.SpaceInvaders]: SpaceInvaders,
  [GAME_TYPE.Emulator]: EmulatorGame,
  [GAME_TYPE.PocketCreatures]: PocketCreatures,
}

export { GAMES_CLASSES };
