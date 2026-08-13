import { Cart } from './cart.entity';

/** Port: infrastructure provides the implementation (e.g. Prisma). */
export interface CartRepository {
  findByUserId(userId: string): Promise<Cart | null>;
  save(cart: Cart): Promise<Cart>;
}

export const CART_REPOSITORY = Symbol('CART_REPOSITORY');
