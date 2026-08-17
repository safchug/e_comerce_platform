import { Inject, Injectable } from '@nestjs/common';
import { Order } from '../../domain/order.entity';
import { OrderStatus } from '../../domain/order-status.enum';
import { OrderNotFoundError } from '../../domain/order.errors';
import {
  type OrderRepository,
  ORDER_REPOSITORY,
} from '../../domain/order.repository';

/**
 * Lets a shopper cancel their own order.
 *
 * An order that isn't found, or that belongs to a different user, is
 * reported the same way (OrderNotFoundError -> 404) rather than as a 403 -
 * that avoids confirming to a caller that some other user's order id
 * exists. Whether cancellation is still legal (i.e. not yet Shipped) is
 * enforced by Order.withStatus's transition table, same as
 * UpdateOrderStatusUseCase; reaching CANCELLED is what makes
 * PrismaOrderRepository.updateStatus reverse the stock reservation.
 */
@Injectable()
export class CancelOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
  ) {}

  async execute(orderId: string, userId: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);
    if (!order || order.userId !== userId) {
      throw new OrderNotFoundError();
    }

    order.withStatus(OrderStatus.CANCELLED);
    return this.orderRepository.updateStatus(
      orderId,
      order.status,
      OrderStatus.CANCELLED,
    );
  }
}
