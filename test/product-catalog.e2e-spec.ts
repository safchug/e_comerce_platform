import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/infrastructure/database';
import { UserRole } from '../src/modules/user/domain/user-role.enum';

interface ProductResponse {
  id: string;
  sku: string;
  name: string;
  category: string;
  priceCents: number;
}

describe('Product catalog filters (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const runId = randomUUID().slice(0, 8);
  const skuPrefix = `E2E-${runId}-`;
  let skuCounter = 0;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    prisma = moduleFixture.get(PrismaService);
  });

  afterEach(async () => {
    // Only ever deletes the products this file created (unique SKU prefix per
    // run), so it never touches manually created or seeded catalog data.
    await prisma.product.deleteMany({
      where: { sku: { startsWith: skuPrefix } },
    });
    await app.close();
  });

  async function getAdminAccessToken(): Promise<string> {
    const email = `e2e-admin-${randomUUID()}@example.com`;
    const password = 'password123';
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201);
    // No HTTP path promotes a user to ADMIN; the role is embedded in the JWT
    // at login, so writing it directly to the DB before logging in is enough.
    await prisma.user.update({
      where: { email },
      data: { role: UserRole.ADMIN },
    });
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    return (loginResponse.body as { accessToken: string }).accessToken;
  }

  async function createProduct(
    accessToken: string,
    overrides: Partial<{
      name: string;
      category: string;
      priceCents: number;
      active: boolean;
    }> = {},
  ): Promise<ProductResponse> {
    skuCounter += 1;
    const response = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        sku: `${skuPrefix}${skuCounter}`,
        name: overrides.name ?? `Product ${skuCounter}`,
        category: overrides.category ?? `Category-${runId}`,
        priceCents: overrides.priceCents ?? 1000,
        active: overrides.active,
      })
      .expect(201);
    return response.body as ProductResponse;
  }

  it('filters by exact category', async () => {
    const token = await getAdminAccessToken();
    const category = `Cat-${runId}`;
    await createProduct(token, { category, name: 'In category' });
    await createProduct(token, {
      category: `Other-${runId}`,
      name: 'Not in category',
    });

    const response = await request(app.getHttpServer())
      .get('/products')
      .query({ category, limit: 100 })
      .expect(200);

    const body = response.body as { data: ProductResponse[] };
    expect(body.data).toHaveLength(1);
    expect(body.data[0].category).toBe(category);
  });

  it('treats a literal "%" in the name filter as literal text, not a SQL wildcard', async () => {
    const token = await getAdminAccessToken();
    const category = `Wild-${runId}`;
    await createProduct(token, { category, name: '50% off Widget' });
    await createProduct(token, { category, name: 'Regular Widget' });

    const response = await request(app.getHttpServer())
      .get('/products')
      .query({ name: '%', category, limit: 100 })
      .expect(200);

    const body = response.body as { data: ProductResponse[] };
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe('50% off Widget');
  });

  it('filters by an inclusive price range', async () => {
    const token = await getAdminAccessToken();
    const category = `Price-${runId}`;
    await createProduct(token, { category, priceCents: 1000, name: 'Cheap' });
    await createProduct(token, { category, priceCents: 2000, name: 'Mid' });
    await createProduct(token, {
      category,
      priceCents: 3000,
      name: 'Expensive',
    });

    const response = await request(app.getHttpServer())
      .get('/products')
      .query({
        category,
        minPriceCents: 1000,
        maxPriceCents: 2000,
        limit: 100,
      })
      .expect(200);

    const body = response.body as { data: ProductResponse[] };
    expect(body.data.map((p) => p.priceCents).sort((a, b) => a - b)).toEqual([
      1000, 2000,
    ]);
  });

  it('rejects a price range where min is greater than max', async () => {
    const response = await request(app.getHttpServer())
      .get('/products')
      .query({ minPriceCents: 2000, maxPriceCents: 1000 })
      .expect(400);

    expect((response.body as { message: string }).message).toContain('price');
  });

  it('lists distinct categories from active products only', async () => {
    const token = await getAdminAccessToken();
    const activeCategory = `Active-${runId}`;
    const inactiveCategory = `Inactive-${runId}`;
    await createProduct(token, { category: activeCategory, name: 'Visible' });
    await createProduct(token, {
      category: activeCategory,
      name: 'Visible duplicate',
    });
    await createProduct(token, {
      category: inactiveCategory,
      name: 'Hidden',
      active: false,
    });

    const response = await request(app.getHttpServer())
      .get('/products/categories')
      .expect(200);

    const body = response.body as { categories: string[] };
    expect(body.categories.filter((c) => c === activeCategory)).toHaveLength(1);
    expect(body.categories).not.toContain(inactiveCategory);
  });

  it('resolves /products/categories to the categories endpoint, not a product lookup', async () => {
    const response = await request(app.getHttpServer())
      .get('/products/categories')
      .expect(200);

    const body = response.body as { categories: string[] };
    expect(Array.isArray(body.categories)).toBe(true);
  });
});
