import { RegisterUserUseCase } from './register-user.use-case';
import { FakeUserRepository } from './test-doubles/fake-user-repository';
import { FakePasswordHasher } from './test-doubles/fake-password-hasher';
import { EmailAlreadyRegisteredError } from '../../domain/user.errors';
import { UserRole } from '../../domain/user-role.enum';

describe('RegisterUserUseCase', () => {
  let userRepository: FakeUserRepository;
  let useCase: RegisterUserUseCase;

  beforeEach(() => {
    userRepository = new FakeUserRepository();
    useCase = new RegisterUserUseCase(userRepository, new FakePasswordHasher());
  });

  it('creates a new customer with a hashed password', async () => {
    const user = await useCase.execute('shopper@example.com', 'password123');

    expect(user.email).toBe('shopper@example.com');
    expect(user.role).toBe(UserRole.CUSTOMER);
    expect(user.passwordHash).toBe('hashed:password123');
    expect(user.passwordHash).not.toBe('password123');
  });

  it('persists the user so it can be found by email afterwards', async () => {
    await useCase.execute('shopper@example.com', 'password123');

    const found = await userRepository.findByEmail('shopper@example.com');
    expect(found).not.toBeNull();
  });

  it('rejects registration when the email is already taken', async () => {
    userRepository.seed({ email: 'shopper@example.com' });

    await expect(
      useCase.execute('shopper@example.com', 'password123'),
    ).rejects.toThrow(EmailAlreadyRegisteredError);
  });
});
