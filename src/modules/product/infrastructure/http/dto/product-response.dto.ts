import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the product',
    example: '3f6a9b2e-8c1d-4e3a-9f5b-1a2b3c4d5e6f',
  })
  id!: string;

  @ApiProperty({ example: 'WM-1000' })
  sku!: string;

  @ApiProperty({ example: 'Wireless Mouse' })
  name!: string;

  @ApiPropertyOptional({
    example: 'Ergonomic wireless mouse with USB receiver',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({ description: 'Price in whole cents', example: 2999 })
  priceCents!: number;

  @ApiProperty({ example: 'USD' })
  currency!: string;

  @ApiProperty()
  active!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
