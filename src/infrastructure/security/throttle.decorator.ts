import { applyDecorators, SetMetadata } from '@nestjs/common';

export const THROTTLE_LIMIT_KEY = 'throttle:limit';
export const THROTTLE_TTL_KEY = 'throttle:ttl';

/**
 * Overrides the default rate limit for a single route.
 *
 * @param limit max requests allowed per client within `ttlMs`
 * @param ttlMs size of the rate-limit window, in milliseconds
 */
export const Throttle = (limit: number, ttlMs: number): MethodDecorator =>
  applyDecorators(
    SetMetadata(THROTTLE_LIMIT_KEY, limit),
    SetMetadata(THROTTLE_TTL_KEY, ttlMs),
  );
