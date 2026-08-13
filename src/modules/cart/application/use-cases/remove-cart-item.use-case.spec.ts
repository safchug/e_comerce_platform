import { RemoveCartItemUseCase } from './remove-cart-item.use-case';
import { FakeCartRepository } from './test-doubles/fake-cart-repository';

describe('RemoveCartItemUseCase', () => {
  let cartRepository: FakeCartRepository;
  let useCase: RemoveCartItemUseCase;

  beforeEach(() => {
    cartRepository = new FakeCartRepository();
    useCase = new RemoveCartItemUseCase(cartRepository);
  });

  it('removes an existing line from the cart', async () => {
    cartRepository.seed({
      userId: 'user-1',
      items: [{ productId: 'product-1', quantity: 2 }],
    });

    await useCase.execute('user-1', 'product-1');

    const cart = await cartRepository.findByUserId('user-1');
    expect(cart?.findItem('product-1')).toBeUndefined();
  });

  it('is a no-op when the product is not in the cart', async () => {
    cartRepository.seed({ userId: 'user-1', items: [] });

    await expect(
      useCase.execute('user-1', 'product-1'),
    ).resolves.toBeUndefined();
  });

  it('is a no-op when the user has no cart at all', async () => {
    await expect(
      useCase.execute('user-1', 'product-1'),
    ).resolves.toBeUndefined();
  });
});
