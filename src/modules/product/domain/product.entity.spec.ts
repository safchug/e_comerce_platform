import { Money } from '../../../domain/shared/money';
import { Product } from './product.entity';
import {
  InvalidProductCategoryError,
  InvalidProductNameError,
  InvalidProductPriceError,
  InvalidSkuError,
} from './product.errors';

describe('Product', () => {
  const validProps = () => ({
    id: 'product-1',
    sku: 'SKU-123',
    name: 'Widget',
    category: 'Electronics',
    description: 'A useful widget',
    price: Money.fromDecimal(19.99),
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  describe('create', () => {
    it('creates a product with valid props', () => {
      const product = Product.create(validProps());

      expect(product.sku).toBe('SKU-123');
      expect(product.name).toBe('Widget');
      expect(product.price.getCents()).toBe(1999);
      expect(product.active).toBe(true);
    });

    it('rejects a price of zero', () => {
      expect(() =>
        Product.create({ ...validProps(), price: Money.fromCents(0) }),
      ).toThrow(InvalidProductPriceError);
    });

    it('rejects a negative price', () => {
      expect(() =>
        Product.create({ ...validProps(), price: Money.fromDecimal(-5) }),
      ).toThrow();
    });

    it('rejects an empty SKU', () => {
      expect(() => Product.create({ ...validProps(), sku: '  ' })).toThrow(
        InvalidSkuError,
      );
    });

    it('rejects an empty name', () => {
      expect(() => Product.create({ ...validProps(), name: '' })).toThrow(
        InvalidProductNameError,
      );
    });

    it('rejects an empty category', () => {
      expect(() => Product.create({ ...validProps(), category: '  ' })).toThrow(
        InvalidProductCategoryError,
      );
    });
  });

  describe('update', () => {
    it('applies partial changes and re-validates', () => {
      const product = Product.create(validProps());

      const updated = product.update({ price: Money.fromDecimal(29.99) });

      expect(updated.price.getCents()).toBe(2999);
      expect(updated.name).toBe(product.name);
      expect(updated.sku).toBe(product.sku);
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        product.updatedAt.getTime(),
      );
    });

    it('rejects an update that would drop the price to zero', () => {
      const product = Product.create(validProps());

      expect(() => product.update({ price: Money.fromCents(0) })).toThrow(
        InvalidProductPriceError,
      );
    });

    it('applies a category change', () => {
      const product = Product.create(validProps());

      const updated = product.update({ category: 'Home & Garden' });

      expect(updated.category).toBe('Home & Garden');
    });

    it('rejects an update that would empty the category', () => {
      const product = Product.create(validProps());

      expect(() => product.update({ category: '' })).toThrow(
        InvalidProductCategoryError,
      );
    });

    it('leaves unspecified fields unchanged', () => {
      const product = Product.create(validProps());

      const updated = product.update({ active: false });

      expect(updated.active).toBe(false);
      expect(updated.name).toBe(product.name);
      expect(updated.description).toBe(product.description);
      expect(updated.price.equals(product.price)).toBe(true);
    });
  });
});
