import { randomUUID } from 'node:crypto';
import {
  AccessTokenPayload,
  TokenPair,
  TokenService,
} from '../../ports/token.service.port';

/** Fake token service: predictable, in-memory pairs; no real JWT signing. */
export class FakeTokenService implements TokenService {
  private readonly payloadByRefreshToken = new Map<
    string,
    AccessTokenPayload
  >();

  generateTokenPair(payload: AccessTokenPayload): Promise<TokenPair> {
    const accessToken = `access:${randomUUID()}`;
    const refreshToken = `refresh:${randomUUID()}`;
    this.payloadByRefreshToken.set(refreshToken, payload);
    return Promise.resolve({ accessToken, refreshToken });
  }

  verifyRefreshToken(token: string): Promise<AccessTokenPayload> {
    const payload = this.payloadByRefreshToken.get(token);
    if (!payload) {
      return Promise.reject(new Error('Invalid token'));
    }
    return Promise.resolve(payload);
  }
}
