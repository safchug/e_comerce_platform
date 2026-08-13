import { AddCartItemUseCase } from './add-cart-item.use-case';
import { GetOrCreateCartUseCase } from './get-or-create-cart.use-case';
import { FakeCartRepository } from './test-doubles/fake-cart-repository';
import { FakeProductRepository } from '../../../product/application/use-cases/test-doubles/fake-product-repository';
import {
  InactiveProductError,
  InsufficientStockError,
  InvalidQuantityError,
  ProductNotFoundError,
} from '../../domain/cart.errors';

describe('AddCartItemUseCase', () => {
  let cartRepository: FakeCartRepository;
  let productRepository: FakeProductRepository;
  let useCase: AddCartItemUseCase;

  beforeEach(() => {
    cartRepository = new FakeCartRepository();
    productRepository = new FakeProductRepository();
    useCase = new AddCartItemUseCase(
      cartRepository,
      productRepository,
      new GetOrCreateCartUseCase(cartRepository),
    );
  });

  it('adds a product to a new cart', async () => {
    const product = productRepository.seed({ stockQuantity: 5 });

    const cart = await useCase.execute({
      userId: 'user-1',
      productId: product.id,
      quantity: 2,
    });

    expect(cart.findItem(product.id)?.quantity).toBe(2);
  });

  it('merges quantity into an existing line on repeated adds', async () => {
    const product = productRepository.seed({ stockQuantity: 5 });

    await useCase.execute({
      userId: 'user-1',
      productId: product.id,
      quantity: 2,
    });
    const cart = await useCase.execute({
      userId: 'user-1',
      productId: product.id,
      quantity: 1,
    });

    expect(cart.findItem(product.id)?.quantity).toBe(3);
  });

  it('rejects when the product does not exist', async () => {
    await expect(
      useCase.execute({ userId: 'user-1', productId: 'missing', quantity: 1 }),
    ).rejects.toThrow(ProductNotFoundError);
  });

  it('rejects when the product is inactive', async () => {
    const product = productRepository.seed({ active: false, stockQuantity: 5 });

    await expect(
      useCase.execute({ userId: 'user-1', productId: product.id, quantity: 1 }),
    ).rejects.toThrow(InactiveProductError);
  });

  it('rejects when the requested quantity exceeds available stock', async () => {
    const product = productRepository.seed({ stockQuantity: 2 });

    await expect(
      useCase.execute({ userId: 'user-1', productId: product.id, quantity: 3 }),
    ).rejects.toThrow(InsufficientStockError);
  });

  it('rejects when the merged quantity across two adds exceeds stock', async () => {
    const product = productRepository.seed({ stockQuantity: 2 });
    await useCase.execute({
      userId: 'user-1',
      productId: product.id,
      quantity: 2,
    });

    await expect(
      useCase.execute({ userId: 'user-1', productId: product.id, quantity: 1 }),
    ).rejects.toThrow(InsufficientStockError);
  });

  it('rejects a non-positive quantity via domain validation', async () => {
    const product = productRepository.seed({ stockQuantity: 5 });

    await expect(
      useCase.execute({ userId: 'user-1', productId: product.id, quantity: 0 }),
    ).rejects.toThrow(InvalidQuantityError);
  });
});
