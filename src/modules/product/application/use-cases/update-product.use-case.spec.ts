import { UpdateProductUseCase } from './update-product.use-case';
import { FakeProductRepository } from './test-doubles/fake-product-repository';
import { ProductNotFoundError } from '../../domain/product.errors';

describe('UpdateProductUseCase', () => {
  let productRepository: FakeProductRepository;
  let useCase: UpdateProductUseCase;

  beforeEach(() => {
    productRepository = new FakeProductRepository();
    useCase = new UpdateProductUseCase(productRepository);
  });

  it('updates the given fields and leaves the rest unchanged', async () => {
    const existing = productRepository.seed({ name: 'Widget', sku: 'SKU-1' });

    const updated = await useCase.execute(existing.id, {
      name: 'New Widget',
    });

    expect(updated.name).toBe('New Widget');
    expect(updated.sku).toBe('SKU-1');
  });

  it('updates the price via priceCents', async () => {
    const existing = productRepository.seed({});

    const updated = await useCase.execute(existing.id, { priceCents: 5000 });

    expect(updated.price.getCents()).toBe(5000);
  });

  it('throws when the product does not exist', async () => {
    await expect(useCase.execute('missing-id', { name: 'X' })).rejects.toThrow(
      ProductNotFoundError,
    );
  });

  it('rejects an update that would make the price invalid (domain validation)', async () => {
    const existing = productRepository.seed({});

    await expect(
      useCase.execute(existing.id, { priceCents: 0 }),
    ).rejects.toThrow();
  });
});
