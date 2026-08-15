import { ApiProperty } from '@nestjs/swagger';
import { Order } from '../../../domain/order.entity';

export class OrderItemResponseDto {
  @ApiProperty({ example: '3f6a9b2e-8c1d-4e3a-9f5b-1a2b3c4d5e6f' })
  productId!: string;

  @ApiProperty({ example: 2 })
  quantity!: number;

  @ApiProperty({
    description: 'Unit price at the time the order was placed, in cents',
    example: 1999,
  })
  unitPriceCents!: number;

  @ApiProperty({
    description: 'unitPriceCents x quantity, in cents',
    example: 3998,
  })
  lineTotalCents!: number;
}

export class OrderResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the order',
    example: '9c1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c',
  })
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items!: OrderItemResponseDto[];

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

export function toOrderResponseDto(order: Order): OrderResponseDto {
  return {
    id: order.id,
    userId: order.userId,
    items: order.items.map((item) => {
      const unitPriceCents = item.unitPrice.getCents();
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPriceCents,
        lineTotalCents: unitPriceCents * item.quantity,
      };
    }),
    currency: order.total.getCurrency(),
    subtotalCents: order.subtotal.getCents(),
    discountCents: order.discount.getCents(),
    taxRate: order.taxRate,
    taxCents: order.tax.getCents(),
    totalCents: order.total.getCents(),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}
