import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'WM-1000' })
  @IsString()
  @MinLength(1)
  sku!: string;

  @ApiProperty({ example: 'Wireless Mouse' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({
    example: 'Ergonomic wireless mouse with USB receiver',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Price in whole cents', example: 2999 })
  @IsInt()
  @IsPositive()
  priceCents!: number;

  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Units available in stock', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stockQuantity?: number;
}
