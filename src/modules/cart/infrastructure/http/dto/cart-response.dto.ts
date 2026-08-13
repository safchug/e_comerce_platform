import { ApiProperty } from '@nestjs/swagger';
import { Cart } from '../../../domain/cart.entity';

export class CartItemResponseDto {
  @ApiProperty({ example: '3f6a9b2e-8c1d-4e3a-9f5b-1a2b3c4d5e6f' })
  productId!: string;

  @ApiProperty({ example: 2 })
  quantity!: number;
}

export class CartResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the cart',
    example: '9c1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c',
  })
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ type: [CartItemResponseDto] })
  items!: CartItemResponseDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export function toCartResponseDto(cart: Cart): CartResponseDto {
  return {
    id: cart.id,
    userId: cart.userId,
    items: cart.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
}
