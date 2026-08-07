export class InvalidProductPriceError extends Error {
  constructor() {
    super('Product price must be greater than zero');
    this.name = 'InvalidProductPriceError';
  }
}

export class InvalidProductNameError extends Error {
  constructor() {
    super('Product name must not be empty');
    this.name = 'InvalidProductNameError';
  }
}

export class InvalidSkuError extends Error {
  constructor() {
    super('SKU must not be empty');
    this.name = 'InvalidSkuError';
  }
}

/** Cross-entity invariant: checked against the repository in the application layer. */
export class DuplicateSkuError extends Error {
  constructor(sku: string) {
    super(`A product with SKU "${sku}" already exists`);
    this.name = 'DuplicateSkuError';
  }
}

export class ProductNotFoundError extends Error {
  constructor() {
    super('Product not found');
    this.name = 'ProductNotFoundError';
  }
}
