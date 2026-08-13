import { Inject, Injectable } from '@nestjs/common';
import {
  type CartRepository,
  CART_REPOSITORY,
} from '../../domain/cart.repository';

/** Removing an item that isn't in the cart is a no-op, not an error - idempotent by design. */
@Injectable()
export class RemoveCartItemUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepository: CartRepository,
  ) {}

  async execute(userId: string, productId: string): Promise<void> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      return;
    }

    const updated = cart.withItemRemoved(productId);
    await this.cartRepository.save(updated);
  }
}
