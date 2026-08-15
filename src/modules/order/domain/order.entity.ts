import { Money } from '../../../domain/shared/money';
import { EmptyCartError, InvalidQuantityError } from './order.errors';

export interface OrderItemProps {
  productId: string;
  quantity: number;
  /** Price at placement time - frozen, independent of the product's current price. */
  unitPrice: Money;
}

export interface OrderProps {
  id: string;
  userId: string;
  items: OrderItemProps[];
  subtotal: Money;
  discount: Money;
  taxRate: number;
  tax: Money;
  total: Money;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Plain domain entity: no framework or persistence concerns.
 *
 * Unlike Cart, an Order is a point-in-time snapshot: items, prices and
 * totals are fixed at placement time (see PlaceOrderUseCase) so a later
 * change to a product's price never alters a past order.
 */
export class Order {
  private constructor(private readonly props: OrderProps) {}

  static create(props: OrderProps): Order {
    Order.validate(props);
    return new Order(props);
  }

  private static validate(props: OrderProps): void {
    if (props.items.length === 0) {
      throw new EmptyCartError();
    }
    for (const item of props.items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new InvalidQuantityError();
      }
    }
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get items(): readonly OrderItemProps[] {
    return this.props.items;
  }

  get subtotal(): Money {
    return this.props.subtotal;
  }

  get discount(): Money {
    return this.props.discount;
  }

  get taxRate(): number {
    return this.props.taxRate;
  }

  get tax(): Money {
    return this.props.tax;
  }

  get total(): Money {
    return this.props.total;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
