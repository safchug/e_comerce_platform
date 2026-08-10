import { Inject, Injectable } from '@nestjs/common';
import {
  type ProductRepository,
  PRODUCT_REPOSITORY,
} from '../../domain/product.repository';

@Injectable()
export class ListProductCategoriesUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(): Promise<string[]> {
    // Shoppers browse the live catalog only; a category that only appears
    // on inactive/retired SKUs shouldn't show up as a filter option.
    return this.productRepository.findDistinctCategories({ activeOnly: true });
  }
}
