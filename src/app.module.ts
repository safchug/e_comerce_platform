import { Module } from '@nestjs/common';
import { ConfigModule } from './infrastructure/config';
import { LoggingModule } from './infrastructure/logging';
import { DatabaseModule } from './infrastructure/database';
import { UserModule } from './modules/user';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [ConfigModule, LoggingModule, DatabaseModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
