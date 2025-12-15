import { IsString, IsNotEmpty } from 'class-validator';

export class GameStartDto {
  @IsString()
  @IsNotEmpty()
  sourceUuid: string;

  @IsString()
  @IsNotEmpty()
  targetUuid: string;
}