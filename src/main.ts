import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import type { Application as ExpressApplication } from 'express';
import { AppModule } from './app.module';
import { AppConfig } from './infrastructure/config';
import { securityHeaders } from './infrastructure/security/security-headers.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const configService = app.get(ConfigService<AppConfig, true>);
  const corsOrigins = configService.get('cors', { infer: true }).origins;
  if (corsOrigins.length > 0) {
    app.enableCors({ origin: corsOrigins });
  }

  // Only trust proxy headers (X-Forwarded-For) when explicitly configured -
  // required behind a reverse proxy/load balancer so req.ip/req.ips (used by
  // RateLimitGuard) reflect the real client, not the proxy.
  const trustProxy = configService.get('security', { infer: true }).trustProxy;
  if (trustProxy) {
    (app.getHttpAdapter().getInstance() as ExpressApplication).set(
      'trust proxy',
      trustProxy,
    );
  }

  app.use(securityHeaders);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('E-Commerce Platform API')
    .setDescription('OpenAPI documentation for the e-commerce platform API')
    .setVersion('0.0.1')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    })
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
