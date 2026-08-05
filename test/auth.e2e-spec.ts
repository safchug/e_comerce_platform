import { randomUUID } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

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
  });

  afterEach(async () => {
    await app.close();
  });

  const uniqueEmail = () => `e2e-${randomUUID()}@example.com`;

  it('registers a new user without leaking the password hash', async () => {
    const email = uniqueEmail();

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'password123' })
      .expect(201);

    const body = response.body as {
      id: string;
      email: string;
      role: string;
      passwordHash?: string;
    };
    expect(body).toEqual({
      id: expect.any(String) as string,
      email,
      role: 'CUSTOMER',
    });
    expect(body.passwordHash).toBeUndefined();
  });

  it('rejects registering the same email twice', async () => {
    const email = uniqueEmail();
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'password123' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'password123' })
      .expect(409);

    expect((response.body as { message: string }).message).toContain(email);
  });

  it('rejects registration with an invalid payload', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'short' })
      .expect(400);
  });

  it('logs in, accesses a protected route, refreshes, then logs out', async () => {
    const email = uniqueEmail();
    const password = 'password123';
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    const { accessToken, refreshToken } = loginResponse.body as {
      accessToken: string;
      refreshToken: string;
    };
    expect(accessToken).toEqual(expect.any(String));
    expect(refreshToken).toEqual(expect.any(String));

    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(({ body }: { body: { email: string } }) => {
        expect(body.email).toBe(email);
      });

    await request(app.getHttpServer()).get('/users/me').expect(401);

    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(200);
    const newRefreshToken = (refreshResponse.body as { refreshToken: string })
      .refreshToken;
    expect(newRefreshToken).not.toBe(refreshToken);

    // The rotated-out refresh token must no longer work.
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: newRefreshToken })
      .expect(401);
  });

  it('rejects login with a wrong password using a generic message', async () => {
    const email = uniqueEmail();
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'password123' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'wrong-password' })
      .expect(401);

    expect((response.body as { message: string }).message).toBe(
      'Invalid email or password',
    );
  });

  it('denies a customer access to an admin-only route', async () => {
    const email = uniqueEmail();
    const password = 'password123';
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201);
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    const { accessToken } = loginResponse.body as { accessToken: string };

    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });
});
