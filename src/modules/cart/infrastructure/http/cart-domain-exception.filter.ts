import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import {
  CartItemNotFoundError,
  InactiveProductError,
  InsufficientStockError,
  InvalidQuantityError,
  ProductNotFoundError,
} from '../../domain/cart.errors';

type DomainError =
  | CartItemNotFoundError
  | InactiveProductError
  | InsufficientStockError
  | InvalidQuantityError
  | ProductNotFoundError;

const STATUS_BY_ERROR_NAME: Record<string, number> = {
  CartItemNotFoundError: 404,
  InactiveProductError: 409,
  InsufficientStockError: 409,
  InvalidQuantityError: 400,
  ProductNotFoundError: 404,
};

/** Maps cart-module domain errors to HTTP responses, keeping the domain layer Nest-free. */
@Catch(
  CartItemNotFoundError,
  InactiveProductError,
  InsufficientStockError,
  InvalidQuantityError,
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
