import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  POSTGRES_HOST: Joi.string().default('localhost'),
  POSTGRES_PORT: Joi.number().default(5432),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().required(),
  POSTGRES_DB: Joi.string().required(),
  DATABASE_URL: Joi.string().optional(),

  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_URL: Joi.string().optional(),

  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
    .default('info'),

  // Comma-separated list of allowed browser origins, e.g.
  // "https://app.example.com,https://admin.example.com". Left unset, CORS
  // stays disabled (safe default for a browser-facing API).
  CORS_ORIGIN: Joi.string().optional().allow(''),

  // Express "trust proxy" setting - required when this app sits behind a
  // reverse proxy/load balancer, so req.ip/req.ips reflect the real client
  // address (e.g. the rate limiter keys on the right IP instead of the
  // proxy's). Accepts anything Express understands: a hop count ("1"), a
  // preset ("loopback"), or a comma-separated list of trusted IPs/CIDRs.
  // Left unset, proxy headers are not trusted (safe default).
  TRUST_PROXY: Joi.string().optional().allow(''),

  // Toggles the Swagger UI / OpenAPI docs endpoint (api/docs). Left unset,
  // it's enabled outside production and disabled in production, so internal
  // API docs aren't exposed by default. Set explicitly to override either way.
  SWAGGER_ENABLED: Joi.boolean().optional(),
});
