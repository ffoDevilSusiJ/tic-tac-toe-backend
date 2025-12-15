import { PlayerSymbol } from '../types/game.types';

const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export class GameLogicUtil {
  static checkWinner(board: (PlayerSymbol | null)[]): PlayerSymbol | null {
    for (const [a, b, c] of WINNING_COMBINATIONS) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  }

  static checkDraw(board: (PlayerSymbol | null)[]): boolean {
    return board.every((cell) => cell !== null) && !this.checkWinner(board);
  }

  static isValidMove(
    board: (PlayerSymbol | null)[],
    cell: number,
    currentPlayer: PlayerSymbol,
    playerSymbol: PlayerSymbol,
  ): boolean {
    return (
      cell >= 0 &&
      cell < 9 &&
      board[cell] === null &&
      currentPlayer === playerSymbol
    );
  }

  static getNextPlayer(current: PlayerSymbol): PlayerSymbol {
    return current === 'X' ? 'O' : 'X';
  }
}