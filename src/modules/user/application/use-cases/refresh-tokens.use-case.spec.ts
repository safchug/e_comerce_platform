import { LoginUserUseCase } from './login-user.use-case';
import { RefreshTokensUseCase } from './refresh-tokens.use-case';
import { FakeUserRepository } from './test-doubles/fake-user-repository';
import { FakePasswordHasher } from './test-doubles/fake-password-hasher';
import { FakeTokenHasher } from './test-doubles/fake-token-hasher';
import { FakeTokenService } from './test-doubles/fake-token-service';
import { InvalidRefreshTokenError } from '../../domain/user.errors';

describe('RefreshTokensUseCase', () => {
  let userRepository: FakeUserRepository;
  let tokenService: FakeTokenService;
  let loginUseCase: LoginUserUseCase;
  let useCase: RefreshTokensUseCase;

  beforeEach(() => {
    userRepository = new FakeUserRepository();
    tokenService = new FakeTokenService();
    loginUseCase = new LoginUserUseCase(
      userRepository,
      new FakePasswordHasher(),
      new FakeTokenHasher(),
      tokenService,
    );
    useCase = new RefreshTokensUseCase(
      userRepository,
      new FakeTokenHasher(),
      tokenService,
    );
  });

  it('issues a new token pair for a valid, current refresh token', async () => {
    userRepository.seed({
      email: 'shopper@example.com',
      passwordHash: 'hashed:password123',
    });
    const { tokens } = await loginUseCase.execute(
      'shopper@example.com',
      'password123',
    );

    const newTokens = await useCase.execute(tokens.refreshToken);

    expect(newTokens.accessToken).toBeTruthy();
    expect(newTokens.refreshToken).not.toBe(tokens.refreshToken);
  });

  it('rejects a reused (rotated-out) refresh token', async () => {
    userRepository.seed({
      email: 'shopper@example.com',
      passwordHash: 'hashed:password123',
    });
    const { tokens } = await loginUseCase.execute(
      'shopper@example.com',
      'password123',
    );

    await useCase.execute(tokens.refreshToken); // first rotation succeeds

    await expect(useCase.execute(tokens.refreshToken)).rejects.toThrow(
      InvalidRefreshTokenError,
    );
  });

  it('rejects an unknown/garbage refresh token', async () => {
    await expect(useCase.execute('not-a-real-token')).rejects.toThrow(
      InvalidRefreshTokenError,
    );
  });
});
