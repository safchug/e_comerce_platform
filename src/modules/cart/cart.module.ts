import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database';
import { ProductModule } from '../product';
import { CART_REPOSITORY } from './domain/cart.repository';
import { PrismaCartRepository } from './infrastructure/persistence/prisma-cart.repository';
import { GetOrCreateCartUseCase } from './application/use-cases/get-or-create-cart.use-case';
import { AddCartItemUseCase } from './application/use-cases/add-cart-item.use-case';
import { SetCartItemQuantityUseCase } from './application/use-cases/set-cart-item-quantity.use-case';
import { RemoveCartItemUseCase } from './application/use-cases/remove-cart-item.use-case';
import { CartController } from './infrastructure/http/cart.controller';

@Module({
  imports: [DatabaseModule, ProductModule],
  controllers: [CartController],
  providers: [
    { provide: CART_REPOSITORY, useClass: PrismaCartRepository },
    GetOrCreateCartUseCase,
    AddCartItemUseCase,
    SetCartItemQuantityUseCase,
    RemoveCartItemUseCase,
  ],
})
export class CartModule {}
