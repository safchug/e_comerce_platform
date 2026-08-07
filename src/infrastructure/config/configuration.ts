export interface AppConfig {
  env: string;
  port: number;
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
    url: string;
  };
  redis: {
    host: string;
    port: number;
    url: string;
  };
  auth: {
    jwtAccessSecret: string;
    jwtAccessExpiresIn: string;
    jwtRefreshSecret: string;
    jwtRefreshExpiresIn: string;
  };
  logging: {
    level: string;
  };
  cors: {
    origins: string[];
  };
  security: {
    trustProxy: string | undefined;
  };
  swagger: {
    enabled: boolean;
  };
}

export default (): AppConfig => {
  const postgresHost = process.env.POSTGRES_HOST ?? 'localhost';
  const postgresPort = parseInt(process.env.POSTGRES_PORT ?? '5432', 10);
  const postgresUser = process.env.POSTGRES_USER ?? '';
  const postgresPassword = process.env.POSTGRES_PASSWORD ?? '';
  const postgresDb = process.env.POSTGRES_DB ?? '';

  const redisHost = process.env.REDIS_HOST ?? 'localhost';
  const redisPort = parseInt(process.env.REDIS_PORT ?? '6379', 10);

  return {
    env: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3000', 10),
    database: {
      host: postgresHost,
      port: postgresPort,
      user: postgresUser,
      password: postgresPassword,
      name: postgresDb,
      url:
        process.env.DATABASE_URL ??
        `postgres://${postgresUser}:${postgresPassword}@${postgresHost}:${postgresPort}/${postgresDb}`,
    },
    redis: {
      host: redisHost,
      port: redisPort,
      url: process.env.REDIS_URL ?? `redis://${redisHost}:${redisPort}`,
    },
    auth: {
      jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? '',
      jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
      jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
      jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    },
    logging: {
      level: process.env.LOG_LEVEL ?? 'info',
    },
    cors: {
      origins: (process.env.CORS_ORIGIN ?? '')
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0),
    },
    security: {
      trustProxy: process.env.TRUST_PROXY || undefined,
    },
    swagger: {
      // Defaults to disabled in production so API docs aren't exposed
      // unintentionally; SWAGGER_ENABLED can override the default in
      // either direction.
      enabled:
        process.env.SWAGGER_ENABLED !== undefined
          ? process.env.SWAGGER_ENABLED === 'true'
          : (process.env.NODE_ENV ?? 'development') !== 'production',
    },
  };
};
