import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database';
import { PRODUCT_REPOSITORY } from './domain/product.repository';
import { PrismaProductRepository } from './infrastructure/persistence/prisma-product.repository';
import { CreateProductUseCase } from './application/use-cases/create-product.use-case';
import { UpdateProductUseCase } from './application/use-cases/update-product.use-case';
import { DeleteProductUseCase } from './application/use-cases/delete-product.use-case';
import { ListProductsUseCase } from './application/use-cases/list-products.use-case';
import { ListProductCategoriesUseCase } from './application/use-cases/list-product-categories.use-case';
import { ProductController } from './infrastructure/http/product.controller';
import { ProductCatalogController } from './infrastructure/http/product-catalog.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [ProductController, ProductCatalogController],
  providers: [
    { provide: PRODUCT_REPOSITORY, useClass: PrismaProductRepository },
    CreateProductUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
    ListProductsUseCase,
    ListProductCategoriesUseCase,
  ],
  exports: [PRODUCT_REPOSITORY],
})
export class ProductModule {}
