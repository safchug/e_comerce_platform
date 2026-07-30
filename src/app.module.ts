import { Module } from '@nestjs/common';
import { ConfigModule } from './infrastructure/config';
import { LoggingModule } from './infrastructure/logging';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [ConfigModule, LoggingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
