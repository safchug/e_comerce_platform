import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Product } from '../../../domain/product.entity';

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

  @ApiProperty({ example: 'Electronics' })
  category!: string;

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

export function toProductResponseDto(product: Product): ProductResponseDto {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    category: product.category,
    description: product.description,
    priceCents: product.price.getCents(),
    currency: product.price.getCurrency(),
    active: product.active,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}
