import { Inject, Injectable } from '@nestjs/common';
import {
  type UserRepository,
  USER_REPOSITORY,
} from '../../domain/user.repository';
import { InvalidRefreshTokenError } from '../../domain/user.errors';
import { type TokenHasher, TOKEN_HASHER } from '../ports/token-hasher.port';
import {
  type TokenService,
  TOKEN_SERVICE,
  type TokenPair,
  type AccessTokenPayload,
} from '../ports/token.service.port';

@Injectable()
export class RefreshTokensUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(TOKEN_HASHER) private readonly tokenHasher: TokenHasher,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
  ) {}

  async execute(refreshToken: string): Promise<TokenPair> {
    let payload: AccessTokenPayload;
    try {
      payload = await this.tokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw new InvalidRefreshTokenError();
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user || !user.refreshTokenHash) {
      throw new InvalidRefreshTokenError();
    }

    // Rejects reused/stale tokens even if still cryptographically valid (rotation).
    if (!this.tokenHasher.matches(refreshToken, user.refreshTokenHash)) {
      throw new InvalidRefreshTokenError();
    }

    const tokens = await this.tokenService.generateTokenPair({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const newRefreshTokenHash = this.tokenHasher.hash(tokens.refreshToken);
    await this.userRepository.save(
      user.withRefreshTokenHash(newRefreshTokenHash),
    );

    return tokens;
  }
}
