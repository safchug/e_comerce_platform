import { Inject, Injectable } from '@nestjs/common';
import {
  type UserRepository,
  USER_REPOSITORY,
} from '../../domain/user.repository';
import { User } from '../../domain/user.entity';
import { InvalidCredentialsError } from '../../domain/user.errors';
import {
  type PasswordHasher,
  PASSWORD_HASHER,
} from '../ports/password-hasher.port';
import { type TokenHasher, TOKEN_HASHER } from '../ports/token-hasher.port';
import {
  type TokenService,
  TOKEN_SERVICE,
  type TokenPair,
} from '../ports/token.service.port';

export interface LoginResult {
  user: User;
  tokens: TokenPair;
}

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(TOKEN_HASHER) private readonly tokenHasher: TokenHasher,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
  ) {}

  async execute(email: string, password: string): Promise<LoginResult> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await this.passwordHasher.compare(
      password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    const tokens = await this.tokenService.generateTokenPair({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshTokenHash = this.tokenHasher.hash(tokens.refreshToken);
    const updatedUser = await this.userRepository.save(
      user.withRefreshTokenHash(refreshTokenHash),
    );

    return { user: updatedUser, tokens };
  }
}
