import {
  UserRepository,
  USER_REPOSITORY,
} from '../../../domain/user.repository';
import { User } from '../../../domain/user.entity';
import { UserRole } from '../../../domain/user-role.enum';

/** In-memory fake used across use-case unit tests (no I/O). */
export class FakeUserRepository implements UserRepository {
  private readonly usersById = new Map<string, User>();

  findById(id: string): Promise<User | null> {
    return Promise.resolve(this.usersById.get(id) ?? null);
  }

  findByEmail(email: string): Promise<User | null> {
    for (const user of this.usersById.values()) {
      if (user.email === email) {
        return Promise.resolve(user);
      }
    }
    return Promise.resolve(null);
  }

  save(user: User): Promise<User> {
    this.usersById.set(user.id, user);
    return Promise.resolve(user);
  }

  seed(overrides: Partial<Parameters<typeof User.create>[0]> = {}): User {
    const now = new Date();
    const user = User.create({
      id: overrides.id ?? `user-${this.usersById.size + 1}`,
      email: overrides.email ?? `user${this.usersById.size + 1}@example.com`,
      passwordHash: overrides.passwordHash ?? 'hashed-password',
      role: overrides.role ?? UserRole.CUSTOMER,
      refreshTokenHash: overrides.refreshTokenHash ?? null,
      createdAt: overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
    });
    this.usersById.set(user.id, user);
    return user;
  }
}

export { USER_REPOSITORY };
