export enum WSMessageType {
  GAME_START = 'game_start',
  PLAYER_MOVE = 'player_move',
  GAME_END = 'game_end',
  ERROR = 'error',
}

export interface WSMessage {
  type: WSMessageType;
  sourceUuid?: string;
  targetUuid?: string;
  cell?: number;
  symbol?: 'X' | 'O';
  winner?: string | null;
  isDraw?: boolean;
  error?: string;
}