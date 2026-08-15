import { Order } from './order.entity';

/** Port: infrastructure provides the implementation (e.g. Prisma). */
export interface OrderRepository {
  /**
   * Persists the order and its lines, decrements stock for each line, and
   * empties the source cart - all inside a single DB transaction (the unit
   * of work for order placement). All-or-nothing: if any line's stock can't
   * cover the requested quantity by the time the transaction runs, it
   * throws InsufficientStockError and rolls back every write, including
   * lines that would otherwise have succeeded.
   */
  placeOrder(order: Order, cartId: string): Promise<Order>;
}

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');
