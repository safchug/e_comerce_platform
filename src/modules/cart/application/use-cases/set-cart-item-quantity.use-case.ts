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
  CartItemNotFoundError,
  InactiveProductError,
  InsufficientStockError,
  ProductNotFoundError,
} from '../../domain/cart.errors';

export interface SetCartItemQuantityInput {
  userId: string;
  productId: string;
  quantity: number;
}

/** Sets the absolute quantity of an existing cart line - idempotent by design (see Cart.withItemQuantitySet). */
@Injectable()
export class SetCartItemQuantityUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepository: CartRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute({
    userId,
    productId,
    quantity,
  }: SetCartItemQuantityInput): Promise<Cart> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new CartItemNotFoundError();
    }
    // Validates the quantity and that the product is actually a line in this
    // cart before we bother checking the product/stock.
    const updated = cart.withItemQuantitySet(productId, quantity);

    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new ProductNotFoundError();
    }
    if (!product.active) {
      throw new InactiveProductError();
    }
    if (quantity > product.stockQuantity) {
      throw new InsufficientStockError(product.stockQuantity, quantity);
    }

    return this.cartRepository.save(updated);
  }
}
