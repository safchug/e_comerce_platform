import { Money } from '../../../domain/shared/money';
import {
  InvalidProductNameError,
  InvalidProductPriceError,
  InvalidSkuError,
  InvalidStockQuantityError,
} from './product.errors';

export interface ProductProps {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price: Money;
  active: boolean;
  stockQuantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductUpdates {
  name?: string;
  description?: string | null;
  price?: Money;
  active?: boolean;
  stockQuantity?: number;
}

/**
 * Plain domain entity: no framework or persistence concerns.
 *
 * SKU uniqueness is a cross-entity invariant and can't be checked here
 * without I/O - it's enforced by the application layer against the
 * repository (see CreateProductUseCase), the same pattern used for
 * unique-email checks in the user module.
 */
export class Product {
  private constructor(private readonly props: ProductProps) {}

  static create(props: ProductProps): Product {
    Product.validate(props);
    return new Product(props);
  }

  private static validate(props: ProductProps): void {
    if (!props.sku || props.sku.trim().length === 0) {
      throw new InvalidSkuError();
    }
    if (!props.name || props.name.trim().length === 0) {
      throw new InvalidProductNameError();
    }
    if (props.price.getCents() <= 0) {
      throw new InvalidProductPriceError();
    }
    if (!Number.isInteger(props.stockQuantity) || props.stockQuantity < 0) {
      throw new InvalidStockQuantityError();
    }
  }

  get id(): string {
    return this.props.id;
  }

  get sku(): string {
    return this.props.sku;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | null {
    return this.props.description;
  }

  get price(): Money {
    return this.props.price;
  }

  get active(): boolean {
    return this.props.active;
  }

  get stockQuantity(): number {
    return this.props.stockQuantity;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Returns a new, re-validated Product with the given fields changed.
   * SKU is deliberately not updatable here: it's the product's stable
   * identity/lookup key, so changing it is modeled as retiring the old
   * product and creating a new one, not an in-place edit.
   */
  update(changes: ProductUpdates): Product {
    const next: ProductProps = {
      ...this.props,
      ...(changes.name !== undefined ? { name: changes.name } : {}),
      ...(changes.description !== undefined
        ? { description: changes.description }
        : {}),
      ...(changes.price !== undefined ? { price: changes.price } : {}),
      ...(changes.active !== undefined ? { active: changes.active } : {}),
      ...(changes.stockQuantity !== undefined
        ? { stockQuantity: changes.stockQuantity }
        : {}),
      updatedAt: new Date(),
    };
    Product.validate(next);
    return new Product(next);
  }
}
