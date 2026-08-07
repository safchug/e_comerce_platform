import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { LoginUserUseCase } from '../../application/use-cases/login-user.use-case';
import { RefreshTokensUseCase } from '../../application/use-cases/refresh-tokens.use-case';
import { LogoutUserUseCase } from '../../application/use-cases/logout-user.use-case';
import { type AccessTokenPayload } from '../../application/ports/token.service.port';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { TokenPairDto } from './dto/token-pair.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserDomainExceptionFilter } from './user-domain-exception.filter';
import { Throttle } from '../../../../infrastructure/security/throttle.decorator';
import { ErrorResponseDto } from '../../../../infrastructure/http/dto/error-response.dto';

// Credential/token endpoints get a tighter limit than the app default
// (60 req/min) since they're the prime target for brute-forcing.
const AUTH_THROTTLE_LIMIT = 5;
const AUTH_THROTTLE_TTL_MS = 60_000;

@ApiTags('auth')
@ApiTooManyRequestsResponse({
  description: 'Too many requests - rate limit exceeded',
  type: ErrorResponseDto,
})
@Controller('auth')
@UseFilters(UserDomainExceptionFilter)
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly refreshTokensUseCase: RefreshTokensUseCase,
    private readonly logoutUserUseCase: LogoutUserUseCase,
  ) {}

  @Post('register')
  @Throttle(AUTH_THROTTLE_LIMIT, AUTH_THROTTLE_TTL_MS)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiCreatedResponse({
    description: 'User successfully registered',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'An account with this email already exists',
    type: ErrorResponseDto,
  })
  async register(@Body() dto: RegisterDto): Promise<UserResponseDto> {
    const user = await this.registerUserUseCase.execute(
      dto.email,
      dto.password,
    );
    return { id: user.id, email: user.email, role: user.role };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle(AUTH_THROTTLE_LIMIT, AUTH_THROTTLE_TTL_MS)
  @ApiOperation({ summary: 'Authenticate with email and password' })
  @ApiOkResponse({
    description: 'Login successful, returns the user and a token pair',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid email or password',
    type: ErrorResponseDto,
  })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    const { user, tokens } = await this.loginUserUseCase.execute(
      dto.email,
      dto.password,
    );
    return {
      user: { id: user.id, email: user.email, role: user.role },
      ...tokens,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle(AUTH_THROTTLE_LIMIT, AUTH_THROTTLE_TTL_MS)
  @ApiOperation({ summary: 'Exchange a refresh token for a new token pair' })
  @ApiOkResponse({
    description: 'A new access/refresh token pair',
    type: TokenPairDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token',
    type: ErrorResponseDto,
  })
  refresh(@Body() dto: RefreshTokenDto): Promise<TokenPairDto> {
    return this.refreshTokensUseCase.execute(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invalidate the current refresh token' })
  @ApiNoContentResponse({ description: 'Logout successful' })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
    type: ErrorResponseDto,
  })
  async logout(@CurrentUser() user: AccessTokenPayload): Promise<void> {
    await this.logoutUserUseCase.execute(user.sub);
  }
}
