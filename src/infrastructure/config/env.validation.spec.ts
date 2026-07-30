import { envValidationSchema } from './env.validation';

interface ValidatedEnv {
  NODE_ENV: string;
  PORT: number;
  POSTGRES_HOST: string;
  POSTGRES_PORT: number;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_DB: string;
  DATABASE_URL?: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_URL?: string;
  LOG_LEVEL: string;
}

describe('envValidationSchema', () => {
  const validEnv = {
    NODE_ENV: 'test',
    PORT: '4000',
    POSTGRES_HOST: 'localhost',
    POSTGRES_PORT: '5432',
    POSTGRES_USER: 'test_user',
    POSTGRES_PASSWORD: 'test_pass',
    POSTGRES_DB: 'test_db',
    REDIS_HOST: 'localhost',
    REDIS_PORT: '6379',
  };

  it('passes for a fully valid environment', () => {
    const { error } = envValidationSchema.validate(validEnv);
    expect(error).toBeUndefined();
  });

  it('applies defaults for optional values', () => {
    const result = envValidationSchema.validate({
      POSTGRES_USER: 'test_user',
      POSTGRES_PASSWORD: 'test_pass',
      POSTGRES_DB: 'test_db',
    });
    const { error } = result;
    const value = result.value as ValidatedEnv;

    expect(error).toBeUndefined();
    expect(value.NODE_ENV).toBe('development');
    expect(value.PORT).toBe(3000);
    expect(value.POSTGRES_PORT).toBe(5432);
    expect(value.REDIS_PORT).toBe(6379);
    expect(value.LOG_LEVEL).toBe('info');
  });

  it.each(['POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB'])(
    'fails when required var %s is missing',
    (key) => {
      const rest: Record<string, string> = { ...validEnv };
      delete rest[key];
      const { error } = envValidationSchema.validate(rest);
      expect(error).toBeDefined();
      expect(error?.message).toContain(key);
    },
  );

  it('fails when a numeric field has an invalid type', () => {
    const { error } = envValidationSchema.validate({
      ...validEnv,
      POSTGRES_PORT: 'not-a-number',
    });

    expect(error).toBeDefined();
    expect(error?.message).toContain('POSTGRES_PORT');
  });

  it('fails when NODE_ENV has an unsupported value', () => {
    const { error } = envValidationSchema.validate({
      ...validEnv,
      NODE_ENV: 'staging',
    });

    expect(error).toBeDefined();
  });

  it('fails when LOG_LEVEL has an unsupported value', () => {
    const { error } = envValidationSchema.validate({
      ...validEnv,
      LOG_LEVEL: 'verbose',
    });

    expect(error).toBeDefined();
  });
});
