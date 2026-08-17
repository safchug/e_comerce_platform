import { Order } from './order.entity';
import { OrderStatus } from './order-status.enum';

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
  findById(id: string): Promise<Order | null>;
  /**
   * Atomically moves an order from `from` to `to`, conditioned on the order
   * still being in `from` at write time - the same compare-and-swap shape
   * as placeOrder's stock decrement, so two racing transitions on the same
   * order can't both apply (see PrismaOrderRepository.updateStatus). Throws
   * OrderConcurrentUpdateError if the order's status no longer matches
   * `from` (e.g. a concurrent update already moved it).
   */
  updateStatus(
    orderId: string,
    from: OrderStatus,
    to: OrderStatus,
  ): Promise<Order>;
}

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');
