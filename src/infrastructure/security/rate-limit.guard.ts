import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { THROTTLE_LIMIT_KEY, THROTTLE_TTL_KEY } from './throttle.decorator';

interface Bucket {
  count: number;
  resetAt: number;
}

const DEFAULT_LIMIT = 60;
const DEFAULT_TTL_MS = 60_000;
const SWEEP_INTERVAL_MS = 5 * 60_000;

/**
 * Minimal in-memory, per-process, fixed-window rate limiter keyed by
 * client IP + route.
 *
 * This is intentionally dependency-free (no @nestjs/throttler/Redis) so it
 * works without npm registry access. It's fine for a single instance; if
 * this app is ever scaled horizontally, replace the in-memory Map with a
 * Redis-backed store (REDIS_URL is already wired up in config) so limits
 * are shared across instances, or swap this whole guard for
 * @nestjs/throttler's RedisThrottlerStorage.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly reflector: Reflector) {
    const sweep = setInterval(() => this.sweepExpired(), SWEEP_INTERVAL_MS);
    sweep.unref?.();
  }

  canActivate(context: ExecutionContext): boolean {
    const limit =
      this.reflector.getAllAndOverride<number>(THROTTLE_LIMIT_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? DEFAULT_LIMIT;
    const ttlMs =
      this.reflector.getAllAndOverride<number>(THROTTLE_TTL_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? DEFAULT_TTL_MS;

    const request = context.switchToHttp().getRequest<Request>();
    // `request.ips` is only populated when Express's `trust proxy` setting
    // is enabled (see the TRUST_PROXY env var, wired up in main.ts).
    // Without it - or behind a proxy that isn't configured as trusted -
    // this falls back to `request.ip`, which is the proxy/load balancer's
    // own address, meaning every client would share one bucket.
    const clientIp = request.ips.length > 0 ? request.ips[0] : request.ip;
    const key = `${clientIp}:${context.getClass().name}:${context.getHandler().name}`;
    const now = Date.now();

    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + ttlMs });
      return true;
    }

    if (bucket.count >= limit) {
      throw new HttpException(
        'Too many requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    bucket.count += 1;
    return true;
  }

  private sweepExpired(): void {
    const now = Date.now();
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
  }
}
