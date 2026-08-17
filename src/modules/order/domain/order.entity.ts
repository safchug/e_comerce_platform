import { Money } from '../../../domain/shared/money';
import {
  EmptyCartError,
  InvalidOrderStatusTransitionError,
  InvalidQuantityError,
} from './order.errors';
import { OrderStatus } from './order-status.enum';

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
  status: OrderStatus;
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
  /**
   * The order lifecycle as a table-driven finite state machine: each key
   * lists the statuses reachable directly from it. Delivered and Cancelled
   * are terminal - no key means no outbound transitions.
   */
  private static readonly ALLOWED_TRANSITIONS: Record<
    OrderStatus,
    readonly OrderStatus[]
  > = {
    [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
    [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED]: [],
  };

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

  get status(): OrderStatus {
    return this.props.status;
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

  /** Advances the order to `target`, or throws if that's not a legal move from the current status. */
  withStatus(target: OrderStatus): Order {
    const allowed = Order.ALLOWED_TRANSITIONS[this.props.status];
    if (!allowed.includes(target)) {
      throw new InvalidOrderStatusTransitionError(this.props.status, target);
    }
    return new Order({ ...this.props, status: target, updatedAt: new Date() });
  }
}
