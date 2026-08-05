import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../infrastructure/database';
import { USER_REPOSITORY } from './domain/user.repository';
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { TOKEN_HASHER } from './application/ports/token-hasher.port';
import { TOKEN_SERVICE } from './application/ports/token.service.port';
import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';
import { BcryptPasswordHasher } from './infrastructure/hashing/bcrypt-password-hasher';
import { Sha256TokenHasher } from './infrastructure/hashing/sha256-token-hasher';
import { JwtTokenService } from './infrastructure/auth/jwt-token.service';
import { JwtAccessStrategy } from './infrastructure/auth/jwt-access.strategy';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { LoginUserUseCase } from './application/use-cases/login-user.use-case';
import { RefreshTokensUseCase } from './application/use-cases/refresh-tokens.use-case';
import { LogoutUserUseCase } from './application/use-cases/logout-user.use-case';
import { AuthController } from './infrastructure/http/auth.controller';
import { UserController } from './infrastructure/http/user.controller';

@Module({
  imports: [DatabaseModule, PassportModule, JwtModule.register({})],
  controllers: [AuthController, UserController],
  providers: [
    JwtAccessStrategy,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_HASHER, useClass: Sha256TokenHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    RegisterUserUseCase,
    LoginUserUseCase,
    RefreshTokensUseCase,
    LogoutUserUseCase,
  ],
  exports: [USER_REPOSITORY],
})
export class UserModule {}
