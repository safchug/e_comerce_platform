-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- AlterTable
-- Backfill existing rows with a placeholder category, then drop the default
-- so new rows are required to specify one explicitly (enforced by the domain layer).
ALTER TABLE "products" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'uncategorized';
ALTER TABLE "products" ALTER COLUMN "category" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "products_name_idx" ON "products" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "products_category_priceCents_idx" ON "products"("category", "priceCents");

-- CreateIndex
CREATE INDEX "products_priceCents_idx" ON "products"("priceCents");
