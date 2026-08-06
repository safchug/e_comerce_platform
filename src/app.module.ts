import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from './infrastructure/config';
import { LoggingModule } from './infrastructure/logging';
import { DatabaseModule } from './infrastructure/database';
import { RateLimitGuard } from './infrastructure/security/rate-limit.guard';
import { UserModule } from './modules/user';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [ConfigModule, LoggingModule, DatabaseModule, UserModule],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: RateLimitGuard }],
})
export class AppModule {}
