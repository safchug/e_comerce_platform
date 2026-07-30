import { Module } from '@nestjs/common';
import { ConfigModule } from './infrastructure/config';

@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
