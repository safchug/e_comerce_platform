import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '../../../user/domain/user-role.enum';
import { JwtAuthGuard } from '../../../user/infrastructure/http/guards/jwt-auth.guard';
import { RolesGuard } from '../../../user/infrastructure/http/guards/roles.guard';
import { Roles } from '../../../user/infrastructure/http/decorators/roles.decorator';
import { CurrentUser } from '../../../user/infrastructure/http/decorators/current-user.decorator';
import { type AccessTokenPayload } from '../../../user/application/ports/token.service.port';
import { ErrorResponseDto } from '../../../../infrastructure/http/dto/error-response.dto';
import { PlaceOrderUseCase } from '../../application/use-cases/place-order.use-case';
import { UpdateOrderStatusUseCase } from '../../application/use-cases/update-order-status.use-case';
import { OrderDomainExceptionFilter } from './order-domain-exception.filter';
import { OrderResponseDto, toOrderResponseDto } from './dto/order-response.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

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
  constructor(
    private readonly placeOrderUseCase: PlaceOrderUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
  ) {}

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

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Advance an order's lifecycle status (admin-only)" })
  @ApiOkResponse({
    description: 'The updated order',
    type: OrderResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Caller does not have the ADMIN role',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No order with that id',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description:
      'The requested status is not reachable from the current status',
    type: ErrorResponseDto,
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    const order = await this.updateOrderStatusUseCase.execute(id, dto.status);
    return toOrderResponseDto(order);
  }
}
