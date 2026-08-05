import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../../../infrastructure/config';
import {
  type AccessTokenPayload,
  type TokenPair,
  type TokenService,
} from '../../application/ports/token.service.port';

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  async generateTokenPair(payload: AccessTokenPayload): Promise<TokenPair> {
    const auth = this.configService.get('auth', { infer: true });
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: auth.jwtAccessSecret,
        expiresIn: auth.jwtAccessExpiresIn,
      } as JwtSignOptions),
      this.jwtService.signAsync(payload, {
        secret: auth.jwtRefreshSecret,
        expiresIn: auth.jwtRefreshExpiresIn,
      } as JwtSignOptions),
    ]);
    return { accessToken, refreshToken };
  }

  verifyRefreshToken(token: string): Promise<AccessTokenPayload> {
    const auth = this.configService.get('auth', { infer: true });
    return this.jwtService.verifyAsync<AccessTokenPayload>(token, {
      secret: auth.jwtRefreshSecret,
    });
  }
}
