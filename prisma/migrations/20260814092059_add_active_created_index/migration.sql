-- CreateIndex
CREATE INDEX "products_active_createdAt_idx" ON "products"("active", "createdAt" DESC);
