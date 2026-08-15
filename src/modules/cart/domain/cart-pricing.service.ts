import { Money } from '../../../domain/shared/money';
import {
  InvalidDiscountError,
  InvalidTaxRateError,
  MixedCurrencyCartError,
} from './cart.errors';

export interface PricedCartLine {
  productId: string;
  unitPrice: Money;
  quantity: number;
}

export interface PercentageDiscount {
  type: 'percentage';
  /** 0 < percentOff <= 100 */
  percentOff: number;
}

export interface FixedDiscount {
  type: 'fixed';
  amountOff: Money;
}

export type CartDiscount = PercentageDiscount | FixedDiscount;

export interface CartTotals {
  subtotal: Money;
  discount: Money;
  taxableAmount: Money;
  taxRate: number;
  tax: Money;
  total: Money;
}

export interface CalculateCartTotalsInput {
  lines: PricedCartLine[];
  /** Fraction, e.g. 0.0825 for 8.25%. Applied to the post-discount amount. */
  taxRate?: number;
  discount?: CartDiscount;
  /** Currency for an empty cart, where no line is available to supply one. */
  currency?: string;
}

/**
 * Pure domain service: pricing/tax math only, no I/O or framework deps.
 * The Cart entity tracks productId/quantity, not price, so callers resolve
 * current unit prices (e.g. from the product repository) and pass them in
 * as `lines` - that keeps this service testable with plain Money values,
 * independent of persistence.
 */
export class CartPricingService {
  static calculate({
    lines,
    taxRate = 0,
    discount,
    currency = 'USD',
  }: CalculateCartTotalsInput): CartTotals {
    CartPricingService.assertValidTaxRate(taxRate);
    if (discount) {
      CartPricingService.assertValidDiscount(discount);
    }
    const resolvedCurrency = CartPricingService.resolveCurrency(
      lines,
      discount,
      currency,
    );

    const zero = Money.fromCents(0, resolvedCurrency);
    const subtotal = lines.reduce(
      (sum, line) => sum.add(line.unitPrice.multiply(line.quantity)),
      zero,
    );

    const discountAmount = CartPricingService.resolveDiscountAmount(
      subtotal,
      discount,
    );
    const taxableAmount = subtotal.subtract(discountAmount);
    const tax = taxableAmount.multiply(taxRate);
    const total = taxableAmount.add(tax);

    return {
      subtotal,
      discount: discountAmount,
      taxableAmount,
      taxRate,
      tax,
      total,
    };
  }

  /** All lines (and a fixed discount, if any) must share one currency - throws a clean domain error rather than letting Money's internal add/subtract check surface a raw Error. */
  private static resolveCurrency(
    lines: PricedCartLine[],
    discount: CartDiscount | undefined,
    fallbackCurrency: string,
  ): string {
    const currencies = new Set(
      lines.map((line) => line.unitPrice.getCurrency()),
    );
    if (discount?.type === 'fixed') {
      currencies.add(discount.amountOff.getCurrency());
    }
    if (currencies.size > 1) {
      throw new MixedCurrencyCartError();
    }
    const [onlyCurrency] = currencies;
    return onlyCurrency ?? fallbackCurrency;
  }

  private static assertValidTaxRate(taxRate: number): void {
    if (!Number.isFinite(taxRate) || taxRate < 0) {
      throw new InvalidTaxRateError();
    }
  }

  private static assertValidDiscount(discount: CartDiscount): void {
    if (
      discount.type === 'percentage' &&
      (!Number.isFinite(discount.percentOff) ||
        discount.percentOff <= 0 ||
        discount.percentOff > 100)
    ) {
      throw new InvalidDiscountError();
    }
    if (discount.type === 'fixed' && discount.amountOff.getCents() <= 0) {
      throw new InvalidDiscountError();
    }
  }

  private static resolveDiscountAmount(
    subtotal: Money,
    discount?: CartDiscount,
  ): Money {
    if (!discount) {
      return Money.fromCents(0, subtotal.getCurrency());
    }
    const rawAmount =
      discount.type === 'percentage'
        ? subtotal.multiply(discount.percentOff / 100)
        : discount.amountOff;

    // A discount can never exceed what's actually owed - clamp instead of
    // letting a large fixed discount push the taxable amount negative.
    return rawAmount.getCents() > subtotal.getCents() ? subtotal : rawAmount;
  }
}
