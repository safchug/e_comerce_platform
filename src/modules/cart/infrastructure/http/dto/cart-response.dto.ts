import { ApiProperty } from '@nestjs/swagger';
import { Cart } from '../../../domain/cart.entity';
import {
  CartTotals,
  PricedCartLine,
} from '../../../domain/cart-pricing.service';

export class CartItemResponseDto {
  @ApiProperty({ example: '3f6a9b2e-8c1d-4e3a-9f5b-1a2b3c4d5e6f' })
  productId!: string;

  @ApiProperty({ example: 2 })
  quantity!: number;

  @ApiProperty({ description: 'Current unit price, in cents', example: 1999 })
  unitPriceCents!: number;

  @ApiProperty({
    description: 'unitPriceCents x quantity, in cents',
    example: 3998,
  })
  lineTotalCents!: number;
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

  @ApiProperty({ example: 'USD' })
  currency!: string;

  @ApiProperty({ description: 'Sum of line totals, in cents', example: 3998 })
  subtotalCents!: number;

  @ApiProperty({ description: 'Discount applied, in cents', example: 0 })
  discountCents!: number;

  @ApiProperty({
    description: 'Flat tax rate applied, e.g. 0.0825 for 8.25%',
    example: 0.0825,
  })
  taxRate!: number;

  @ApiProperty({
    description: 'Tax charged on the post-discount amount, in cents',
    example: 330,
  })
  taxCents!: number;

  @ApiProperty({
    description: 'subtotalCents - discountCents + taxCents',
    example: 4328,
  })
  totalCents!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export function toCartResponseDto(
  cart: Cart,
  lines: PricedCartLine[],
  totals: CartTotals,
): CartResponseDto {
  const linesByProductId = new Map(lines.map((line) => [line.productId, line]));

  return {
    id: cart.id,
    userId: cart.userId,
    items: cart.items.map((item) => {
      const line = linesByProductId.get(item.productId);
      const unitPriceCents = line?.unitPrice.getCents() ?? 0;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPriceCents,
        lineTotalCents: unitPriceCents * item.quantity,
      };
    }),
    currency: totals.total.getCurrency(),
    subtotalCents: totals.subtotal.getCents(),
    discountCents: totals.discount.getCents(),
    taxRate: totals.taxRate,
    taxCents: totals.tax.getCents(),
    totalCents: totals.total.getCents(),
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
}
