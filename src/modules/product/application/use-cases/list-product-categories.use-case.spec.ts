import { ListProductCategoriesUseCase } from './list-product-categories.use-case';
import { FakeProductRepository } from './test-doubles/fake-product-repository';

describe('ListProductCategoriesUseCase', () => {
  let productRepository: FakeProductRepository;
  let useCase: ListProductCategoriesUseCase;

  beforeEach(() => {
    productRepository = new FakeProductRepository();
    useCase = new ListProductCategoriesUseCase(productRepository);
  });

  it('returns distinct categories sorted alphabetically', async () => {
    productRepository.seed({ category: 'Electronics' });
    productRepository.seed({ category: 'Books' });
    productRepository.seed({ category: 'Electronics' });

    const categories = await useCase.execute();

    expect(categories).toEqual(['Books', 'Electronics']);
  });

  it('excludes categories that only appear on inactive products', async () => {
    productRepository.seed({ category: 'Electronics', active: true });
    productRepository.seed({ category: 'Discontinued', active: false });

    const categories = await useCase.execute();

    expect(categories).toEqual(['Electronics']);
  });

  it('returns an empty array when there are no products', async () => {
    const categories = await useCase.execute();

    expect(categories).toEqual([]);
  });
});
