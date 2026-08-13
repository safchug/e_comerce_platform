import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class SetCartItemQuantityDto {
  @ApiProperty({ description: 'Absolute quantity for this line', example: 3 })
  @IsInt()
  @IsPositive()
  quantity!: number;
}
