import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../../../infrastructure/config';
import { ResolveCartTotalsUseCase } from './resolve-cart-totals.use-case';
import { FakeCartRepository } from './test-doubles/fake-cart-repository';
import { FakeProductRepository } from '../../../product/application/use-cases/test-doubles/fake-product-repository';
import { ProductNotFoundError } from '../../domain/cart.errors';
import { Money } from '../../../../domain/shared/money';

function fakeConfigService(taxRate: number): ConfigService<AppConfig, true> {
  return {
    get: () => ({ taxRate }),
  } as unknown as ConfigService<AppConfig, true>;
}

describe('ResolveCartTotalsUseCase', () => {
  let cartRepository: FakeCartRepository;
  let productRepository: FakeProductRepository;

  beforeEach(() => {
    cartRepository = new FakeCartRepository();
    productRepository = new FakeProductRepository();
  });

  it('returns an all-zero total for a cart with no items', async () => {
    const cart = cartRepository.seed({ items: [] });
    const useCase = new ResolveCartTotalsUseCase(
      productRepository,
      fakeConfigService(0.1),
    );

    const { totals, lines } = await useCase.execute(cart);

    expect(totals.subtotal.getCents()).toBe(0);
    expect(totals.total.getCents()).toBe(0);
    expect(lines).toHaveLength(0);
  });

  it('prices each line from the product repository and applies the configured tax rate', async () => {
    const product1 = productRepository.seed({ price: Money.fromCents(1000) });
    const product2 = productRepository.seed({ price: Money.fromCents(500) });
    const cart = cartRepository.seed({
      items: [
        { productId: product1.id, quantity: 2 },
        { productId: product2.id, quantity: 1 },
      ],
    });
    const useCase = new ResolveCartTotalsUseCase(
      productRepository,
      fakeConfigService(0.1),
    );

    const { totals, lines } = await useCase.execute(cart);

    expect(totals.subtotal.getCents()).toBe(1000 * 2 + 500);
    expect(totals.taxRate).toBe(0.1);
    expect(totals.tax.getCents()).toBe(250);
    expect(totals.total.getCents()).toBe(2750);
    expect(lines).toHaveLength(2);
    expect(lines[0].productId).toBe(product1.id);
    expect(lines[0].unitPrice.getCents()).toBe(1000);
    expect(lines[0].quantity).toBe(2);
  });

  it('applies a discount passed in when resolving totals', async () => {
    const product = productRepository.seed({ price: Money.fromCents(1000) });
    const cart = cartRepository.seed({
      items: [{ productId: product.id, quantity: 1 }],
    });
    const useCase = new ResolveCartTotalsUseCase(
      productRepository,
      fakeConfigService(0),
    );

    const { totals } = await useCase.execute(cart, {
      type: 'percentage',
      percentOff: 10,
    });

    expect(totals.discount.getCents()).toBe(100);
    expect(totals.total.getCents()).toBe(900);
  });

  it('throws when a cart line references a product that no longer exists', async () => {
    const cart = cartRepository.seed({
      items: [{ productId: 'missing-product', quantity: 1 }],
    });
    const useCase = new ResolveCartTotalsUseCase(
      productRepository,
      fakeConfigService(0),
    );

    await expect(useCase.execute(cart)).rejects.toThrow(ProductNotFoundError);
  });
});
