import { CancelOrderUseCase } from './cancel-order.use-case';
import { FakeOrderRepository } from './test-doubles/fake-order-repository';
import { Order } from '../../domain/order.entity';
import { OrderStatus } from '../../domain/order-status.enum';
import {
  InvalidOrderStatusTransitionError,
  OrderNotFoundError,
} from '../../domain/order.errors';
import { Money } from '../../../../domain/shared/money';

function makeOrder(status: OrderStatus, userId = 'user-1'): Order {
  return Order.create({
    id: 'order-1',
    userId,
    items: [
      { productId: 'product-1', quantity: 1, unitPrice: Money.fromCents(1000) },
    ],
    status,
    subtotal: Money.fromCents(1000),
    discount: Money.fromCents(0),
    taxRate: 0,
    tax: Money.fromCents(0),
    total: Money.fromCents(1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('CancelOrderUseCase', () => {
  let orderRepository: FakeOrderRepository;
  let useCase: CancelOrderUseCase;

  beforeEach(() => {
    orderRepository = new FakeOrderRepository();
    useCase = new CancelOrderUseCase(orderRepository);
  });

  it('cancels a PENDING order', async () => {
    orderRepository.seed(makeOrder(OrderStatus.PENDING));

    const cancelled = await useCase.execute('order-1', 'user-1');

    expect(cancelled.status).toBe(OrderStatus.CANCELLED);
    expect((await orderRepository.findById('order-1'))?.status).toBe(
      OrderStatus.CANCELLED,
    );
  });

  it('cancels a PAID order', async () => {
    orderRepository.seed(makeOrder(OrderStatus.PAID));

    const cancelled = await useCase.execute('order-1', 'user-1');

    expect(cancelled.status).toBe(OrderStatus.CANCELLED);
  });

  it('throws InvalidOrderStatusTransitionError once the order has shipped', async () => {
    orderRepository.seed(makeOrder(OrderStatus.SHIPPED));

    await expect(useCase.execute('order-1', 'user-1')).rejects.toThrow(
      InvalidOrderStatusTransitionError,
    );
  });

  it('throws OrderNotFoundError when the order does not exist', async () => {
    await expect(useCase.execute('missing-order', 'user-1')).rejects.toThrow(
      OrderNotFoundError,
    );
  });

  it('throws OrderNotFoundError rather than leaking that another user owns the order', async () => {
    orderRepository.seed(makeOrder(OrderStatus.PENDING, 'someone-else'));

    await expect(useCase.execute('order-1', 'user-1')).rejects.toThrow(
      OrderNotFoundError,
    );
  });
});
