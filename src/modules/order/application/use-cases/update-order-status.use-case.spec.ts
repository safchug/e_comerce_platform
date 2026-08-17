import { UpdateOrderStatusUseCase } from './update-order-status.use-case';
import { FakeOrderRepository } from './test-doubles/fake-order-repository';
import { Order } from '../../domain/order.entity';
import { OrderStatus } from '../../domain/order-status.enum';
import {
  InvalidOrderStatusTransitionError,
  OrderNotFoundError,
} from '../../domain/order.errors';
import { Money } from '../../../../domain/shared/money';

function makeOrder(status: OrderStatus): Order {
  return Order.create({
    id: 'order-1',
    userId: 'user-1',
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

describe('UpdateOrderStatusUseCase', () => {
  let orderRepository: FakeOrderRepository;
  let useCase: UpdateOrderStatusUseCase;

  beforeEach(() => {
    orderRepository = new FakeOrderRepository();
    useCase = new UpdateOrderStatusUseCase(orderRepository);
  });

  it('advances the order to an allowed status and persists it', async () => {
    orderRepository.seed(makeOrder(OrderStatus.PENDING));

    const updated = await useCase.execute('order-1', OrderStatus.PAID);

    expect(updated.status).toBe(OrderStatus.PAID);
    expect((await orderRepository.findById('order-1'))?.status).toBe(
      OrderStatus.PAID,
    );
  });

  it('throws InvalidOrderStatusTransitionError for an illegal transition', async () => {
    orderRepository.seed(makeOrder(OrderStatus.DELIVERED));

    await expect(
      useCase.execute('order-1', OrderStatus.PENDING),
    ).rejects.toThrow(InvalidOrderStatusTransitionError);
  });

  it('throws OrderNotFoundError when the order does not exist', async () => {
    await expect(
      useCase.execute('missing-order', OrderStatus.PAID),
    ).rejects.toThrow(OrderNotFoundError);
  });
});
