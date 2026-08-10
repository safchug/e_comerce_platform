/**
 * Dev-only seed script: fills the catalog with a large, varied set of products
 * so the /products search/filter/pagination endpoints have something realistic
 * to filter (many categories, overlapping names, a wide price spread).
 *
 * Run with: `npm run db:seed` (override count with `npm run db:seed -- --count=2000`).
 * Re-running is safe: it only deletes/replaces the products it previously seeded
 * (SKUs prefixed with SEED-) and leaves any manually created products alone.
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

interface CategorySpec {
  name: string;
  adjectives: string[];
  nouns: string[];
  minPriceCents: number;
  maxPriceCents: number;
}

const CATEGORIES: CategorySpec[] = [
  {
    name: 'Electronics',
    adjectives: ['Wireless', 'Bluetooth', 'Smart', 'Portable', '4K', 'Noise-Cancelling', 'USB-C'],
    nouns: ['Headphones', 'Speaker', 'Mouse', 'Keyboard', 'Monitor', 'Charger', 'Camera', 'Router', 'Tablet', 'Laptop'],
    minPriceCents: 1500,
    maxPriceCents: 250000,
  },
  {
    name: 'Books',
    adjectives: ['Illustrated', 'Bestselling', 'Pocket', 'Classic', 'Annotated'],
    nouns: ['Novel', 'Cookbook', 'Biography', 'Field Guide', 'Journal', 'Atlas'],
    minPriceCents: 500,
    maxPriceCents: 6000,
  },
  {
    name: 'Home & Kitchen',
    adjectives: ['Stainless Steel', 'Non-Stick', 'Ceramic', 'Compact', 'Insulated'],
    nouns: ['Blender', 'Cookware Set', 'Coffee Maker', 'Knife Set', 'Toaster', 'Air Fryer', 'Kettle'],
    minPriceCents: 1200,
    maxPriceCents: 40000,
  },
  {
    name: 'Toys & Games',
    adjectives: ['Wooden', 'Educational', 'Glow-in-the-Dark', 'Collectible', 'Interactive'],
    nouns: ['Puzzle', 'Board Game', 'Action Figure', 'Building Blocks', 'Plush Toy', 'Card Game'],
    minPriceCents: 500,
    maxPriceCents: 9000,
  },
  {
    name: 'Clothing',
    adjectives: ['Slim-Fit', 'Organic Cotton', 'Waterproof', 'Reversible', 'Lightweight'],
    nouns: ['T-Shirt', 'Jacket', 'Jeans', 'Sneakers', 'Hoodie', 'Scarf', 'Hat'],
    minPriceCents: 1000,
    maxPriceCents: 18000,
  },
  {
    name: 'Sports & Outdoors',
    adjectives: ['Adjustable', 'Foldable', 'All-Terrain', 'Heavy-Duty', 'Ultralight'],
    nouns: ['Yoga Mat', 'Tent', 'Backpack', 'Dumbbell Set', 'Bicycle', 'Water Bottle', 'Hiking Boots'],
    minPriceCents: 1500,
    maxPriceCents: 60000,
  },
  {
    name: 'Beauty',
    adjectives: ['Hydrating', 'Fragrance-Free', 'Vegan', 'Matte', 'Long-Lasting'],
    nouns: ['Moisturizer', 'Shampoo', 'Lipstick', 'Sunscreen', 'Serum', 'Perfume'],
    minPriceCents: 400,
    maxPriceCents: 8000,
  },
  {
    name: 'Grocery',
    adjectives: ['Organic', 'Gluten-Free', 'Fair-Trade', 'Low-Sodium', 'Artisan'],
    nouns: ['Coffee Beans', 'Olive Oil', 'Pasta', 'Granola', 'Honey', 'Tea'],
    minPriceCents: 150,
    maxPriceCents: 3500,
  },
];

const SEEDED_SKU_PREFIX = 'SEED-';
const DEFAULT_COUNT = 500;
const INACTIVE_RATE = 0.08;

function parseCount(): number {
  const arg = process.argv.find((a) => a.startsWith('--count='));
  const count = arg ? Number(arg.split('=')[1]) : DEFAULT_COUNT;
  return Number.isInteger(count) && count > 0 ? count : DEFAULT_COUNT;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
}

async function main(): Promise<void> {
  const count = parseCount();
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    const { count: deleted } = await prisma.product.deleteMany({
      where: { sku: { startsWith: SEEDED_SKU_PREFIX } },
    });
    console.log(`Removed ${deleted} previously seeded product(s).`);

    const now = new Date();
    const products = Array.from({ length: count }, (_, i) => {
      const category = pick(CATEGORIES);
      const name = `${pick(category.adjectives)} ${pick(category.nouns)}`;
      return {
        id: randomUUID(),
        sku: `${SEEDED_SKU_PREFIX}${String(i + 1).padStart(5, '0')}`,
        name,
        category: category.name,
        description: `${name} - ${category.name} item for catalog testing`,
        priceCents: randomInt(category.minPriceCents, category.maxPriceCents),
        currency: 'USD',
        active: Math.random() >= INACTIVE_RATE,
        createdAt: now,
        updatedAt: now,
      };
    });

    await prisma.product.createMany({ data: products });

    console.log(`Seeded ${products.length} products across ${CATEGORIES.length} categories.`);
    for (const category of CATEGORIES) {
      const inCategory = products.filter((p) => p.category === category.name);
      console.log(
        `  ${category.name}: ${inCategory.length} products, ` +
          `$${(category.minPriceCents / 100).toFixed(2)}-$${(category.maxPriceCents / 100).toFixed(2)}`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
