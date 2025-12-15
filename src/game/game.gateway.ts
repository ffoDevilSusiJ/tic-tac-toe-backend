import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { GameService } from './game.service';
import { WSMessageType } from '../common/types/websocket.types';
import { GameStartDto } from './dto/game-start.dto';
import { PlayerMoveDto } from './dto/player-move.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);
  private playerSockets: Map<string, string> = new Map();

  constructor(private readonly gameService: GameService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    const playerUuid = Array.from(this.playerSockets.entries()).find(
      ([, socketId]) => socketId === client.id,
    )?.[0];

    if (playerUuid) {
      await this.gameService.disconnectPlayer(playerUuid);
      this.playerSockets.delete(playerUuid);
    }
  }

  @SubscribeMessage(WSMessageType.GAME_START)
  async handleGameStart(
    @MessageBody() data: GameStartDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      this.logger.log(`Game start request: ${JSON.stringify(data)}`);

      const { sourceUuid, targetUuid } = data;
      this.playerSockets.set(sourceUuid, client.id);

      let game;

      if (sourceUuid === targetUuid) {
        game = await this.gameService.createGame(sourceUuid);
        client.join(game.id);
        this.logger.log(`Game created: ${game.id}, waiting for second player`);
        return;
      }

      game = await this.gameService.joinGame(targetUuid, sourceUuid);

      if (!game) {
        client.emit(WSMessageType.ERROR, {
          type: WSMessageType.ERROR,
          error: 'Game not found or is full',
        });
        return;
      }

      client.join(game.id);

      const players = Object.entries(game.players);
      
      for (const [uuid, playerData] of players) {
        const socketId = this.playerSockets.get(uuid);
        if (socketId) {
          this.server.to(socketId).emit(WSMessageType.GAME_START, {
            type: WSMessageType.GAME_START,
            symbol: (playerData as any).symbol,
            score: game.score,
            roundNumber: game.roundNumber,
          });
        }
      }

      this.logger.log(`Game started: ${game.id} with 2 players`);
    } catch (error) {
      this.logger.error('Error in handleGameStart:', error);
      client.emit(WSMessageType.ERROR, {
        type: WSMessageType.ERROR,
        error: 'Failed to start game',
      });
    }
  }

  @SubscribeMessage(WSMessageType.PLAYER_MOVE)
  async handlePlayerMove(
    @MessageBody() data: PlayerMoveDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { sourceUuid, cell } = data;

      const game = await this.gameService.getPlayerGame(sourceUuid);
      if (!game) {
        client.emit(WSMessageType.ERROR, {
          type: WSMessageType.ERROR,
          error: 'Game not found',
        });
        return;
      }

      const result = await this.gameService.makeMove(game.id, sourceUuid, cell);

      if (!result.isValid) {
        client.emit(WSMessageType.ERROR, {
          type: WSMessageType.ERROR,
          error: result.error,
        });
        return;
      }

      this.server.to(game.id).emit(WSMessageType.PLAYER_MOVE, {
        type: WSMessageType.PLAYER_MOVE,
        sourceUuid,
        cell,
      });

      if (result.game.winner || result.game.isDraw) {
        this.server.to(game.id).emit(WSMessageType.GAME_END, {
          type: WSMessageType.GAME_END,
          winner: result.game.winner,
          isDraw: result.game.isDraw,
          score: result.game.score,
          roundNumber: result.game.roundNumber,
        });

        this.logger.log(
          `Game ended: ${game.id}, winner: ${result.game.winner}, draw: ${result.game.isDraw}`,
        );

        // Автоматический перезапуск через 5 секунд
        setTimeout(async () => {
          const resetGame = await this.gameService.resetRound(game.id);
          if (resetGame) {
            this.server.to(game.id).emit('round_start', {
              type: 'round_start',
              roundNumber: resetGame.roundNumber,
              score: resetGame.score,
            });
            this.logger.log(`Round ${resetGame.roundNumber} started for game ${game.id}`);
          }
        }, 5000);
      }
    } catch (error) {
      this.logger.error('Error in handlePlayerMove:', error);
      client.emit(WSMessageType.ERROR, {
        type: WSMessageType.ERROR,
        error: 'Failed to process move',
      });
    }
  }

  @SubscribeMessage(WSMessageType.GAME_END)
  async handleGameEnd(
    @MessageBody() data: { sourceUuid: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const game = await this.gameService.getPlayerGame(data.sourceUuid);
      if (game) {
        await this.gameService.endGame(game.id);
      }
    } catch (error) {
      this.logger.error('Error in handleGameEnd:', error);
    }
  }
}