import { IsBoolean, IsString } from 'class-validator';

export class GameResultDto {
  @IsString()
  username: string;

  @IsBoolean()
  isWin: boolean;
}
