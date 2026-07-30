export class Money {
  private constructor(
    private readonly amountInCents: number,
    private readonly currency: string,
  ) {}

  static fromCents(amountInCents: number, currency = 'USD'): Money {
    if (!Number.isInteger(amountInCents)) {
      throw new Error('Money amount must be an integer number of cents');
    }
    if (amountInCents < 0) {
      throw new Error('Money amount cannot be negative');
    }
    return new Money(amountInCents, currency.toUpperCase());
  }

  static fromDecimal(amount: number, currency = 'USD'): Money {
    return Money.fromCents(Math.round(amount * 100), currency);
  }

  getCents(): number {
    return this.amountInCents;
  }

  getCurrency(): string {
    return this.currency;
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.fromCents(
      this.amountInCents + other.amountInCents,
      this.currency,
    );
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    const result = this.amountInCents - other.amountInCents;
    if (result < 0) {
      throw new Error('Resulting amount cannot be negative');
    }
    return Money.fromCents(result, this.currency);
  }

  multiply(factor: number): Money {
    return Money.fromCents(
      Math.round(this.amountInCents * factor),
      this.currency,
    );
  }

  equals(other: Money): boolean {
    return (
      this.amountInCents === other.amountInCents &&
      this.currency === other.currency
    );
  }

  toDecimal(): number {
    return this.amountInCents / 100;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(
        `Cannot operate on different currencies: ${this.currency} vs ${other.currency}`,
      );
    }
  }
}
