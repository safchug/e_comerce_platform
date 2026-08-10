import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database';
import type { Product as PrismaProductRow } from '../../../../infrastructure/database/prisma-client';
import { Money } from '../../../../domain/shared/money';
import {
  FindAllParams,
  FindAllResult,
  ProductRepository,
} from '../../domain/product.repository';
import { Product } from '../../domain/product.entity';

@Injectable()
export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Product | null> {
    const row = await this.prisma.product.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findBySku(sku: string): Promise<Product | null> {
    const row = await this.prisma.product.findUnique({ where: { sku } });
    return row ? this.toDomain(row) : null;
  }

  async findAll({
    skip,
    take,
    activeOnly,
    name,
    category,
    minPriceCents,
    maxPriceCents,
  }: FindAllParams): Promise<FindAllResult> {
    const where = {
      ...(activeOnly ? { active: true } : {}),
      ...(name
        ? { name: { contains: name, mode: 'insensitive' as const } }
        : {}),
      ...(category ? { category } : {}),
      ...(minPriceCents !== undefined || maxPriceCents !== undefined
        ? {
            priceCents: {
              ...(minPriceCents !== undefined ? { gte: minPriceCents } : {}),
              ...(maxPriceCents !== undefined ? { lte: maxPriceCents } : {}),
            },
          }
        : {}),
    };
    // One findMany + one count - avoids per-row queries (N+1) for pagination metadata.
    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);
    return { items: rows.map((row) => this.toDomain(row)), total };
  }

  async save(product: Product): Promise<Product> {
    const row = await this.prisma.product.upsert({
      where: { id: product.id },
      create: {
        id: product.id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        description: product.description,
        priceCents: product.price.getCents(),
        currency: product.price.getCurrency(),
        active: product.active,
      },
      update: {
        sku: product.sku,
        name: product.name,
        category: product.category,
        description: product.description,
        priceCents: product.price.getCents(),
        currency: product.price.getCurrency(),
        active: product.active,
      },
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({ where: { id } });
  }

  private toDomain(row: PrismaProductRow): Product {
    return Product.create({
      id: row.id,
      sku: row.sku,
      name: row.name,
      category: row.category,
      description: row.description,
      price: Money.fromCents(row.priceCents, row.currency),
      active: row.active,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
