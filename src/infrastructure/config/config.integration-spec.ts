import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from './config.module';

describe('ConfigModule (integration)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Exclude DATABASE_URL: this suite verifies the fallback URL built from
    // the individual POSTGRES_* vars, not whatever is set in the real .env.
    const restOriginalEnv = { ...originalEnv };
    delete restOriginalEnv.DATABASE_URL;
    process.env = {
      ...restOriginalEnv,
      NODE_ENV: 'test',
      PORT: '4000',
      POSTGRES_USER: 'test_user',
      POSTGRES_PASSWORD: 'test_pass',
      POSTGRES_DB: 'test_db',
      POSTGRES_HOST: 'test-host',
      POSTGRES_PORT: '5433',
      REDIS_HOST: 'test-redis',
      REDIS_PORT: '6380',
      JWT_ACCESS_SECRET: 'test-access-secret-0123456789',
      JWT_REFRESH_SECRET: 'test-refresh-secret-0123456789',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('wires ConfigService with validated, typed values from the environment', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule],
    }).compile();

    const configService = moduleRef.get(ConfigService);

    expect(configService.get('port')).toBe(4000);
    expect(configService.get('database')).toEqual({
      host: 'test-host',
      port: 5433,
      user: 'test_user',
      password: 'test_pass',
      name: 'test_db',
      url: 'postgres://test_user:test_pass@test-host:5433/test_db',
    });
    expect(configService.get('logging')).toEqual({ level: 'info' });

    await moduleRef.close();
  });
});
