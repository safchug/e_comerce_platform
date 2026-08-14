import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import {
  DuplicateSkuError,
  InvalidPriceRangeError,
  InvalidProductCategoryError,
  InvalidProductNameError,
  InvalidProductPriceError,
  InvalidSkuError,
  InvalidStockQuantityError,
  ProductNotFoundError,
} from '../../domain/product.errors';

type DomainError =
  | DuplicateSkuError
  | InvalidPriceRangeError
  | InvalidProductCategoryError
  | InvalidProductNameError
  | InvalidProductPriceError
  | InvalidSkuError
  | InvalidStockQuantityError
  | ProductNotFoundError;

const STATUS_BY_ERROR_NAME: Record<string, number> = {
  DuplicateSkuError: 409,
  InvalidPriceRangeError: 400,
  InvalidProductCategoryError: 400,
  InvalidProductNameError: 400,
  InvalidProductPriceError: 400,
  InvalidSkuError: 400,
  InvalidStockQuantityError: 400,
  ProductNotFoundError: 404,
};

/** Maps product-module domain errors to HTTP responses, keeping the domain layer Nest-free. */
@Catch(
  DuplicateSkuError,
  InvalidPriceRangeError,
  InvalidProductCategoryError,
  InvalidProductNameError,
  InvalidProductPriceError,
  InvalidSkuError,
  InvalidStockQuantityError,
  ProductNotFoundError,
)
export class ProductDomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = STATUS_BY_ERROR_NAME[exception.name] ?? 400;
    response.status(status).json({
      statusCode: status,
      message: exception.message,
    });
  }
}
