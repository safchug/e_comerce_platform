import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database';
import { CartModule } from '../cart';
import { ProductModule } from '../product';
import { ORDER_REPOSITORY } from './domain/order.repository';
import { PrismaOrderRepository } from './infrastructure/persistence/prisma-order.repository';
import { PlaceOrderUseCase } from './application/use-cases/place-order.use-case';
import { UpdateOrderStatusUseCase } from './application/use-cases/update-order-status.use-case';
import { OrderController } from './infrastructure/http/order.controller';

@Module({
  imports: [DatabaseModule, CartModule, ProductModule],
  controllers: [OrderController],
  providers: [
    { provide: ORDER_REPOSITORY, useClass: PrismaOrderRepository },
    PlaceOrderUseCase,
    UpdateOrderStatusUseCase,
  ],
})
export class OrderModule {}
