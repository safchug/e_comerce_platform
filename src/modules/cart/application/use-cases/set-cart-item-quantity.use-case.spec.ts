import { SetCartItemQuantityUseCase } from './set-cart-item-quantity.use-case';
import { FakeCartRepository } from './test-doubles/fake-cart-repository';
import { FakeProductRepository } from '../../../product/application/use-cases/test-doubles/fake-product-repository';
import {
  CartItemNotFoundError,
  InactiveProductError,
  InsufficientStockError,
} from '../../domain/cart.errors';

describe('SetCartItemQuantityUseCase', () => {
  let cartRepository: FakeCartRepository;
  let productRepository: FakeProductRepository;
  let useCase: SetCartItemQuantityUseCase;

  beforeEach(() => {
    cartRepository = new FakeCartRepository();
    productRepository = new FakeProductRepository();
    useCase = new SetCartItemQuantityUseCase(cartRepository, productRepository);
  });

  it('overwrites the quantity of an existing line', async () => {
    const product = productRepository.seed({ stockQuantity: 10 });
    cartRepository.seed({
      userId: 'user-1',
      items: [{ productId: product.id, quantity: 2 }],
    });

    const cart = await useCase.execute({
      userId: 'user-1',
      productId: product.id,
      quantity: 7,
    });

    expect(cart.findItem(product.id)?.quantity).toBe(7);
  });

  it('is idempotent: repeating the same call yields the same state', async () => {
    const product = productRepository.seed({ stockQuantity: 10 });
    cartRepository.seed({
      userId: 'user-1',
      items: [{ productId: product.id, quantity: 2 }],
    });

    await useCase.execute({
      userId: 'user-1',
      productId: product.id,
      quantity: 5,
    });
    const cart = await useCase.execute({
      userId: 'user-1',
      productId: product.id,
      quantity: 5,
    });

    expect(cart.findItem(product.id)?.quantity).toBe(5);
  });

  it('throws when the user has no cart', async () => {
    await expect(
      useCase.execute({
        userId: 'user-1',
        productId: 'product-1',
        quantity: 1,
      }),
    ).rejects.toThrow(CartItemNotFoundError);
  });

  it('throws when the product is not in the cart', async () => {
    cartRepository.seed({ userId: 'user-1', items: [] });

    await expect(
      useCase.execute({
        userId: 'user-1',
        productId: 'product-1',
        quantity: 1,
      }),
    ).rejects.toThrow(CartItemNotFoundError);
  });

  it('rejects when the product is inactive', async () => {
    const product = productRepository.seed({
      active: false,
      stockQuantity: 10,
    });
    cartRepository.seed({
      userId: 'user-1',
      items: [{ productId: product.id, quantity: 2 }],
    });

    await expect(
      useCase.execute({ userId: 'user-1', productId: product.id, quantity: 3 }),
    ).rejects.toThrow(InactiveProductError);
  });

  it('rejects a quantity above available stock', async () => {
    const product = productRepository.seed({ stockQuantity: 3 });
    cartRepository.seed({
      userId: 'user-1',
      items: [{ productId: product.id, quantity: 2 }],
    });

    await expect(
      useCase.execute({ userId: 'user-1', productId: product.id, quantity: 4 }),
    ).rejects.toThrow(InsufficientStockError);
  });
});
