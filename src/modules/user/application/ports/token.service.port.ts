import { UserRole } from '../../domain/user-role.enum';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface TokenService {
  generateTokenPair(payload: AccessTokenPayload): Promise<TokenPair>;
  verifyRefreshToken(token: string): Promise<AccessTokenPayload>;
}

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');
