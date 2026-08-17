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
  stockQuantity: number;
}

interface CartResponse {
  items: { productId: string; quantity: number }[];
}

interface OrderResponse {
  id: string;
  items: { productId: string; quantity: number; unitPriceCents: number }[];
  status: string;
  subtotalCents: number;
  totalCents: number;
}

describe('Order placement (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const runId = randomUUID().slice(0, 8);
  const skuPrefix = `E2E-ORD-${runId}-`;
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
    // Orders reference products via a Restrict FK (a placed order must
    // survive product deletion), so orders/order_items for the products
    // this file created have to go first, or the product delete below
    // would fail with a FK violation.
    const orderIds = await prisma.orderItem.findMany({
      where: { product: { sku: { startsWith: skuPrefix } } },
      select: { orderId: true },
      distinct: ['orderId'],
    });
    if (orderIds.length > 0) {
      await prisma.order.deleteMany({
        where: { id: { in: orderIds.map((o) => o.orderId) } },
      });
    }
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

  async function getCustomerAccessToken(): Promise<string> {
    const email = `e2e-customer-${randomUUID()}@example.com`;
    const password = 'password123';
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201);
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    return (loginResponse.body as { accessToken: string }).accessToken;
  }

  async function createProduct(
    adminToken: string,
    overrides: Partial<{ priceCents: number; stockQuantity: number }> = {},
  ): Promise<ProductResponse> {
    skuCounter += 1;
    const response = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sku: `${skuPrefix}${skuCounter}`,
        name: `Order test product ${skuCounter}`,
        category: `Category-${runId}`,
        priceCents: overrides.priceCents ?? 1000,
        stockQuantity: overrides.stockQuantity ?? 5,
      })
      .expect(201);
    return response.body as ProductResponse;
  }

  async function setStock(
    adminToken: string,
    productId: string,
    stockQuantity: number,
  ): Promise<void> {
    await request(app.getHttpServer())
      .patch(`/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ stockQuantity })
      .expect(200);
  }

  async function addToCart(
    customerToken: string,
    productId: string,
    quantity: number,
  ): Promise<void> {
    await request(app.getHttpServer())
      .post('/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId, quantity })
      .expect(201);
  }

  async function getCart(customerToken: string): Promise<CartResponse> {
    const response = await request(app.getHttpServer())
      .get('/cart')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    return response.body as CartResponse;
  }

  it('rejects placing an order with no bearer token', async () => {
    await request(app.getHttpServer()).post('/orders').expect(401);
  });

  it('rejects placing an order from an empty cart', async () => {
    const customerToken = await getCustomerAccessToken();

    const response = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(409);

    expect((response.body as { message: string }).message).toContain('empty');
  });

  it('places an order, decrements stock for each line, and empties the cart - as a single transaction', async () => {
    const adminToken = await getAdminAccessToken();
    const customerToken = await getCustomerAccessToken();
    const productA = await createProduct(adminToken, {
      priceCents: 1000,
      stockQuantity: 5,
    });
    const productB = await createProduct(adminToken, {
      priceCents: 500,
      stockQuantity: 3,
    });
    await addToCart(customerToken, productA.id, 2);
    await addToCart(customerToken, productB.id, 1);

    const response = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(201);
    const order = response.body as OrderResponse;

    expect(order.items).toHaveLength(2);
    expect(order.subtotalCents).toBe(1000 * 2 + 500);
    expect(order.totalCents).toBe(order.subtotalCents);

    const [reloadedA, reloadedB] = await Promise.all([
      prisma.product.findUniqueOrThrow({ where: { id: productA.id } }),
      prisma.product.findUniqueOrThrow({ where: { id: productB.id } }),
    ]);
    expect(reloadedA.stockQuantity).toBe(3);
    expect(reloadedB.stockQuantity).toBe(2);

    const cart = await getCart(customerToken);
    expect(cart.items).toHaveLength(0);
  });

  it('rejects when stock drops below the cart quantity between add-to-cart and checkout, without decrementing stock or clearing the cart', async () => {
    const adminToken = await getAdminAccessToken();
    const customerToken = await getCustomerAccessToken();
    const product = await createProduct(adminToken, {
      priceCents: 1000,
      stockQuantity: 5,
    });
    await addToCart(customerToken, product.id, 3);
    // Simulates a race: stock drops after the item was added to the cart.
    await setStock(adminToken, product.id, 1);

    const response = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(409);
    expect((response.body as { message: string }).message).toContain('stock');

    const reloaded = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
    });
    expect(reloaded.stockQuantity).toBe(1);

    const cart = await getCart(customerToken);
    expect(cart.items).toEqual([
      expect.objectContaining({ productId: product.id, quantity: 3 }),
    ]);
  });

  it('rolls back the whole transaction when only one of several lines runs out of stock - no partial decrement', async () => {
    const adminToken = await getAdminAccessToken();
    const customerToken = await getCustomerAccessToken();
    const productOk = await createProduct(adminToken, {
      priceCents: 1000,
      stockQuantity: 5,
    });
    const productShort = await createProduct(adminToken, {
      priceCents: 1000,
      stockQuantity: 5,
    });
    await addToCart(customerToken, productOk.id, 2);
    await addToCart(customerToken, productShort.id, 2);
    // Only productShort becomes insufficient; productOk still has plenty.
    await setStock(adminToken, productShort.id, 1);

    await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(409);

    // The line that could have succeeded on its own must NOT have been
    // decremented - proof the two writes shared one transaction rather
    // than being applied independently.
    const reloadedOk = await prisma.product.findUniqueOrThrow({
      where: { id: productOk.id },
    });
    expect(reloadedOk.stockQuantity).toBe(5);

    const cart = await getCart(customerToken);
    expect(cart.items).toHaveLength(2);
  });

  describe('order status lifecycle', () => {
    async function placeOrder(
      adminToken: string,
      customerToken: string,
    ): Promise<OrderResponse> {
      const product = await createProduct(adminToken);
      await addToCart(customerToken, product.id, 1);
      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(201);
      return response.body as OrderResponse;
    }

    it('is created as PENDING', async () => {
      const adminToken = await getAdminAccessToken();
      const customerToken = await getCustomerAccessToken();

      const order = await placeOrder(adminToken, customerToken);

      expect(order.status).toBe('PENDING');
    });

    it('lets an admin advance the order through PENDING -> PAID -> SHIPPED -> DELIVERED', async () => {
      const adminToken = await getAdminAccessToken();
      const customerToken = await getCustomerAccessToken();
      const order = await placeOrder(adminToken, customerToken);

      for (const status of ['PAID', 'SHIPPED', 'DELIVERED']) {
        const response = await request(app.getHttpServer())
          .patch(`/orders/${order.id}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status })
          .expect(200);
        expect((response.body as OrderResponse).status).toBe(status);
      }
    });

    it('rejects an illegal transition (Delivered -> Pending) with a domain error', async () => {
      const adminToken = await getAdminAccessToken();
      const customerToken = await getCustomerAccessToken();
      const order = await placeOrder(adminToken, customerToken);
      for (const status of ['PAID', 'SHIPPED', 'DELIVERED']) {
        await request(app.getHttpServer())
          .patch(`/orders/${order.id}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status })
          .expect(200);
      }

      const response = await request(app.getHttpServer())
        .patch(`/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PENDING' })
        .expect(409);
      expect((response.body as { message: string }).message).toContain(
        'DELIVERED',
      );
    });

    it('forbids a customer from updating order status', async () => {
      const adminToken = await getAdminAccessToken();
      const customerToken = await getCustomerAccessToken();
      const order = await placeOrder(adminToken, customerToken);

      await request(app.getHttpServer())
        .patch(`/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'PAID' })
        .expect(403);
    });

    it('returns 404 for a non-existent order', async () => {
      const adminToken = await getAdminAccessToken();

      await request(app.getHttpServer())
        .patch(`/orders/${randomUUID()}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PAID' })
        .expect(404);
    });

    it('restores the reserved stock when an order is cancelled', async () => {
      const adminToken = await getAdminAccessToken();
      const customerToken = await getCustomerAccessToken();
      const product = await createProduct(adminToken, { stockQuantity: 5 });
      await addToCart(customerToken, product.id, 2);
      const placeResponse = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(201);
      const order = placeResponse.body as OrderResponse;

      const afterPlacement = await prisma.product.findUniqueOrThrow({
        where: { id: product.id },
      });
      expect(afterPlacement.stockQuantity).toBe(3);

      await request(app.getHttpServer())
        .patch(`/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CANCELLED' })
        .expect(200);

      const afterCancellation = await prisma.product.findUniqueOrThrow({
        where: { id: product.id },
      });
      expect(afterCancellation.stockQuantity).toBe(5);
    });
  });

  describe('order cancellation (shopper-initiated)', () => {
    async function placeOrder(
      adminToken: string,
      customerToken: string,
      productOverrides?: Partial<{ priceCents: number; stockQuantity: number }>,
    ): Promise<{ order: OrderResponse; product: ProductResponse }> {
      const product = await createProduct(adminToken, productOverrides);
      await addToCart(customerToken, product.id, 1);
      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(201);
      return { order: response.body as OrderResponse, product };
    }

    it('rejects cancelling with no bearer token', async () => {
      await request(app.getHttpServer())
        .post(`/orders/${randomUUID()}/cancel`)
        .expect(401);
    });

    it('lets a customer cancel their own PENDING order and restores stock', async () => {
      const adminToken = await getAdminAccessToken();
      const customerToken = await getCustomerAccessToken();
      const { order, product } = await placeOrder(adminToken, customerToken, {
        stockQuantity: 5,
      });

      const afterPlacement = await prisma.product.findUniqueOrThrow({
        where: { id: product.id },
      });
      expect(afterPlacement.stockQuantity).toBe(4);

      const response = await request(app.getHttpServer())
        .post(`/orders/${order.id}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);
      expect((response.body as OrderResponse).status).toBe('CANCELLED');

      const afterCancellation = await prisma.product.findUniqueOrThrow({
        where: { id: product.id },
      });
      expect(afterCancellation.stockQuantity).toBe(5);
    });

    it('lets a customer cancel their own PAID order', async () => {
      const adminToken = await getAdminAccessToken();
      const customerToken = await getCustomerAccessToken();
      const { order } = await placeOrder(adminToken, customerToken);
      await request(app.getHttpServer())
        .patch(`/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PAID' })
        .expect(200);

      const response = await request(app.getHttpServer())
        .post(`/orders/${order.id}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);
      expect((response.body as OrderResponse).status).toBe('CANCELLED');
    });

    it('rejects cancelling once the order has shipped', async () => {
      const adminToken = await getAdminAccessToken();
      const customerToken = await getCustomerAccessToken();
      const { order } = await placeOrder(adminToken, customerToken);
      for (const status of ['PAID', 'SHIPPED']) {
        await request(app.getHttpServer())
          .patch(`/orders/${order.id}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status })
          .expect(200);
      }

      const response = await request(app.getHttpServer())
        .post(`/orders/${order.id}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(409);
      expect((response.body as { message: string }).message).toContain(
        'SHIPPED',
      );
    });

    it("rejects cancelling another customer's order as if it didn't exist", async () => {
      const adminToken = await getAdminAccessToken();
      const customerToken = await getCustomerAccessToken();
      const otherCustomerToken = await getCustomerAccessToken();
      const { order } = await placeOrder(adminToken, customerToken);

      await request(app.getHttpServer())
        .post(`/orders/${order.id}/cancel`)
        .set('Authorization', `Bearer ${otherCustomerToken}`)
        .expect(404);

      const stillPending = await request(app.getHttpServer())
        .patch(`/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PAID' })
        .expect(200);
      expect((stillPending.body as OrderResponse).status).toBe('PAID');
    });

    it('returns 404 for a non-existent order', async () => {
      const customerToken = await getCustomerAccessToken();

      await request(app.getHttpServer())
        .post(`/orders/${randomUUID()}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(404);
    });
  });
});
