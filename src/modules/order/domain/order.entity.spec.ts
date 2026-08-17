import { Order } from './order.entity';
import {
  EmptyCartError,
  InvalidOrderStatusTransitionError,
  InvalidQuantityError,
} from './order.errors';
import { OrderStatus } from './order-status.enum';
import { Money } from '../../../domain/shared/money';

describe('Order', () => {
  const validProps = () => ({
    id: 'order-1',
    userId: 'user-1',
    items: [
      {
        productId: 'product-1',
        quantity: 2,
        unitPrice: Money.fromCents(1000),
      },
    ],
    status: OrderStatus.PENDING,
    subtotal: Money.fromCents(2000),
    discount: Money.fromCents(0),
    taxRate: 0.1,
    tax: Money.fromCents(200),
    total: Money.fromCents(2200),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  describe('create', () => {
    it('builds an order from valid props', () => {
      const order = Order.create(validProps());

      expect(order.id).toBe('order-1');
      expect(order.items).toHaveLength(1);
      expect(order.total.getCents()).toBe(2200);
    });

    it('rejects an order with no items', () => {
      expect(() => Order.create({ ...validProps(), items: [] })).toThrow(
        EmptyCartError,
      );
    });

    it('rejects an item with a zero quantity', () => {
      expect(() =>
        Order.create({
          ...validProps(),
          items: [
            {
              productId: 'product-1',
              quantity: 0,
              unitPrice: Money.fromCents(1000),
            },
          ],
        }),
      ).toThrow(InvalidQuantityError);
    });

    it('rejects an item with a non-integer quantity', () => {
      expect(() =>
        Order.create({
          ...validProps(),
          items: [
            {
              productId: 'product-1',
              quantity: 1.5,
              unitPrice: Money.fromCents(1000),
            },
          ],
        }),
      ).toThrow(InvalidQuantityError);
    });
  });

  describe('withStatus', () => {
    it.each([
      [OrderStatus.PENDING, OrderStatus.PAID],
      [OrderStatus.PENDING, OrderStatus.CANCELLED],
      [OrderStatus.PAID, OrderStatus.SHIPPED],
      [OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED, OrderStatus.DELIVERED],
    ])('allows %s -> %s', (from, to) => {
      const order = Order.create({ ...validProps(), status: from });

      const updated = order.withStatus(to);

      expect(updated.status).toBe(to);
    });

    it.each([
      [OrderStatus.DELIVERED, OrderStatus.PENDING],
      [OrderStatus.CANCELLED, OrderStatus.PENDING],
      [OrderStatus.PENDING, OrderStatus.SHIPPED],
      [OrderStatus.PENDING, OrderStatus.DELIVERED],
      [OrderStatus.PAID, OrderStatus.PENDING],
      [OrderStatus.PAID, OrderStatus.DELIVERED],
      [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED, OrderStatus.PAID],
      [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
    ])('rejects %s -> %s', (from, to) => {
      const order = Order.create({ ...validProps(), status: from });

      expect(() => order.withStatus(to)).toThrow(
        InvalidOrderStatusTransitionError,
      );
    });

    it('leaves the original order untouched (immutable)', () => {
      const order = Order.create({
        ...validProps(),
        status: OrderStatus.PENDING,
      });

      order.withStatus(OrderStatus.PAID);

      expect(order.status).toBe(OrderStatus.PENDING);
    });
  });
});
