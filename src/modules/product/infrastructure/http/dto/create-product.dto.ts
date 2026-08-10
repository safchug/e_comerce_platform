import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
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

  @ApiProperty({ example: 'Electronics' })
  @IsString()
  @MinLength(1)
  category!: string;

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
}
