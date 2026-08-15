import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import {
  EmptyCartError,
  InactiveProductError,
  InsufficientStockError,
  ProductNotFoundError,
} from '../../domain/order.errors';

// InvalidQuantityError is deliberately not caught here: by the time an
// order reaches PlaceOrderUseCase its quantities were already validated
// when the items were added to the cart, so this can only fire on a data
// integrity bug - it should surface as an opaque 500, not a client-facing
// 400 that implies the caller did something wrong.
type DomainError =
  | EmptyCartError
  | InactiveProductError
  | InsufficientStockError
  | ProductNotFoundError;

const STATUS_BY_ERROR_NAME: Record<string, number> = {
  EmptyCartError: 409,
  InactiveProductError: 409,
  InsufficientStockError: 409,
  ProductNotFoundError: 404,
};

/** Maps order-module domain errors to HTTP responses, keeping the domain layer Nest-free. */
@Catch(
  EmptyCartError,
  InactiveProductError,
  InsufficientStockError,
  ProductNotFoundError,
)
export class OrderDomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = STATUS_BY_ERROR_NAME[exception.name];
    response.status(status).json({
      statusCode: status,
      message: exception.message,
    });
  }
}
