import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../../../infrastructure/config';
import { PlaceOrderUseCase } from './place-order.use-case';
import { FakeOrderRepository } from './test-doubles/fake-order-repository';
import { FakeCartRepository } from '../../../cart/application/use-cases/test-doubles/fake-cart-repository';
import { FakeProductRepository } from '../../../product/application/use-cases/test-doubles/fake-product-repository';
import {
  EmptyCartError,
  InactiveProductError,
  InsufficientStockError,
  ProductNotFoundError,
} from '../../domain/order.errors';
import { Money } from '../../../../domain/shared/money';

function fakeConfigService(taxRate: number): ConfigService<AppConfig, true> {
  return {
    get: () => ({ taxRate }),
  } as unknown as ConfigService<AppConfig, true>;
}

describe('PlaceOrderUseCase', () => {
  let cartRepository: FakeCartRepository;
  let productRepository: FakeProductRepository;
  let orderRepository: FakeOrderRepository;

  beforeEach(() => {
    cartRepository = new FakeCartRepository();
    productRepository = new FakeProductRepository();
    orderRepository = new FakeOrderRepository();
  });

  function makeUseCase(taxRate = 0): PlaceOrderUseCase {
    return new PlaceOrderUseCase(
      cartRepository,
      productRepository,
      orderRepository,
      fakeConfigService(taxRate),
    );
  }

  it('prices the cart lines and hands a priced order to the repository, keyed to the source cart', async () => {
    const product1 = productRepository.seed({
      price: Money.fromCents(1000),
      stockQuantity: 5,
    });
    const product2 = productRepository.seed({
      price: Money.fromCents(500),
      stockQuantity: 5,
    });
    const cart = cartRepository.seed({
      userId: 'user-1',
      items: [
        { productId: product1.id, quantity: 2 },
        { productId: product2.id, quantity: 1 },
      ],
    });

    const order = await makeUseCase(0.1).execute('user-1');

    expect(order.userId).toBe('user-1');
    expect(order.items).toHaveLength(2);
    expect(order.subtotal.getCents()).toBe(1000 * 2 + 500);
    expect(order.tax.getCents()).toBe(250);
    expect(order.total.getCents()).toBe(2750);
    expect(orderRepository.placedOrders).toEqual([order]);
    expect(orderRepository.clearedCartIds).toEqual([cart.id]);
  });

  it('rejects when the user has no cart', async () => {
    await expect(makeUseCase().execute('user-1')).rejects.toThrow(
      EmptyCartError,
    );
    expect(orderRepository.placedOrders).toHaveLength(0);
  });

  it('rejects when the cart has no items', async () => {
    cartRepository.seed({ userId: 'user-1', items: [] });

    await expect(makeUseCase().execute('user-1')).rejects.toThrow(
      EmptyCartError,
    );
  });

  it('rejects when a cart line references a product that no longer exists', async () => {
    cartRepository.seed({
      userId: 'user-1',
      items: [{ productId: 'missing-product', quantity: 1 }],
    });

    await expect(makeUseCase().execute('user-1')).rejects.toThrow(
      ProductNotFoundError,
    );
  });

  it('rejects when a cart line is now inactive', async () => {
    const product = productRepository.seed({ active: false, stockQuantity: 5 });
    cartRepository.seed({
      userId: 'user-1',
      items: [{ productId: product.id, quantity: 1 }],
    });

    await expect(makeUseCase().execute('user-1')).rejects.toThrow(
      InactiveProductError,
    );
  });

  it('rejects when the requested quantity now exceeds available stock', async () => {
    const product = productRepository.seed({ stockQuantity: 1 });
    cartRepository.seed({
      userId: 'user-1',
      items: [{ productId: product.id, quantity: 2 }],
    });

    await expect(makeUseCase().execute('user-1')).rejects.toThrow(
      InsufficientStockError,
    );
  });

  it('propagates InsufficientStockError raised by the repository when the transaction loses a stock race', async () => {
    const product = productRepository.seed({ stockQuantity: 5 });
    cartRepository.seed({
      userId: 'user-1',
      items: [{ productId: product.id, quantity: 2 }],
    });
    orderRepository.failNextPlacementWith(new InsufficientStockError(0, 2));

    await expect(makeUseCase().execute('user-1')).rejects.toThrow(
      InsufficientStockError,
    );
  });
});
