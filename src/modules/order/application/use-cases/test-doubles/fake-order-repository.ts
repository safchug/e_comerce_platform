import {
  OrderRepository,
  ORDER_REPOSITORY,
} from '../../../domain/order.repository';
import { Order } from '../../../domain/order.entity';

/**
 * In-memory fake used across use-case unit tests (no I/O).
 *
 * It doesn't decrement stock or clear the cart - PlaceOrderUseCase's own
 * pre-checks are what's under test here. The atomic write (stock
 * decrement + order insert + cart clear in one transaction) is only real
 * against a real database, so that's covered by the orders e2e suite
 * against PrismaOrderRepository instead.
 */
export class FakeOrderRepository implements OrderRepository {
  readonly placedOrders: Order[] = [];
  readonly clearedCartIds: string[] = [];
  private failNextWith: Error | null = null;

  /** Simulates the transaction losing a stock race between the use case's pre-check and the write, and rolling back. */
  failNextPlacementWith(error: Error): void {
    this.failNextWith = error;
  }

  placeOrder(order: Order, cartId: string): Promise<Order> {
    if (this.failNextWith) {
      const error = this.failNextWith;
      this.failNextWith = null;
      return Promise.reject(error);
    }
    this.placedOrders.push(order);
    this.clearedCartIds.push(cartId);
    return Promise.resolve(order);
  }
}

export { ORDER_REPOSITORY };
