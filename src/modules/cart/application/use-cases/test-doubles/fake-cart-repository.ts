import {
  CartRepository,
  CART_REPOSITORY,
} from '../../../domain/cart.repository';
import { Cart } from '../../../domain/cart.entity';

/** In-memory fake used across use-case unit tests (no I/O). */
export class FakeCartRepository implements CartRepository {
  private readonly cartsByUserId = new Map<string, Cart>();

  findByUserId(userId: string): Promise<Cart | null> {
    return Promise.resolve(this.cartsByUserId.get(userId) ?? null);
  }

  save(cart: Cart): Promise<Cart> {
    this.cartsByUserId.set(cart.userId, cart);
    return Promise.resolve(cart);
  }

  seed(overrides: Partial<Parameters<typeof Cart.create>[0]> = {}): Cart {
    const now = new Date();
    const cart = Cart.create({
      id: overrides.id ?? `cart-${this.cartsByUserId.size + 1}`,
      userId: overrides.userId ?? `user-${this.cartsByUserId.size + 1}`,
      items: overrides.items ?? [],
      createdAt: overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
    });
    this.cartsByUserId.set(cart.userId, cart);
    return cart;
  }
}

export { CART_REPOSITORY };
