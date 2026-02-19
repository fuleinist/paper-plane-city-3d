export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface HandControls {
  x: number; // -1 to 1 (left to right)
  y: number; // -1 to 1 (top to bottom)
  isFlying: boolean; // True if gesture detected
  isDetected: boolean; // True if hand is visible
}

export type GestureType = 'LOVE' | 'PLANE' | 'NONE';

export type GameStatus = 'MENU' | 'PLAYING' | 'GAME_OVER';

export interface GameState {
  status: GameStatus;
  score: number;
  highScore: number;
  speed: number;
}