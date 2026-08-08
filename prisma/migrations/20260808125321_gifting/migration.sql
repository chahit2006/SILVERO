-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "registryItemId" TEXT;

-- AlterTable
ALTER TABLE "GiftCard" ADD COLUMN     "buyerEmail" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "buyerPhone" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shippingCity" TEXT,
ADD COLUMN     "shippingCountry" TEXT DEFAULT 'India',
ADD COLUMN     "shippingLine1" TEXT,
ADD COLUMN     "shippingLine2" TEXT,
ADD COLUMN     "shippingPincode" TEXT,
ADD COLUMN     "shippingState" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "registryItemId" TEXT;
