import { Inject, Injectable } from '@nestjs/common';
import {
  type ProductRepository,
  PRODUCT_REPOSITORY,
} from '../../../product/domain/product.repository';
import {
  type CartRepository,
  CART_REPOSITORY,
} from '../../domain/cart.repository';
import { Cart } from '../../domain/cart.entity';
import {
  InactiveProductError,
  InsufficientStockError,
  ProductNotFoundError,
} from '../../domain/cart.errors';
import { GetOrCreateCartUseCase } from './get-or-create-cart.use-case';

export interface AddCartItemInput {
  userId: string;
  productId: string;
  quantity: number;
}

@Injectable()
export class AddCartItemUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepository: CartRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    private readonly getOrCreateCartUseCase: GetOrCreateCartUseCase,
  ) {}

  async execute({
    userId,
    productId,
    quantity,
  }: AddCartItemInput): Promise<Cart> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new ProductNotFoundError();
    }
    if (!product.active) {
      throw new InactiveProductError();
    }

    const cart = await this.getOrCreateCartUseCase.execute(userId);
    // Validate the merged quantity through the entity first, so an invalid
    // `quantity` fails with InvalidQuantityError rather than a stock error.
    const updated = cart.withItemAdded(productId, quantity);
    const totalRequested = updated.findItem(productId)!.quantity;
    if (totalRequested > product.stockQuantity) {
      throw new InsufficientStockError(product.stockQuantity, totalRequested);
    }

    return this.cartRepository.save(updated);
  }
}
