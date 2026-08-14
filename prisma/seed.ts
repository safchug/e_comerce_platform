/**
 * Dev-only seed script: fills the catalog with a large, varied set of products
 * so the /products search/filter/pagination endpoints have something realistic
 * to filter (many categories, overlapping names, a wide price spread).
 *
 * Run with: `npm run db:seed` (override count with `npm run db:seed -- --count=2000`,
 * override the PRNG seed with `--seed=123`; both default to fixed values so runs
 * are reproducible - useful when comparing `EXPLAIN` output across changes).
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
const DEFAULT_SEED = 42;
const INACTIVE_RATE = 0.08;
const INSERT_CHUNK_SIZE = 1000;
const MIN_STOCK_QUANTITY = 0;
const MAX_STOCK_QUANTITY = 200;

function parseIntArg(flag: string, fallback: number): number {
  const arg = process.argv.find((a) => a.startsWith(`--${flag}=`));
  if (!arg) return fallback;

  const raw = arg.slice(`--${flag}=`.length);
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(
      `Invalid --${flag}=${raw}: expected a positive integer.`,
    );
  }
  return value;
}

/** Mulberry32: small, seeded PRNG so seeded runs are reproducible across machines. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return function random(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function main(): Promise<void> {
  const count = parseIntArg('count', DEFAULT_COUNT);
  const seed = parseIntArg('seed', DEFAULT_SEED);
  const random = createRandom(seed);
  const randomInt = (min: number, max: number): number =>
    Math.floor(random() * (max - min + 1)) + min;
  const pick = <T,>(items: T[]): T => items[randomInt(0, items.length - 1)];

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
        active: random() >= INACTIVE_RATE,
        stockQuantity: randomInt(MIN_STOCK_QUANTITY, MAX_STOCK_QUANTITY),
        createdAt: now,
        updatedAt: now,
      };
    });

    for (const batch of chunk(products, INSERT_CHUNK_SIZE)) {
      await prisma.product.createMany({ data: batch });
    }

    console.log(
      `Seeded ${products.length} products across ${CATEGORIES.length} categories (seed=${seed}).`,
    );
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
