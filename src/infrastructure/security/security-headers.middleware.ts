import { NextFunction, Request, Response } from 'express';

/**
 * Minimal, dependency-free stand-in for the handful of `helmet` defaults
 * that matter most for a JSON API. Swap for the real `helmet` package once
 * this project has npm registry access again (`yarn add helmet`, then
 * `app.use(helmet())` in main.ts).
 */
export function securityHeaders(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains',
  );
  next();
}
