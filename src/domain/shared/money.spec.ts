import { Money } from './money';

describe('Money', () => {
  describe('fromCents', () => {
    it('creates a Money instance from an integer cent amount', () => {
      const money = Money.fromCents(1050, 'usd');
      expect(money.getCents()).toBe(1050);
      expect(money.getCurrency()).toBe('USD');
    });

    it('throws when amount is not an integer', () => {
      expect(() => Money.fromCents(10.5)).toThrow(
        'Money amount must be an integer number of cents',
      );
    });

    it('throws when amount is negative', () => {
      expect(() => Money.fromCents(-100)).toThrow(
        'Money amount cannot be negative',
      );
    });
  });

  describe('fromDecimal', () => {
    it('converts a decimal amount to cents, rounding correctly', () => {
      expect(Money.fromDecimal(19.99).getCents()).toBe(1999);
      expect(Money.fromDecimal(0.005).getCents()).toBe(1);
    });
  });

  describe('add', () => {
    it('adds two Money values of the same currency', () => {
      const total = Money.fromCents(500).add(Money.fromCents(250));
      expect(total.getCents()).toBe(750);
    });

    it('throws when adding different currencies', () => {
      expect(() =>
        Money.fromCents(500, 'USD').add(Money.fromCents(250, 'EUR')),
      ).toThrow('Cannot operate on different currencies: USD vs EUR');
    });
  });

  describe('subtract', () => {
    it('subtracts two Money values of the same currency', () => {
      const remainder = Money.fromCents(500).subtract(Money.fromCents(200));
      expect(remainder.getCents()).toBe(300);
    });

    it('throws when the result would be negative', () => {
      expect(() => Money.fromCents(100).subtract(Money.fromCents(200))).toThrow(
        'Resulting amount cannot be negative',
      );
    });

    it('throws when subtracting different currencies', () => {
      expect(() =>
        Money.fromCents(500, 'USD').subtract(Money.fromCents(200, 'EUR')),
      ).toThrow('Cannot operate on different currencies: USD vs EUR');
    });
  });

  describe('multiply', () => {
    it('multiplies the amount by a factor, rounding to the nearest cent', () => {
      expect(Money.fromCents(300).multiply(1.5).getCents()).toBe(450);
    });
  });

  describe('equals', () => {
    it('returns true for equal amounts and currencies', () => {
      expect(
        Money.fromCents(500, 'USD').equals(Money.fromCents(500, 'USD')),
      ).toBe(true);
    });

    it('returns false for different amounts or currencies', () => {
      expect(
        Money.fromCents(500, 'USD').equals(Money.fromCents(600, 'USD')),
      ).toBe(false);
      expect(
        Money.fromCents(500, 'USD').equals(Money.fromCents(500, 'EUR')),
      ).toBe(false);
    });
  });

  describe('toDecimal', () => {
    it('converts cents back to a decimal amount', () => {
      expect(Money.fromCents(1999).toDecimal()).toBe(19.99);
    });
  });
});
