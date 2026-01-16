export interface GameStats {
  motivation: number; // Student motivation (Health of the 'enemy'/audience)
  authority: number;  // Teacher's authority (Health of the player)
  energy: number;     // Teacher's energy (Mana)
}

export interface GameResponse {
  narrative: string;
  stats: GameStats;
  choices: string[];
  gameOver: boolean;
  victory: boolean;
  reason?: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}