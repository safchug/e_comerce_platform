import { Order } from './order.entity';
import { EmptyCartError, InvalidQuantityError } from './order.errors';
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
});
