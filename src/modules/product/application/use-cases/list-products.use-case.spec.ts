import { ListProductsUseCase } from './list-products.use-case';
import { FakeProductRepository } from './test-doubles/fake-product-repository';

describe('ListProductsUseCase', () => {
  let productRepository: FakeProductRepository;
  let useCase: ListProductsUseCase;

  beforeEach(() => {
    productRepository = new FakeProductRepository();
    useCase = new ListProductsUseCase(productRepository);
  });

  it('defaults to page 1 with a limit of 20', async () => {
    for (let i = 0; i < 25; i++) {
      productRepository.seed({});
    }

    const result = await useCase.execute();

    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.items).toHaveLength(20);
    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(2);
  });

  it('returns the requested page', async () => {
    for (let i = 0; i < 25; i++) {
      productRepository.seed({});
    }

    const result = await useCase.execute({ page: 2, limit: 20 });

    expect(result.items).toHaveLength(5);
    expect(result.page).toBe(2);
  });

  it('excludes inactive products from the shopper catalog', async () => {
    productRepository.seed({ active: true });
    productRepository.seed({ active: false });

    const result = await useCase.execute();

    expect(result.total).toBe(1);
    expect(result.items.every((product) => product.active)).toBe(true);
  });

  it('clamps limit to the maximum of 100', async () => {
    const result = await useCase.execute({ limit: 500 });

    expect(result.limit).toBe(100);
  });

  it('treats a non-positive page as page 1', async () => {
    const result = await useCase.execute({ page: 0 });

    expect(result.page).toBe(1);
  });
});
