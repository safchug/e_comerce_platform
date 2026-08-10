import { Inject, Injectable } from '@nestjs/common';
import {
  type ProductRepository,
  PRODUCT_REPOSITORY,
} from '../../domain/product.repository';
import { Product } from '../../domain/product.entity';

export interface ListProductsInput {
  page?: number;
  limit?: number;
}

export interface ListProductsResult {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class ListProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(input: ListProductsInput = {}): Promise<ListProductsResult> {
    const page = Math.max(input.page ?? DEFAULT_PAGE, 1);
    const limit = Math.min(
      Math.max(input.limit ?? DEFAULT_LIMIT, 1),
      MAX_LIMIT,
    );

    const { items, total } = await this.productRepository.findAll({
      skip: (page - 1) * limit,
      take: limit,
      // Shoppers browse the live catalog only; inactive/retired SKUs stay admin-only.
      activeOnly: true,
    });

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
