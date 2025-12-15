import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { Game } from './entities/game.entity';
import { GameLogicUtil } from '../common/utils/game-logic.util';
import { GameState, PlayerSymbol } from '../common/types/game.types';

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);

  constructor(private readonly redisService: RedisService) {}

  async createGame(creatorUuid: string): Promise<Game> {
    const gameId = creatorUuid;
    const game = new Game(gameId, creatorUuid);

    await this.redisService.setGame(gameId, game);
    await this.redisService.setPlayerGame(creatorUuid, gameId);

    this.logger.log(`Game created: ${gameId}`);
    return game;
  }

  async joinGame(targetUuid: string, joinerUuid: string): Promise<Game | null> {
    const gameId = targetUuid;
    const gameState = await this.redisService.getGame(gameId);

    if (!gameState) {
      this.logger.warn(`Game not found: ${gameId}`);
      return null;
    }

    const game = Object.assign(new Game(gameId, targetUuid), gameState);

    if (game.isFull()) {
      this.logger.warn(`Game is full: ${gameId}`);
      return null;
    }

    game.addPlayer(joinerUuid);
    await this.redisService.setGame(gameId, game);
    await this.redisService.setPlayerGame(joinerUuid, gameId);

    this.logger.log(`Player ${joinerUuid} joined game ${gameId}`);
    return game;
  }

  async getGame(gameId: string): Promise<Game | null> {
    const gameState = await this.redisService.getGame(gameId);
    if (!gameState) return null;

    return Object.assign(new Game(gameId, ''), gameState);
  }

  async getPlayerGame(playerUuid: string): Promise<Game | null> {
    const gameId = await this.redisService.getPlayerGame(playerUuid);
    if (!gameId) return null;

    return this.getGame(gameId);
  }

  async makeMove(
    gameId: string,
    playerUuid: string,
    cell: number,
  ): Promise<{ game: Game; isValid: boolean; error?: string }> {
    const game = await this.getGame(gameId);

    if (!game) {
      return { game: null, isValid: false, error: 'Game not found' };
    }

    if (!game.isActive) {
      return { game, isValid: false, error: 'Game is not active' };
    }

    const playerSymbol = game.getPlayerSymbol(playerUuid);
    if (!playerSymbol) {
      return { game, isValid: false, error: 'Player not in game' };
    }

    if (!GameLogicUtil.isValidMove(game.board, cell, game.currentPlayer, playerSymbol)) {
      return { game, isValid: false, error: 'Invalid move' };
    }

    game.updateBoard(cell, playerSymbol);

    const winner = GameLogicUtil.checkWinner(game.board);
    if (winner) {
      game.setWinner(winner);
      await this.redisService.setGame(gameId, game);
      return { game, isValid: true };
    }

    const isDraw = GameLogicUtil.checkDraw(game.board);
    if (isDraw) {
      game.setDraw();
      await this.redisService.setGame(gameId, game);
      return { game, isValid: true };
    }

    game.setNextPlayer();
    await this.redisService.setGame(gameId, game);

    return { game, isValid: true };
  }

  async resetRound(gameId: string): Promise<Game | null> {
    const game = await this.getGame(gameId);
    if (!game) return null;

    game.resetRound();
    await this.redisService.setGame(gameId, game);
    
    this.logger.log(`Round reset for game: ${gameId}, round: ${game.roundNumber}`);
    return game;
  }

  async endGame(gameId: string): Promise<void> {
    await this.redisService.deleteGame(gameId);
    this.logger.log(`Game ended: ${gameId}`);
  }

  async disconnectPlayer(playerUuid: string): Promise<void> {
    const game = await this.getPlayerGame(playerUuid);
    if (game) {
      game.disconnectPlayer(playerUuid);
      await this.redisService.setGame(game.id, game);
      await this.redisService.deletePlayerGame(playerUuid);
    }
  }
}