export class InvalidQuantityError extends Error {
  constructor() {
    super('Quantity must be a positive integer');
    this.name = 'InvalidQuantityError';
  }
}

export class CartItemNotFoundError extends Error {
  constructor() {
    super('No such item in the cart');
    this.name = 'CartItemNotFoundError';
  }
}

export class ProductNotFoundError extends Error {
  constructor() {
    super('Product not found');
    this.name = 'ProductNotFoundError';
  }
}

export class InactiveProductError extends Error {
  constructor() {
    super('Product is not available for purchase');
    this.name = 'InactiveProductError';
  }
}

/** Cross-aggregate invariant: checked against the product repository in the application layer. */
export class InsufficientStockError extends Error {
  constructor(available: number, requested: number) {
    super(
      `Only ${available} unit(s) in stock, but ${requested} were requested`,
    );
    this.name = 'InsufficientStockError';
  }
}

export class InvalidTaxRateError extends Error {
  constructor() {
    super('Tax rate must be a finite number that is not negative');
    this.name = 'InvalidTaxRateError';
  }
}

export class InvalidDiscountError extends Error {
  constructor() {
    super('Discount is invalid for this cart');
    this.name = 'InvalidDiscountError';
  }
}
