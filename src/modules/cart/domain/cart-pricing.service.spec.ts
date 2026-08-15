import { Money } from '../../../domain/shared/money';
import { CartPricingService, PricedCartLine } from './cart-pricing.service';
import {
  InvalidDiscountError,
  InvalidTaxRateError,
  MixedCurrencyCartError,
} from './cart.errors';

describe('CartPricingService', () => {
  describe('calculate', () => {
    it('returns an all-zero total for an empty cart', () => {
      const totals = CartPricingService.calculate({ lines: [], taxRate: 0.1 });

      expect(totals.subtotal.getCents()).toBe(0);
      expect(totals.discount.getCents()).toBe(0);
      expect(totals.taxableAmount.getCents()).toBe(0);
      expect(totals.tax.getCents()).toBe(0);
      expect(totals.total.getCents()).toBe(0);
      expect(totals.subtotal.getCurrency()).toBe('USD');
    });

    it('respects the given currency for an empty cart', () => {
      const totals = CartPricingService.calculate({
        lines: [],
        currency: 'EUR',
      });

      expect(totals.total.getCurrency()).toBe('EUR');
    });

    it('sums unit price x quantity across lines with no tax or discount', () => {
      const lines: PricedCartLine[] = [
        { productId: 'p1', unitPrice: Money.fromCents(1999), quantity: 2 },
        { productId: 'p2', unitPrice: Money.fromCents(500), quantity: 3 },
      ];

      const totals = CartPricingService.calculate({ lines });

      expect(totals.subtotal.getCents()).toBe(1999 * 2 + 500 * 3);
      expect(totals.discount.getCents()).toBe(0);
      expect(totals.tax.getCents()).toBe(0);
      expect(totals.total.getCents()).toBe(totals.subtotal.getCents());
    });

    it('applies a flat tax rate to the subtotal', () => {
      const lines: PricedCartLine[] = [
        { productId: 'p1', unitPrice: Money.fromCents(1000), quantity: 1 },
      ];

      const totals = CartPricingService.calculate({ lines, taxRate: 0.0825 });

      expect(totals.subtotal.getCents()).toBe(1000);
      expect(totals.tax.getCents()).toBe(83); // 82.5 -> rounds to 83
      expect(totals.total.getCents()).toBe(1083);
    });

    it('rounds fractional cents from tax to the nearest cent', () => {
      // 999 * 0.0825 = 82.4175 -> rounds down to 82
      const lines: PricedCartLine[] = [
        { productId: 'p1', unitPrice: Money.fromCents(999), quantity: 1 },
      ];

      const totals = CartPricingService.calculate({ lines, taxRate: 0.0825 });

      expect(totals.tax.getCents()).toBe(82);
      expect(totals.total.getCents()).toBe(1081);
    });

    it('applies a percentage discount to the subtotal before tax', () => {
      const lines: PricedCartLine[] = [
        { productId: 'p1', unitPrice: Money.fromCents(1000), quantity: 1 },
      ];

      const totals = CartPricingService.calculate({
        lines,
        taxRate: 0.1,
        discount: { type: 'percentage', percentOff: 15 },
      });

      expect(totals.discount.getCents()).toBe(150);
      expect(totals.taxableAmount.getCents()).toBe(850);
      expect(totals.tax.getCents()).toBe(85);
      expect(totals.total.getCents()).toBe(935);
    });

    it('rounds a percentage discount to the nearest cent', () => {
      const lines: PricedCartLine[] = [
        { productId: 'p1', unitPrice: Money.fromCents(1001), quantity: 1 },
      ];

      const totals = CartPricingService.calculate({
        lines,
        discount: { type: 'percentage', percentOff: 33.33 },
      });

      // 1001 * 0.3333 = 333.5... -> rounds to 334
      expect(totals.discount.getCents()).toBe(334);
    });

    it('applies a fixed-amount discount', () => {
      const lines: PricedCartLine[] = [
        { productId: 'p1', unitPrice: Money.fromCents(1000), quantity: 1 },
      ];

      const totals = CartPricingService.calculate({
        lines,
        discount: { type: 'fixed', amountOff: Money.fromCents(300) },
      });

      expect(totals.discount.getCents()).toBe(300);
      expect(totals.taxableAmount.getCents()).toBe(700);
      expect(totals.total.getCents()).toBe(700);
    });

    it('clamps a fixed discount that exceeds the subtotal instead of going negative', () => {
      const lines: PricedCartLine[] = [
        { productId: 'p1', unitPrice: Money.fromCents(500), quantity: 1 },
      ];

      const totals = CartPricingService.calculate({
        lines,
        taxRate: 0.1,
        discount: { type: 'fixed', amountOff: Money.fromCents(5000) },
      });

      expect(totals.discount.getCents()).toBe(500);
      expect(totals.taxableAmount.getCents()).toBe(0);
      expect(totals.tax.getCents()).toBe(0);
      expect(totals.total.getCents()).toBe(0);
    });

    it('applies both a discount and tax together, tax computed on the post-discount amount', () => {
      const lines: PricedCartLine[] = [
        { productId: 'p1', unitPrice: Money.fromCents(2000), quantity: 2 },
      ];

      const totals = CartPricingService.calculate({
        lines,
        taxRate: 0.2,
        discount: { type: 'percentage', percentOff: 25 },
      });

      expect(totals.subtotal.getCents()).toBe(4000);
      expect(totals.discount.getCents()).toBe(1000);
      expect(totals.taxableAmount.getCents()).toBe(3000);
      expect(totals.tax.getCents()).toBe(600);
      expect(totals.total.getCents()).toBe(3600);
    });

    it('defaults to zero tax and zero discount when neither is provided', () => {
      const lines: PricedCartLine[] = [
        { productId: 'p1', unitPrice: Money.fromCents(1234), quantity: 1 },
      ];

      const totals = CartPricingService.calculate({ lines });

      expect(totals.taxRate).toBe(0);
      expect(totals.discount.getCents()).toBe(0);
      expect(totals.total.getCents()).toBe(1234);
    });

    it('throws when the tax rate is negative', () => {
      const lines: PricedCartLine[] = [
        { productId: 'p1', unitPrice: Money.fromCents(1000), quantity: 1 },
      ];

      expect(() =>
        CartPricingService.calculate({ lines, taxRate: -0.05 }),
      ).toThrow(InvalidTaxRateError);
    });

    it('throws when the tax rate is not finite', () => {
      const lines: PricedCartLine[] = [
        { productId: 'p1', unitPrice: Money.fromCents(1000), quantity: 1 },
      ];

      expect(() =>
        CartPricingService.calculate({ lines, taxRate: Infinity }),
      ).toThrow(InvalidTaxRateError);
      expect(() =>
        CartPricingService.calculate({ lines, taxRate: NaN }),
      ).toThrow(InvalidTaxRateError);
    });

    it('throws when a percentage discount is out of the (0, 100] range', () => {
      const lines: PricedCartLine[] = [
        { productId: 'p1', unitPrice: Money.fromCents(1000), quantity: 1 },
      ];

      expect(() =>
        CartPricingService.calculate({
          lines,
          discount: { type: 'percentage', percentOff: 0 },
        }),
      ).toThrow(InvalidDiscountError);
      expect(() =>
        CartPricingService.calculate({
          lines,
          discount: { type: 'percentage', percentOff: 101 },
        }),
      ).toThrow(InvalidDiscountError);
      expect(() =>
        CartPricingService.calculate({
          lines,
          discount: { type: 'percentage', percentOff: -10 },
        }),
      ).toThrow(InvalidDiscountError);
    });

    it('throws when a fixed discount is zero or negative', () => {
      const lines: PricedCartLine[] = [
        { productId: 'p1', unitPrice: Money.fromCents(1000), quantity: 1 },
      ];

      expect(() =>
        CartPricingService.calculate({
          lines,
          discount: { type: 'fixed', amountOff: Money.fromCents(0) },
        }),
      ).toThrow(InvalidDiscountError);
    });

    it('throws when a fixed discount currency does not match the cart currency', () => {
      const lines: PricedCartLine[] = [
        {
          productId: 'p1',
          unitPrice: Money.fromCents(1000, 'USD'),
          quantity: 1,
        },
      ];

      expect(() =>
        CartPricingService.calculate({
          lines,
          discount: { type: 'fixed', amountOff: Money.fromCents(100, 'EUR') },
        }),
      ).toThrow(MixedCurrencyCartError);
    });

    it('throws when cart lines are priced in more than one currency', () => {
      const lines: PricedCartLine[] = [
        {
          productId: 'p1',
          unitPrice: Money.fromCents(1000, 'USD'),
          quantity: 1,
        },
        {
          productId: 'p2',
          unitPrice: Money.fromCents(500, 'EUR'),
          quantity: 1,
        },
      ];

      expect(() => CartPricingService.calculate({ lines })).toThrow(
        MixedCurrencyCartError,
      );
    });
  });
});
