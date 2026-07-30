import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { AppConfig } from '../config';

const REQUEST_ID_HEADER = 'x-request-id';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => {
        const env = configService.get('env', { infer: true });
        const level = configService.get('logging.level', { infer: true });
        const isDevelopment = env === 'development';

        return {
          pinoHttp: {
            level,
            genReqId: (req, res) => {
              const incomingId = req.headers[REQUEST_ID_HEADER];
              const requestId = Array.isArray(incomingId)
                ? incomingId[0]
                : (incomingId ?? randomUUID());
              res.setHeader(REQUEST_ID_HEADER, requestId);
              return requestId;
            },
            customProps: (req) => ({
              correlationId: req.id,
            }),
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'res.headers["set-cookie"]',
              ],
              censor: '[Redacted]',
            },
            transport: isDevelopment
              ? {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                    colorize: true,
                  },
                }
              : undefined,
          },
        };
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggingModule {}
