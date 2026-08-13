import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Money } from '../../../../domain/shared/money';
import {
  type ProductRepository,
  PRODUCT_REPOSITORY,
} from '../../domain/product.repository';
import { Product } from '../../domain/product.entity';
import { DuplicateSkuError } from '../../domain/product.errors';

export interface CreateProductInput {
  sku: string;
  name: string;
  description?: string | null;
  priceCents: number;
  currency?: string;
  active?: boolean;
  stockQuantity?: number;
}

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(input: CreateProductInput): Promise<Product> {
    const existing = await this.productRepository.findBySku(input.sku);
    if (existing) {
      throw new DuplicateSkuError(input.sku);
    }

    const now = new Date();
    const product = Product.create({
      id: randomUUID(),
      sku: input.sku,
      name: input.name,
      description: input.description ?? null,
      price: Money.fromCents(input.priceCents, input.currency),
      active: input.active ?? true,
      stockQuantity: input.stockQuantity ?? 0,
      createdAt: now,
      updatedAt: now,
    });

    return this.productRepository.save(product);
  }
}
