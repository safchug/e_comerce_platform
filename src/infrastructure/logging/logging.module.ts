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
                  // Points at ./pretty-transport instead of the 'pino-pretty'
                  // package directly so we can pass a customPrettifiers.err
                  // function - pino loads transports in a worker thread, and
                  // functions can't cross that boundary via the options
                  // object (see pretty-transport.ts for details).
                  target: require.resolve('./pretty-transport'),
                  options: {
                    singleLine: true,
                    // Only emit ANSI color codes when writing to a real
                    // terminal. Forcing this to `true` prints raw escape
                    // sequences (e.g. "[32mINFO[39m") when output is
                    // redirected, piped, or viewed via `docker compose logs`
                    // without a TTY attached.
                    colorize: process.stdout.isTTY === true,
                    translateTime: 'SYS:HH:MM:ss',
                    ignore: 'pid,hostname',
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
