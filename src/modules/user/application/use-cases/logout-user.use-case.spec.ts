import { LogoutUserUseCase } from './logout-user.use-case';
import { FakeUserRepository } from './test-doubles/fake-user-repository';
import { UserNotFoundError } from '../../domain/user.errors';

describe('LogoutUserUseCase', () => {
  let userRepository: FakeUserRepository;
  let useCase: LogoutUserUseCase;

  beforeEach(() => {
    userRepository = new FakeUserRepository();
    useCase = new LogoutUserUseCase(userRepository);
  });

  it('clears the stored refresh token hash', async () => {
    const user = userRepository.seed({ refreshTokenHash: 'some-hash' });

    await useCase.execute(user.id);

    const updated = await userRepository.findById(user.id);
    expect(updated?.refreshTokenHash).toBeNull();
  });

  it('throws when the user does not exist', async () => {
    await expect(useCase.execute('missing-id')).rejects.toThrow(
      UserNotFoundError,
    );
  });
});
