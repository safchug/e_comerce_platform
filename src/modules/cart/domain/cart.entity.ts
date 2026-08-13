import { CartItemNotFoundError, InvalidQuantityError } from './cart.errors';

export interface CartItemProps {
  productId: string;
  quantity: number;
}

export interface CartProps {
  id: string;
  userId: string;
  items: CartItemProps[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Plain domain entity: no framework or persistence concerns.
 *
 * Stock availability is a cross-aggregate invariant and can't be checked
 * here without I/O - it's enforced by the application layer against the
 * product repository (see AddCartItemUseCase / SetCartItemQuantityUseCase),
 * the same pattern used for SKU uniqueness in the product module.
 */
export class Cart {
  private constructor(private readonly props: CartProps) {}

  static create(props: CartProps): Cart {
    Cart.validate(props);
    return new Cart(props);
  }

  private static validate(props: CartProps): void {
    for (const item of props.items) {
      Cart.validateQuantity(item.quantity);
    }
  }

  private static validateQuantity(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new InvalidQuantityError();
    }
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get items(): readonly CartItemProps[] {
    return this.props.items;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  findItem(productId: string): CartItemProps | undefined {
    return this.props.items.find((item) => item.productId === productId);
  }

  /** Adds `quantity` units, merging into the existing line for that product if present. */
  withItemAdded(productId: string, quantity: number): Cart {
    Cart.validateQuantity(quantity);
    const existing = this.findItem(productId);
    const items = existing
      ? this.props.items.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        )
      : [...this.props.items, { productId, quantity }];
    return new Cart({ ...this.props, items, updatedAt: new Date() });
  }

  /** Sets the absolute quantity for an existing line - idempotent: repeating the same call is a no-op. */
  withItemQuantitySet(productId: string, quantity: number): Cart {
    Cart.validateQuantity(quantity);
    if (!this.findItem(productId)) {
      throw new CartItemNotFoundError();
    }
    const items = this.props.items.map((item) =>
      item.productId === productId ? { ...item, quantity } : item,
    );
    return new Cart({ ...this.props, items, updatedAt: new Date() });
  }

  /** Removing an absent item is a no-op, not an error - same end state either way (idempotent). */
  withItemRemoved(productId: string): Cart {
    const items = this.props.items.filter(
      (item) => item.productId !== productId,
    );
    return new Cart({ ...this.props, items, updatedAt: new Date() });
  }
}
