import { Inject, Injectable } from '@nestjs/common';
import { Money } from '../../../../domain/shared/money';
import {
  type ProductRepository,
  PRODUCT_REPOSITORY,
} from '../../domain/product.repository';
import { Product } from '../../domain/product.entity';
import { ProductNotFoundError } from '../../domain/product.errors';

export interface UpdateProductInput {
  name?: string;
  description?: string | null;
  priceCents?: number;
  currency?: string;
  active?: boolean;
}

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(id: string, input: UpdateProductInput): Promise<Product> {
    const existing = await this.productRepository.findById(id);
    if (!existing) {
      throw new ProductNotFoundError();
    }

    const price =
      input.priceCents !== undefined
        ? Money.fromCents(
            input.priceCents,
            input.currency ?? existing.price.getCurrency(),
          )
        : undefined;

    const updated = existing.update({
      name: input.name,
      description: input.description,
      price,
      active: input.active,
    });

    return this.productRepository.save(updated);
  }
}
