import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import {
  CartItemNotFoundError,
  InactiveProductError,
  InsufficientStockError,
  InvalidDiscountError,
  InvalidQuantityError,
  MixedCurrencyCartError,
  ProductNotFoundError,
} from '../../domain/cart.errors';

// InvalidTaxRateError is deliberately not caught here: TAX_RATE is server
// config, never client input, so a misconfigured value should surface as an
// opaque 500 (Nest's default filter) rather than a client-facing 400 that
// blames the caller and leaks config internals in the message.
type DomainError =
  | CartItemNotFoundError
  | InactiveProductError
  | InsufficientStockError
  | InvalidQuantityError
  | InvalidDiscountError
  | MixedCurrencyCartError
  | ProductNotFoundError;

const STATUS_BY_ERROR_NAME: Record<string, number> = {
  CartItemNotFoundError: 404,
  InactiveProductError: 409,
  InsufficientStockError: 409,
  InvalidQuantityError: 400,
  InvalidDiscountError: 400,
  MixedCurrencyCartError: 409,
  ProductNotFoundError: 404,
};

/** Maps cart-module domain errors to HTTP responses, keeping the domain layer Nest-free. */
@Catch(
  CartItemNotFoundError,
  InactiveProductError,
  InsufficientStockError,
  InvalidQuantityError,
  InvalidDiscountError,
  MixedCurrencyCartError,
  ProductNotFoundError,
)
export class CartDomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = STATUS_BY_ERROR_NAME[exception.name] ?? 400;
    response.status(status).json({
      statusCode: status,
      message: exception.message,
    });
  }
}
