import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { Logger } from 'nestjs-pino';
import { ConfigModule } from '../config';
import { LoggingModule } from './logging.module';

@Controller()
class PingController {
  @Get('ping')
  ping() {
    return { ok: true };
  }
}

describe('LoggingModule (integration)', () => {
  const originalEnv = process.env;
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      POSTGRES_USER: 'test_user',
      POSTGRES_PASSWORD: 'test_pass',
      POSTGRES_DB: 'test_db',
      JWT_ACCESS_SECRET: 'test-access-secret-0123456789',
      JWT_REFRESH_SECRET: 'test-refresh-secret-0123456789',
    };

    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule, LoggingModule],
      controllers: [PingController],
    }).compile();

    app = moduleRef.createNestApplication({ bufferLogs: true });
    app.useLogger(app.get(Logger));
    await app.init();
  });

  afterEach(async () => {
    process.env = originalEnv;
    await app.close();
  });

  it('assigns a generated correlation id and returns it on the response', async () => {
    const response = await request(app.getHttpServer())
      .get('/ping')
      .expect(200);

    const requestId = response.headers['x-request-id'];
    expect(typeof requestId).toBe('string');
    expect(requestId.length).toBeGreaterThan(0);
  });

  it('propagates an incoming x-request-id instead of generating a new one', async () => {
    const response = await request(app.getHttpServer())
      .get('/ping')
      .set('x-request-id', 'incoming-correlation-id')
      .expect(200);

    expect(response.headers['x-request-id']).toBe('incoming-correlation-id');
  });
});
