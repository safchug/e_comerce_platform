import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database';
import type { User as PrismaUserRow } from '../../../../infrastructure/database/prisma-client';
import { UserRepository } from '../../domain/user.repository';
import { User } from '../../domain/user.entity';
import { UserRole } from '../../domain/user-role.enum';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? this.toDomain(row) : null;
  }

  async save(user: User): Promise<User> {
    const row = await this.prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role,
        refreshTokenHash: user.refreshTokenHash,
      },
      update: {
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role,
        refreshTokenHash: user.refreshTokenHash,
      },
    });
    return this.toDomain(row);
  }

  private toDomain(row: PrismaUserRow): User {
    return User.create({
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      role: row.role as unknown as UserRole,
      refreshTokenHash: row.refreshTokenHash,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
