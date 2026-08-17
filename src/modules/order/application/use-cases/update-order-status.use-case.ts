import { Inject, Injectable } from '@nestjs/common';
import { Order } from '../../domain/order.entity';
import { OrderStatus } from '../../domain/order-status.enum';
import { OrderNotFoundError } from '../../domain/order.errors';
import {
  type OrderRepository,
  ORDER_REPOSITORY,
} from '../../domain/order.repository';

/**
 * Advances an order's status. Illegal transitions surface as
 * InvalidOrderStatusTransitionError from Order.withStatus - this use case
 * doesn't duplicate that rule, just wires the repository lookup/write
 * around it.
 *
 * The write itself goes through OrderRepository.updateStatus, conditioned
 * on the order still being in the status this use case just read - if a
 * concurrent request already moved it, that throws OrderConcurrentUpdateError
 * rather than silently clobbering the other update.
 */
@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
  ) {}

  async execute(orderId: string, status: OrderStatus): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new OrderNotFoundError();
    }

    order.withStatus(status);
    return this.orderRepository.updateStatus(orderId, order.status, status);
  }
}
