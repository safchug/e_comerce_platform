import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  type UserRepository,
  USER_REPOSITORY,
} from '../../domain/user.repository';
import { User } from '../../domain/user.entity';
import { UserRole } from '../../domain/user-role.enum';
import { EmailAlreadyRegisteredError } from '../../domain/user.errors';
import {
  type PasswordHasher,
  PASSWORD_HASHER,
} from '../ports/password-hasher.port';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(email: string, password: string): Promise<User> {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new EmailAlreadyRegisteredError(email);
    }

    const passwordHash = await this.passwordHasher.hash(password);
    const now = new Date();
    const user = User.create({
      id: randomUUID(),
      email,
      passwordHash,
      role: UserRole.CUSTOMER,
      refreshTokenHash: null,
      createdAt: now,
      updatedAt: now,
    });

    return this.userRepository.save(user);
  }
}
