import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { GameResultController } from './game-result.controller';

@Module({
  controllers: [GameResultController],
  providers: [GameGateway, GameService],
  exports: [GameService],
})
export class GameModule {}