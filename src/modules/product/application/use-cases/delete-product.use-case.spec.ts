import { DeleteProductUseCase } from './delete-product.use-case';
import { FakeProductRepository } from './test-doubles/fake-product-repository';
import { ProductNotFoundError } from '../../domain/product.errors';

describe('DeleteProductUseCase', () => {
  let productRepository: FakeProductRepository;
  let useCase: DeleteProductUseCase;

  beforeEach(() => {
    productRepository = new FakeProductRepository();
    useCase = new DeleteProductUseCase(productRepository);
  });

  it('deletes an existing product', async () => {
    const existing = productRepository.seed({});

    await useCase.execute(existing.id);

    expect(await productRepository.findById(existing.id)).toBeNull();
  });

  it('throws when the product does not exist', async () => {
    await expect(useCase.execute('missing-id')).rejects.toThrow(
      ProductNotFoundError,
    );
  });
});
