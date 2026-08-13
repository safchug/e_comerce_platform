import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database';
import type {
  Cart as PrismaCartRow,
  CartItem as PrismaCartItemRow,
} from '../../../../infrastructure/database/prisma-client';
import { CartRepository } from '../../domain/cart.repository';
import { Cart } from '../../domain/cart.entity';

type CartRowWithItems = PrismaCartRow & { items: PrismaCartItemRow[] };

@Injectable()
export class PrismaCartRepository implements CartRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<Cart | null> {
    const row = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });
    return row ? this.toDomain(row) : null;
  }

  async save(cart: Cart): Promise<Cart> {
    const row = await this.prisma.$transaction(async (tx) => {
      const cartRow = await tx.cart.upsert({
        where: { id: cart.id },
        create: { id: cart.id, userId: cart.userId },
        update: { updatedAt: cart.updatedAt },
      });

      const productIds = cart.items.map((item) => item.productId);
      // Drop lines the domain entity no longer has (e.g. after a removal).
      await tx.cartItem.deleteMany({
        where: {
          cartId: cartRow.id,
          ...(productIds.length > 0
            ? { productId: { notIn: productIds } }
            : {}),
        },
      });

      await Promise.all(
        cart.items.map((item) =>
          tx.cartItem.upsert({
            where: {
              cartId_productId: {
                cartId: cartRow.id,
                productId: item.productId,
              },
            },
            create: {
              cartId: cartRow.id,
              productId: item.productId,
              quantity: item.quantity,
            },
            update: { quantity: item.quantity },
          }),
        ),
      );

      return tx.cart.findUniqueOrThrow({
        where: { id: cartRow.id },
        include: { items: true },
      });
    });

    return this.toDomain(row);
  }

  private toDomain(row: CartRowWithItems): Cart {
    return Cart.create({
      id: row.id,
      userId: row.userId,
      items: row.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
