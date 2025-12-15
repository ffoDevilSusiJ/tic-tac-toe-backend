export type PlayerSymbol = 'X' | 'O';

export interface GameState {
  id: string;
  board: (PlayerSymbol | null)[];
  currentPlayer: PlayerSymbol;
  players: {
    [uuid: string]: {
      symbol: PlayerSymbol;
      connected: boolean;
    };
  };
  winner: PlayerSymbol | null;
  isDraw: boolean;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  score: {
    [uuid: string]: number;
  };
  roundNumber: number;
}

export interface Player {
  uuid: string;
  symbol: PlayerSymbol;
  socketId: string;
}