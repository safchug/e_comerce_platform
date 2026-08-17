import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database';
import type {
  Order as PrismaOrderRow,
  OrderItem as PrismaOrderItemRow,
} from '../../../../infrastructure/database/prisma-client';
import { Money } from '../../../../domain/shared/money';
import { OrderRepository } from '../../domain/order.repository';
import { Order } from '../../domain/order.entity';
import { OrderStatus } from '../../domain/order-status.enum';
import { InsufficientStockError } from '../../domain/order.errors';

type OrderRowWithItems = PrismaOrderRow & { items: PrismaOrderItemRow[] };

@Injectable()
export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async placeOrder(order: Order, cartId: string): Promise<Order> {
    const row = await this.prisma.$transaction(async (tx) => {
      // Decrement stock line by line, conditioned on there being enough of
      // it left. A conditional update (rather than read-then-write) is what
      // makes this safe against a concurrent order for the same product:
      // if the row doesn't satisfy the WHERE, nothing is written and we
      // throw, which aborts the transaction and rolls back every write
      // made so far - order creation and earlier decrements included.
      for (const item of order.items) {
        const result = await tx.product.updateMany({
          where: { id: item.productId, stockQuantity: { gte: item.quantity } },
          data: { stockQuantity: { decrement: item.quantity } },
        });
        if (result.count === 0) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });
          throw new InsufficientStockError(
            product?.stockQuantity ?? 0,
            item.quantity,
          );
        }
      }

      const created = await tx.order.create({
        data: {
          id: order.id,
          userId: order.userId,
          status: order.status,
          currency: order.total.getCurrency(),
          subtotalCents: order.subtotal.getCents(),
          discountCents: order.discount.getCents(),
          taxRate: order.taxRate,
          taxCents: order.tax.getCents(),
          totalCents: order.total.getCents(),
          items: {
            create: order.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPriceCents: item.unitPrice.getCents(),
              currency: item.unitPrice.getCurrency(),
            })),
          },
        },
        include: { items: true },
      });

      // Empties the cart's lines rather than deleting the cart itself, so
      // the same cart id is reused the next time this user shops.
      await tx.cartItem.deleteMany({ where: { cartId } });

      return created;
    });

    return this.toDomain(row);
  }

  async findById(id: string): Promise<Order | null> {
    const row = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    return row ? this.toDomain(row) : null;
  }

  async save(order: Order): Promise<Order> {
    const row = await this.prisma.order.update({
      where: { id: order.id },
      data: { status: order.status },
      include: { items: true },
    });
    return this.toDomain(row);
  }

  private toDomain(row: OrderRowWithItems): Order {
    const currency = row.currency;
    return Order.create({
      id: row.id,
      userId: row.userId,
      items: row.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: Money.fromCents(item.unitPriceCents, item.currency),
      })),
      status: OrderStatus[row.status],
      subtotal: Money.fromCents(row.subtotalCents, currency),
      discount: Money.fromCents(row.discountCents, currency),
      taxRate: row.taxRate,
      tax: Money.fromCents(row.taxCents, currency),
      total: Money.fromCents(row.totalCents, currency),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
