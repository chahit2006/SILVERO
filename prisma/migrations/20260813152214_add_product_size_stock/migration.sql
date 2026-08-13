-- CreateTable
CREATE TABLE "ProductSizeStock" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductSizeStock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductSizeStock_productId_size_key" ON "ProductSizeStock"("productId", "size");

-- AddForeignKey
ALTER TABLE "ProductSizeStock" ADD CONSTRAINT "ProductSizeStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill (PRODUCT_MGMT_PHASE_PLAN.md Phase 3, "Migration/backfill —
-- explicitly not guessed"): one ProductSizeStock row per existing
-- sizeOptions entry, stock = 0. Product.stock is deliberately left
-- untouched — splitting/dividing/copying the existing flat count across
-- sizes would be inventing data nobody confirmed. Sizeless products
-- (sizeOptions = '{}') produce no rows via unnest() and keep Product.stock
-- as their only source of truth. gen_random_uuid() is core Postgres since
-- v13; guarded with pgcrypto for older instances.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO "ProductSizeStock" ("id", "productId", "size", "stock")
SELECT gen_random_uuid()::text, p."id", s.size, 0
FROM "Product" p, unnest(p."sizeOptions") AS s(size)
ON CONFLICT ("productId", "size") DO NOTHING;
