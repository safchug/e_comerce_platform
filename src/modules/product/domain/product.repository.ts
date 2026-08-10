import { Product } from './product.entity';

export interface FindAllParams {
  skip: number;
  take: number;
  activeOnly?: boolean;
  /** Case-insensitive substring match against product name. */
  name?: string;
  /** Exact match against product category. */
  category?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
}

export interface FindAllResult {
  items: Product[];
  total: number;
}

/** Port: infrastructure provides the implementation (e.g. Prisma). */
export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  findBySku(sku: string): Promise<Product | null>;
  /** Single page of products plus the total matching count (2 queries, not N+1). */
  findAll(params: FindAllParams): Promise<FindAllResult>;
  save(product: Product): Promise<Product>;
  delete(id: string): Promise<void>;
}

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');
