import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsUUID } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({ example: '3f6a9b2e-8c1d-4e3a-9f5b-1a2b3c4d5e6f' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ description: 'Units to add', example: 1 })
  @IsInt()
  @IsPositive()
  quantity!: number;
}
