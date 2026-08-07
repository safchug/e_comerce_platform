import { CreateProductUseCase } from './create-product.use-case';
import { FakeProductRepository } from './test-doubles/fake-product-repository';
import { DuplicateSkuError } from '../../domain/product.errors';

describe('CreateProductUseCase', () => {
  let productRepository: FakeProductRepository;
  let useCase: CreateProductUseCase;

  beforeEach(() => {
    productRepository = new FakeProductRepository();
    useCase = new CreateProductUseCase(productRepository);
  });

  it('creates a new product', async () => {
    const product = await useCase.execute({
      sku: 'SKU-1',
      name: 'Widget',
      priceCents: 1999,
    });

    expect(product.sku).toBe('SKU-1');
    expect(product.name).toBe('Widget');
    expect(product.price.getCents()).toBe(1999);
    expect(product.active).toBe(true);
  });

  it('persists the product so it can be found by SKU afterwards', async () => {
    await useCase.execute({ sku: 'SKU-1', name: 'Widget', priceCents: 1999 });

    const found = await productRepository.findBySku('SKU-1');
    expect(found).not.toBeNull();
  });

  it('rejects creation when the SKU is already taken', async () => {
    productRepository.seed({ sku: 'SKU-1' });

    await expect(
      useCase.execute({ sku: 'SKU-1', name: 'Widget', priceCents: 1999 }),
    ).rejects.toThrow(DuplicateSkuError);
  });

  it('rejects an invalid price via domain validation, not just DTO validation', async () => {
    await expect(
      useCase.execute({ sku: 'SKU-2', name: 'Widget', priceCents: 0 }),
    ).rejects.toThrow();
  });
});
