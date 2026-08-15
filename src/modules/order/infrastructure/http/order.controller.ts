import { Controller, Post, UseFilters, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../user/infrastructure/http/guards/jwt-auth.guard';
import { CurrentUser } from '../../../user/infrastructure/http/decorators/current-user.decorator';
import { type AccessTokenPayload } from '../../../user/application/ports/token.service.port';
import { ErrorResponseDto } from '../../../../infrastructure/http/dto/error-response.dto';
import { PlaceOrderUseCase } from '../../application/use-cases/place-order.use-case';
import { OrderDomainExceptionFilter } from './order-domain-exception.filter';
import { OrderResponseDto, toOrderResponseDto } from './dto/order-response.dto';

@ApiTags('orders')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing or invalid access token',
  type: ErrorResponseDto,
})
@Controller('orders')
@UseFilters(OrderDomainExceptionFilter)
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly placeOrderUseCase: PlaceOrderUseCase) {}

  @Post()
  @ApiOperation({ summary: "Place an order from the current user's cart" })
  @ApiCreatedResponse({
    description: 'The placed order',
    type: OrderResponseDto,
  })
  @ApiConflictResponse({
    description:
      'Cart is empty, a product is inactive, or a requested quantity exceeds stock',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'A product in the cart no longer exists',
    type: ErrorResponseDto,
  })
  async placeOrder(
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<OrderResponseDto> {
    const order = await this.placeOrderUseCase.execute(user.sub);
    return toOrderResponseDto(order);
  }
}
