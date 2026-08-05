import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import {
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  UserNotFoundError,
} from '../../domain/user.errors';

type DomainError =
  | EmailAlreadyRegisteredError
  | InvalidCredentialsError
  | InvalidRefreshTokenError
  | UserNotFoundError;

const STATUS_BY_ERROR_NAME: Record<string, number> = {
  EmailAlreadyRegisteredError: 409,
  InvalidCredentialsError: 401,
  InvalidRefreshTokenError: 401,
  UserNotFoundError: 404,
};

/** Maps user-module domain errors to HTTP responses, keeping the domain layer Nest-free. */
@Catch(
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  UserNotFoundError,
)
export class UserDomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = STATUS_BY_ERROR_NAME[exception.name] ?? 400;
    response.status(status).json({
      statusCode: status,
      message: exception.message,
    });
  }
}
