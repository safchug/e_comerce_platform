import { LoginUserUseCase } from './login-user.use-case';
import { FakeUserRepository } from './test-doubles/fake-user-repository';
import { FakePasswordHasher } from './test-doubles/fake-password-hasher';
import { FakeTokenHasher } from './test-doubles/fake-token-hasher';
import { FakeTokenService } from './test-doubles/fake-token-service';
import { InvalidCredentialsError } from '../../domain/user.errors';

describe('LoginUserUseCase', () => {
  let userRepository: FakeUserRepository;
  let useCase: LoginUserUseCase;

  beforeEach(() => {
    userRepository = new FakeUserRepository();
    useCase = new LoginUserUseCase(
      userRepository,
      new FakePasswordHasher(),
      new FakeTokenHasher(),
      new FakeTokenService(),
    );
  });

  it('returns a token pair for valid credentials', async () => {
    userRepository.seed({
      email: 'shopper@example.com',
      passwordHash: 'hashed:password123',
    });

    const { user, tokens } = await useCase.execute(
      'shopper@example.com',
      'password123',
    );

    expect(user.email).toBe('shopper@example.com');
    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).toBeTruthy();
  });

  it('stores a hash of the issued refresh token on the user', async () => {
    userRepository.seed({
      email: 'shopper@example.com',
      passwordHash: 'hashed:password123',
    });

    const { user, tokens } = await useCase.execute(
      'shopper@example.com',
      'password123',
    );

    expect(user.refreshTokenHash).toBe(`hashed:${tokens.refreshToken}`);
  });

  it('rejects an unknown email with a generic error', async () => {
    await expect(
      useCase.execute('unknown@example.com', 'password123'),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('rejects a wrong password with a generic error', async () => {
    userRepository.seed({
      email: 'shopper@example.com',
      passwordHash: 'hashed:password123',
    });

    await expect(
      useCase.execute('shopper@example.com', 'wrong-password'),
    ).rejects.toThrow(InvalidCredentialsError);
  });
});
