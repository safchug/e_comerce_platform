import { Controller, Get, Inject, UseFilters, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
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
import { UserResponseDto } from './dto/user-response.dto';
import { AdminMessageDto } from './dto/admin-message.dto';
import { ErrorResponseDto } from '../../../../infrastructure/http/dto/error-response.dto';

@ApiTags('users')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing or invalid access token',
  type: ErrorResponseDto,
})
@Controller('users')
@UseFilters(UserDomainExceptionFilter)
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  @ApiOkResponse({ description: 'The current user', type: UserResponseDto })
  @ApiNotFoundResponse({
    description: 'User no longer exists',
    type: ErrorResponseDto,
  })
  async me(
    @CurrentUser() tokenPayload: AccessTokenPayload,
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(tokenPayload.sub);
    if (!user) {
      throw new UserNotFoundError();
    }
    return { id: user.id, email: user.email, role: user.role };
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin-only placeholder endpoint' })
  @ApiOkResponse({
    description: 'Confirms the caller has ADMIN role',
    type: AdminMessageDto,
  })
  @ApiForbiddenResponse({
    description: 'Caller does not have the ADMIN role',
    type: ErrorResponseDto,
  })
  listAdminOnly(): AdminMessageDto {
    // Placeholder confirming RBAC works; a real listing use case lands with the catalog phase.
    return { message: 'Admin access confirmed' };
  }
}
