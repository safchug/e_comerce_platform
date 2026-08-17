import { OrderStatus } from './order-status.enum';

export class EmptyCartError extends Error {
  constructor() {
    super('Cannot place an order from an empty cart');
    this.name = 'EmptyCartError';
  }
}

export class InvalidQuantityError extends Error {
  constructor() {
    super('Quantity must be a positive integer');
    this.name = 'InvalidQuantityError';
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

/** Cross-aggregate invariant: checked against the product repository, then re-checked atomically inside the placement transaction. */
export class InsufficientStockError extends Error {
  constructor(available: number, requested: number) {
    super(
      `Only ${available} unit(s) in stock, but ${requested} were requested`,
    );
    this.name = 'InsufficientStockError';
  }
}

export class OrderNotFoundError extends Error {
  constructor() {
    super('Order not found');
    this.name = 'OrderNotFoundError';
  }
}

/** Enforces the order lifecycle FSM (see Order.ALLOWED_TRANSITIONS) - thrown on any transition not explicitly allowed. */
export class InvalidOrderStatusTransitionError extends Error {
  constructor(from: OrderStatus, to: OrderStatus) {
    super(`Cannot transition order from ${from} to ${to}`);
    this.name = 'InvalidOrderStatusTransitionError';
  }
}

/** Thrown when a status transition's precondition (the order's status at read time) no longer holds by write time - i.e. a concurrent update won the race. */
export class OrderConcurrentUpdateError extends Error {
  constructor() {
    super('Order was modified concurrently; please retry');
    this.name = 'OrderConcurrentUpdateError';
  }
}
