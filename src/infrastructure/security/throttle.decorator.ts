import { applyDecorators, SetMetadata } from '@nestjs/common';

export const THROTTLE_LIMIT_KEY = 'throttle:limit';
export const THROTTLE_TTL_KEY = 'throttle:ttl';

/**
 * Overrides the default rate limit for a route, or every route on a
 * controller (RateLimitGuard reads this metadata from both the handler
 * and its class via `getAllAndOverride`).
 *
 * @param limit max requests allowed per client within `ttlMs`
 * @param ttlMs size of the rate-limit window, in milliseconds
 */
export const Throttle = (
  limit: number,
  ttlMs: number,
): ClassDecorator & MethodDecorator =>
  applyDecorators(
    SetMetadata(THROTTLE_LIMIT_KEY, limit),
    SetMetadata(THROTTLE_TTL_KEY, ttlMs),
  );
