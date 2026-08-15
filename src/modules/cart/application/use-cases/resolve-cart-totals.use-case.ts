import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../../../infrastructure/config';
import {
  type ProductRepository,
  PRODUCT_REPOSITORY,
} from '../../../product/domain/product.repository';
import { Cart } from '../../domain/cart.entity';
import { ProductNotFoundError } from '../../domain/cart.errors';
import {
  CartDiscount,
  CartPricingService,
  CartTotals,
  PricedCartLine,
} from '../../domain/cart-pricing.service';

export interface ResolvedCartPricing {
  lines: PricedCartLine[];
  totals: CartTotals;
}

/**
 * Resolves the pricing/tax totals for a given Cart by looking up each line's
 * current product price. Kept separate from CartPricingService (the pure
 * domain calculation) so the I/O - fetching prices - stays in the
 * application layer, not the domain.
 */
@Injectable()
export class ResolveCartTotalsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  async execute(
    cart: Cart,
    discount?: CartDiscount,
  ): Promise<ResolvedCartPricing> {
    const productIds = cart.items.map((item) => item.productId);
    const products = await this.productRepository.findByIds(productIds);
    const productsById = new Map(
      products.map((product) => [product.id, product]),
    );

    const lines: PricedCartLine[] = cart.items.map((item) => {
      const product = productsById.get(item.productId);
      if (!product) {
        throw new ProductNotFoundError();
      }
      return {
        productId: item.productId,
        unitPrice: product.price,
        quantity: item.quantity,
      };
    });

    const { taxRate } = this.configService.get('pricing', { infer: true });
    const totals = CartPricingService.calculate({ lines, taxRate, discount });
    return { lines, totals };
  }
}
