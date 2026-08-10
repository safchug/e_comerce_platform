import {
  FindAllParams,
  FindAllResult,
  ProductRepository,
  PRODUCT_REPOSITORY,
} from '../../../domain/product.repository';
import { Product } from '../../../domain/product.entity';
import { Money } from '../../../../../domain/shared/money';

/** In-memory fake used across use-case unit tests (no I/O). */
export class FakeProductRepository implements ProductRepository {
  private readonly productsById = new Map<string, Product>();

  findById(id: string): Promise<Product | null> {
    return Promise.resolve(this.productsById.get(id) ?? null);
  }

  findBySku(sku: string): Promise<Product | null> {
    for (const product of this.productsById.values()) {
      if (product.sku === sku) {
        return Promise.resolve(product);
      }
    }
    return Promise.resolve(null);
  }

  findAll({
    skip,
    take,
    activeOnly,
    name,
    category,
    minPriceCents,
    maxPriceCents,
  }: FindAllParams): Promise<FindAllResult> {
    const needle = name?.trim().toLowerCase();
    const all = [...this.productsById.values()]
      .filter((product) => !activeOnly || product.active)
      .filter(
        (product) => !needle || product.name.toLowerCase().includes(needle),
      )
      .filter((product) => !category || product.category === category)
      .filter(
        (product) =>
          minPriceCents === undefined ||
          product.price.getCents() >= minPriceCents,
      )
      .filter(
        (product) =>
          maxPriceCents === undefined ||
          product.price.getCents() <= maxPriceCents,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return Promise.resolve({
      items: all.slice(skip, skip + take),
      total: all.length,
    });
  }

  findDistinctCategories({
    activeOnly,
  }: {
    activeOnly?: boolean;
  }): Promise<string[]> {
    const categories = new Set(
      [...this.productsById.values()]
        .filter((product) => !activeOnly || product.active)
        .map((product) => product.category),
    );
    return Promise.resolve([...categories].sort());
  }

  save(product: Product): Promise<Product> {
    this.productsById.set(product.id, product);
    return Promise.resolve(product);
  }

  delete(id: string): Promise<void> {
    this.productsById.delete(id);
    return Promise.resolve();
  }

  seed(overrides: Partial<Parameters<typeof Product.create>[0]> = {}): Product {
    const now = new Date();
    const product = Product.create({
      id: overrides.id ?? `product-${this.productsById.size + 1}`,
      sku: overrides.sku ?? `SKU-${this.productsById.size + 1}`,
      name: overrides.name ?? `Product ${this.productsById.size + 1}`,
      category: overrides.category ?? 'General',
      description: overrides.description ?? null,
      price: overrides.price ?? Money.fromDecimal(9.99),
      active: overrides.active ?? true,
      createdAt: overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
    });
    this.productsById.set(product.id, product);
    return product;
  }
}

export { PRODUCT_REPOSITORY };
