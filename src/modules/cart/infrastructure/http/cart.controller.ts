import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../user/infrastructure/http/guards/jwt-auth.guard';
import { CurrentUser } from '../../../user/infrastructure/http/decorators/current-user.decorator';
import { type AccessTokenPayload } from '../../../user/application/ports/token.service.port';
import { ErrorResponseDto } from '../../../../infrastructure/http/dto/error-response.dto';
import { GetOrCreateCartUseCase } from '../../application/use-cases/get-or-create-cart.use-case';
import { AddCartItemUseCase } from '../../application/use-cases/add-cart-item.use-case';
import { SetCartItemQuantityUseCase } from '../../application/use-cases/set-cart-item-quantity.use-case';
import { RemoveCartItemUseCase } from '../../application/use-cases/remove-cart-item.use-case';
import { ResolveCartTotalsUseCase } from '../../application/use-cases/resolve-cart-totals.use-case';
import { Cart } from '../../domain/cart.entity';
import { CartDomainExceptionFilter } from './cart-domain-exception.filter';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { SetCartItemQuantityDto } from './dto/set-cart-item-quantity.dto';
import { CartResponseDto, toCartResponseDto } from './dto/cart-response.dto';

/**
 * `POST /cart/items` increments a line, so repeating the same call adds more
 * units each time. `PATCH`/`DELETE` operate on an absolute end state, so
 * repeating those calls is idempotent - see Cart.withItemQuantitySet /
 * Cart.withItemRemoved for the underlying invariant.
 */
@ApiTags('cart')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing or invalid access token',
  type: ErrorResponseDto,
})
@Controller('cart')
@UseFilters(CartDomainExceptionFilter)
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(
    private readonly getOrCreateCartUseCase: GetOrCreateCartUseCase,
    private readonly addCartItemUseCase: AddCartItemUseCase,
    private readonly setCartItemQuantityUseCase: SetCartItemQuantityUseCase,
    private readonly removeCartItemUseCase: RemoveCartItemUseCase,
    private readonly resolveCartTotalsUseCase: ResolveCartTotalsUseCase,
  ) {}

  private async toPricedResponse(cart: Cart): Promise<CartResponseDto> {
    const { lines, totals } = await this.resolveCartTotalsUseCase.execute(cart);
    return toCartResponseDto(cart, lines, totals);
  }

  @Get()
  @ApiOperation({ summary: "Get the current user's cart" })
  @ApiOkResponse({ description: 'The cart', type: CartResponseDto })
  async getCart(
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<CartResponseDto> {
    const cart = await this.getOrCreateCartUseCase.execute(user.sub);
    return this.toPricedResponse(cart);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add units of a product to the cart' })
  @ApiOkResponse({ description: 'The updated cart', type: CartResponseDto })
  @ApiNotFoundResponse({
    description: 'Product not found',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Product is inactive, or the requested quantity exceeds stock',
    type: ErrorResponseDto,
  })
  async addItem(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: AddCartItemDto,
  ): Promise<CartResponseDto> {
    const cart = await this.addCartItemUseCase.execute({
      userId: user.sub,
      productId: dto.productId,
      quantity: dto.quantity,
    });
    return this.toPricedResponse(cart);
  }

  @Patch('items/:productId')
  @ApiOperation({ summary: 'Set the absolute quantity of a cart line' })
  @ApiOkResponse({ description: 'The updated cart', type: CartResponseDto })
  @ApiNotFoundResponse({
    description: 'Product not found, or not in the cart',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Product is inactive, or the requested quantity exceeds stock',
    type: ErrorResponseDto,
  })
  async setItemQuantity(
    @CurrentUser() user: AccessTokenPayload,
    @Param('productId') productId: string,
    @Body() dto: SetCartItemQuantityDto,
  ): Promise<CartResponseDto> {
    const cart = await this.setCartItemQuantityUseCase.execute({
      userId: user.sub,
      productId,
      quantity: dto.quantity,
    });
    return this.toPricedResponse(cart);
  }

  @Delete('items/:productId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove a product from the cart' })
  @ApiNoContentResponse({ description: 'Item removed (or already absent)' })
  async removeItem(
    @CurrentUser() user: AccessTokenPayload,
    @Param('productId') productId: string,
  ): Promise<void> {
    await this.removeCartItemUseCase.execute(user.sub, productId);
  }
}
