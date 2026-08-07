import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database';
import { PRODUCT_REPOSITORY } from './domain/product.repository';
import { PrismaProductRepository } from './infrastructure/persistence/prisma-product.repository';
import { CreateProductUseCase } from './application/use-cases/create-product.use-case';
import { UpdateProductUseCase } from './application/use-cases/update-product.use-case';
import { DeleteProductUseCase } from './application/use-cases/delete-product.use-case';
import { ProductController } from './infrastructure/http/product.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [ProductController],
  providers: [
    { provide: PRODUCT_REPOSITORY, useClass: PrismaProductRepository },
    CreateProductUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
  ],
  exports: [PRODUCT_REPOSITORY],
})
export class ProductModule {}
