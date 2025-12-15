import { IsString, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class PlayerMoveDto {
  @IsString()
  @IsNotEmpty()
  sourceUuid: string;

  @IsNumber()
  @Min(0)
  @Max(8)
  cell: number;
}