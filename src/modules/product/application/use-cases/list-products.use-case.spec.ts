import { ListProductsUseCase } from './list-products.use-case';
import { FakeProductRepository } from './test-doubles/fake-product-repository';
import { InvalidPriceRangeError } from '../../domain/product.errors';
import { Money } from '../../../../domain/shared/money';

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

  it('filters by a case-insensitive name substring', async () => {
    productRepository.seed({ name: 'Wireless Mouse' });
    productRepository.seed({ name: 'Wired Keyboard' });

    const result = await useCase.execute({ name: 'mouse' });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('Wireless Mouse');
  });

  it('filters by exact category', async () => {
    productRepository.seed({ category: 'Electronics' });
    productRepository.seed({ category: 'Furniture' });

    const result = await useCase.execute({ category: 'Furniture' });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].category).toBe('Furniture');
  });

  it('filters by price range (inclusive)', async () => {
    productRepository.seed({ price: Money.fromDecimal(10) });
    productRepository.seed({ price: Money.fromDecimal(20) });
    productRepository.seed({ price: Money.fromDecimal(30) });

    const result = await useCase.execute({
      minPriceCents: 1000,
      maxPriceCents: 2000,
    });

    expect(result.items).toHaveLength(2);
    expect(
      result.items.every(
        (product) =>
          product.price.getCents() >= 1000 && product.price.getCents() <= 2000,
      ),
    ).toBe(true);
  });

  it('combines name, category, and price filters', async () => {
    productRepository.seed({
      name: 'Wireless Mouse',
      category: 'Electronics',
      price: Money.fromDecimal(15),
    });
    productRepository.seed({
      name: 'Wireless Keyboard',
      category: 'Electronics',
      price: Money.fromDecimal(15),
    });
    productRepository.seed({
      name: 'Wireless Mouse',
      category: 'Furniture',
      price: Money.fromDecimal(15),
    });

    const result = await useCase.execute({
      name: 'mouse',
      category: 'Electronics',
      minPriceCents: 1000,
      maxPriceCents: 2000,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].category).toBe('Electronics');
  });

  it('rejects a price range where min is greater than max', async () => {
    await expect(
      useCase.execute({ minPriceCents: 2000, maxPriceCents: 1000 }),
    ).rejects.toThrow(InvalidPriceRangeError);
  });
});
