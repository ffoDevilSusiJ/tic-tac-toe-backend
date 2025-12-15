import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { GameState } from '../common/types/game.types';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private readonly GAME_PREFIX = 'game:';
  private readonly PLAYER_PREFIX = 'player:';
  private readonly GAME_TTL = 3600; // 1 час

  async onModuleInit() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://redis:6379',
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected');
    });

    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async setGame(gameId: string, gameState: GameState): Promise<void> {
    const key = this.GAME_PREFIX + gameId;
    await this.client.set(key, JSON.stringify(gameState), {
      EX: this.GAME_TTL,
    });
  }

  async getGame(gameId: string): Promise<GameState | null> {
    const key = this.GAME_PREFIX + gameId;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteGame(gameId: string): Promise<void> {
    const key = this.GAME_PREFIX + gameId;
    await this.client.del(key);
  }

  async setPlayerGame(playerUuid: string, gameId: string): Promise<void> {
    const key = this.PLAYER_PREFIX + playerUuid;
    await this.client.set(key, gameId, {
      EX: this.GAME_TTL,
    });
  }

  async getPlayerGame(playerUuid: string): Promise<string | null> {
    const key = this.PLAYER_PREFIX + playerUuid;
    return await this.client.get(key);
  }

  async deletePlayerGame(playerUuid: string): Promise<void> {
    const key = this.PLAYER_PREFIX + playerUuid;
    await this.client.del(key);
  }

  async getAllGames(): Promise<GameState[]> {
    const keys = await this.client.keys(this.GAME_PREFIX + '*');
    const games: GameState[] = [];

    for (const key of keys) {
      const data = await this.client.get(key);
      if (data) {
        games.push(JSON.parse(data));
      }
    }

    return games;
  }

  async cleanExpiredGames(): Promise<number> {
    const games = await this.getAllGames();
    const now = Date.now();
    let cleaned = 0;

    for (const game of games) {
      if (now - game.updatedAt > this.GAME_TTL * 1000) {
        await this.deleteGame(game.id);
        cleaned++;
      }
    }

    return cleaned;
  }
}