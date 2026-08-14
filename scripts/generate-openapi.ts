/**
 * Generates a static openapi.json from the app's NestJS/Swagger metadata,
 * without starting an HTTP listener or requiring a live database connection.
 *
 * Usage: yarn openapi:generate
 */
import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import * as prettier from 'prettier';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma.service';

async function generate() {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue({
      $connect: async () => undefined,
      $disconnect: async () => undefined,
      onModuleInit: async () => undefined,
      onModuleDestroy: async () => undefined,
    })
    .compile();

  const app = moduleRef.createNestApplication();
  await app.init();

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

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  const outPath = path.resolve(process.cwd(), 'openapi.json');
  // Format through the project's own Prettier config so re-running this script
  // doesn't produce a formatting-only diff against the committed file. Prettier
  // preserves an object's original line breaks but always reflows arrays, so
  // the input must already be indented (not a single compact line) to get the
  // same "multi-line objects, single-line short arrays" shape as before.
  const formatted = await prettier.format(JSON.stringify(document, null, 2), {
    ...(await prettier.resolveConfig(outPath)),
    filepath: outPath,
  });
  fs.writeFileSync(outPath, formatted);
  console.log(`OpenAPI spec written to ${outPath}`);

  await app.close();
}

generate().catch((err) => {
  console.error('Failed to generate OpenAPI spec:', err);
  process.exit(1);
});
