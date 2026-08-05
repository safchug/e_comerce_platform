import { Controller, Get, Inject, UseFilters, UseGuards } from '@nestjs/common';
import {
  type UserRepository,
  USER_REPOSITORY,
} from '../../domain/user.repository';
import { UserNotFoundError } from '../../domain/user.errors';
import { UserRole } from '../../domain/user-role.enum';
import { type AccessTokenPayload } from '../../application/ports/token.service.port';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserDomainExceptionFilter } from './user-domain-exception.filter';

@Controller('users')
@UseFilters(UserDomainExceptionFilter)
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  @Get('me')
  async me(@CurrentUser() tokenPayload: AccessTokenPayload) {
    const user = await this.userRepository.findById(tokenPayload.sub);
    if (!user) {
      throw new UserNotFoundError();
    }
    return { id: user.id, email: user.email, role: user.role };
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  listAdminOnly() {
    // Placeholder confirming RBAC works; a real listing use case lands with the catalog phase.
    return { message: 'Admin access confirmed' };
  }
}
