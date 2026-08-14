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

/** Escapes Prisma/Postgres ILIKE wildcards so a literal `%` or `_` in user input is matched literally. */
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

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
        ? {
            name: {
              contains: escapeLikePattern(name),
              mode: 'insensitive' as const,
            },
          }
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

  async findDistinctCategories({
    activeOnly,
  }: {
    activeOnly?: boolean;
  }): Promise<string[]> {
    // groupBy pushes distinctness down to SQL (GROUP BY); findMany({ distinct })
    // fetches every matching row and dedupes client-side.
    const rows = await this.prisma.product.groupBy({
      by: ['category'],
      where: activeOnly ? { active: true } : undefined,
      orderBy: { category: 'asc' },
    });
    return rows.map((row) => row.category);
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
        stockQuantity: product.stockQuantity,
      },
      update: {
        sku: product.sku,
        name: product.name,
        category: product.category,
        description: product.description,
        priceCents: product.price.getCents(),
        currency: product.price.getCurrency(),
        active: product.active,
        stockQuantity: product.stockQuantity,
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
      stockQuantity: row.stockQuantity,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
