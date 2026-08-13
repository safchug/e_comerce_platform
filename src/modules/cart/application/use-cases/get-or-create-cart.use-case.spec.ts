import { GetOrCreateCartUseCase } from './get-or-create-cart.use-case';
import { FakeCartRepository } from './test-doubles/fake-cart-repository';

describe('GetOrCreateCartUseCase', () => {
  let cartRepository: FakeCartRepository;
  let useCase: GetOrCreateCartUseCase;

  beforeEach(() => {
    cartRepository = new FakeCartRepository();
    useCase = new GetOrCreateCartUseCase(cartRepository);
  });

  it('creates and persists an empty cart when the user has none', async () => {
    const cart = await useCase.execute('user-1');

    expect(cart.userId).toBe('user-1');
    expect(cart.items).toHaveLength(0);
    expect(await cartRepository.findByUserId('user-1')).not.toBeNull();
  });

  it('returns the existing cart when one already exists', async () => {
    const existing = cartRepository.seed({ userId: 'user-1' });

    const cart = await useCase.execute('user-1');

    expect(cart.id).toBe(existing.id);
  });
});
