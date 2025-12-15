import { PlayerSymbol, GameState } from '../../common/types/game.types';

export class Game implements GameState {
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

  constructor(gameId: string, creatorUuid: string) {
    this.id = gameId;
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.players = {
      [creatorUuid]: {
        symbol: 'X',
        connected: true,
      },
    };
    this.winner = null;
    this.isDraw = false;
    this.isActive = false;
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
    this.score = {
      [creatorUuid]: 0,
    };
    this.roundNumber = 1;
  }

  addPlayer(uuid: string): void {
    if (Object.keys(this.players).length < 2) {
      this.players[uuid] = {
        symbol: 'O',
        connected: true,
      };
      this.score[uuid] = 0;
      this.isActive = true;
      this.updatedAt = Date.now();
    }
  }

  isFull(): boolean {
    return Object.keys(this.players).length === 2;
  }

  hasPlayer(uuid: string): boolean {
    return uuid in this.players;
  }

  getPlayerSymbol(uuid: string): PlayerSymbol | null {
    return this.players[uuid]?.symbol || null;
  }

  updateBoard(cell: number, symbol: PlayerSymbol): void {
    this.board[cell] = symbol;
    this.updatedAt = Date.now();
  }

  setNextPlayer(): void {
    this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
  }

  setWinner(winner: PlayerSymbol | null): void {
    this.winner = winner;
    this.isActive = false;
    this.updatedAt = Date.now();

    // Обновляем счет
    if (winner) {
      const winnerUuid = Object.keys(this.players).find(
        (uuid) => this.players[uuid].symbol === winner,
      );
      if (winnerUuid) {
        this.score[winnerUuid]++;
      }
    }
  }

  setDraw(): void {
    this.isDraw = true;
    this.isActive = false;
    this.updatedAt = Date.now();
  }

  resetRound(): void {
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.winner = null;
    this.isDraw = false;
    this.isActive = true;
    this.roundNumber++;
    this.updatedAt = Date.now();
  }

  disconnectPlayer(uuid: string): void {
    if (this.players[uuid]) {
      this.players[uuid].connected = false;
      this.updatedAt = Date.now();
    }
  }
}