import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../../../infrastructure/config';
import {
  type CartRepository,
  CART_REPOSITORY,
  CartPricingService,
} from '../../../cart';
import { type ProductRepository, PRODUCT_REPOSITORY } from '../../../product';
import { Order, OrderItemProps } from '../../domain/order.entity';
import { OrderStatus } from '../../domain/order-status.enum';
import {
  EmptyCartError,
  InactiveProductError,
  InsufficientStockError,
  ProductNotFoundError,
} from '../../domain/order.errors';
import {
  type OrderRepository,
  ORDER_REPOSITORY,
} from '../../domain/order.repository';

/**
 * Places an order from the current user's cart.
 *
 * This use case resolves and validates everything it can without I/O
 * side-effects (pricing, active/stock checks) up front, then hands the
 * priced Order to OrderRepository.placeOrder for the actual write. That
 * write is the real transactional boundary: it re-checks stock against the
 * live rows and, atomically, creates the order, decrements stock, and
 * empties the cart - the checks here are an optimistic fast-path, not the
 * source of truth.
 */
@Injectable()
export class PlaceOrderUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepository: CartRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  async execute(userId: string): Promise<Order> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart || cart.items.length === 0) {
      throw new EmptyCartError();
    }

    const products = await this.productRepository.findByIds(
      cart.items.map((item) => item.productId),
    );
    const productsById = new Map(
      products.map((product) => [product.id, product]),
    );

    const items: OrderItemProps[] = cart.items.map((item) => {
      const product = productsById.get(item.productId);
      if (!product) {
        throw new ProductNotFoundError();
      }
      if (!product.active) {
        throw new InactiveProductError();
      }
      if (item.quantity > product.stockQuantity) {
        throw new InsufficientStockError(product.stockQuantity, item.quantity);
      }
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
      };
    });

    const { taxRate } = this.configService.get('pricing', { infer: true });
    const totals = CartPricingService.calculate({ lines: items, taxRate });

    const now = new Date();
    const order = Order.create({
      id: randomUUID(),
      userId,
      items,
      status: OrderStatus.PENDING,
      subtotal: totals.subtotal,
      discount: totals.discount,
      taxRate: totals.taxRate,
      tax: totals.tax,
      total: totals.total,
      createdAt: now,
      updatedAt: now,
    });

    return this.orderRepository.placeOrder(order, cart.id);
  }
}
