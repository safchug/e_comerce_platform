import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  type CartRepository,
  CART_REPOSITORY,
} from '../../domain/cart.repository';
import { Cart } from '../../domain/cart.entity';

@Injectable()
export class GetOrCreateCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepository: CartRepository,
  ) {}

  async execute(userId: string): Promise<Cart> {
    const existing = await this.cartRepository.findByUserId(userId);
    if (existing) {
      return existing;
    }

    const now = new Date();
    const cart = Cart.create({
      id: randomUUID(),
      userId,
      items: [],
      createdAt: now,
      updatedAt: now,
    });
    return this.cartRepository.save(cart);
  }
}
