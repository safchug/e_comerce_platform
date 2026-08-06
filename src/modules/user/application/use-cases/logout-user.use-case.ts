import { Inject, Injectable } from '@nestjs/common';
import {
  type UserRepository,
  USER_REPOSITORY,
} from '../../domain/user.repository';
import { UserNotFoundError } from '../../domain/user.errors';

@Injectable()
export class LogoutUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async execute(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }
    await this.userRepository.save(user.withRefreshTokenHash(null));
  }
}
