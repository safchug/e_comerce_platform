import { Cart } from './cart.entity';
import { CartItemNotFoundError, InvalidQuantityError } from './cart.errors';

describe('Cart', () => {
  const emptyCart = () =>
    Cart.create({
      id: 'cart-1',
      userId: 'user-1',
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  describe('create', () => {
    it('rejects an item with a zero quantity', () => {
      expect(() =>
        Cart.create({
          id: 'cart-1',
          userId: 'user-1',
          items: [{ productId: 'product-1', quantity: 0 }],
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ).toThrow(InvalidQuantityError);
    });
  });

  describe('withItemAdded', () => {
    it('adds a new line for a product not yet in the cart', () => {
      const cart = emptyCart().withItemAdded('product-1', 2);

      expect(cart.findItem('product-1')?.quantity).toBe(2);
    });

    it('merges into the existing line when the product is already in the cart', () => {
      const cart = emptyCart()
        .withItemAdded('product-1', 2)
        .withItemAdded('product-1', 3);

      expect(cart.items).toHaveLength(1);
      expect(cart.findItem('product-1')?.quantity).toBe(5);
    });

    it('rejects a non-positive quantity', () => {
      expect(() => emptyCart().withItemAdded('product-1', 0)).toThrow(
        InvalidQuantityError,
      );
      expect(() => emptyCart().withItemAdded('product-1', -1)).toThrow(
        InvalidQuantityError,
      );
    });

    it('rejects a non-integer quantity', () => {
      expect(() => emptyCart().withItemAdded('product-1', 1.5)).toThrow(
        InvalidQuantityError,
      );
    });
  });

  describe('withItemQuantitySet', () => {
    it('overwrites the quantity of an existing line', () => {
      const cart = emptyCart()
        .withItemAdded('product-1', 2)
        .withItemQuantitySet('product-1', 9);

      expect(cart.findItem('product-1')?.quantity).toBe(9);
    });

    it('is idempotent: calling it twice with the same quantity yields the same state', () => {
      const once = emptyCart()
        .withItemAdded('product-1', 2)
        .withItemQuantitySet('product-1', 5);
      const twice = once.withItemQuantitySet('product-1', 5);

      expect(twice.findItem('product-1')?.quantity).toBe(5);
      expect(twice.items).toHaveLength(1);
    });

    it('throws when the product is not in the cart', () => {
      expect(() => emptyCart().withItemQuantitySet('product-1', 3)).toThrow(
        CartItemNotFoundError,
      );
    });
  });

  describe('withItemRemoved', () => {
    it('removes an existing line', () => {
      const cart = emptyCart()
        .withItemAdded('product-1', 2)
        .withItemRemoved('product-1');

      expect(cart.findItem('product-1')).toBeUndefined();
      expect(cart.items).toHaveLength(0);
    });

    it('is a no-op, not an error, when the product is not in the cart', () => {
      const cart = emptyCart().withItemRemoved('product-1');

      expect(cart.items).toHaveLength(0);
    });
  });
});
