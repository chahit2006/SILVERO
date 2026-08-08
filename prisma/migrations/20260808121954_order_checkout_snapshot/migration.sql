/*
  Warnings:

  - Added the required column `contactEmail` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactFirstName` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactLastName` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactPhone` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shippingCity` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shippingLine1` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shippingPincode` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shippingState` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "contactEmail" TEXT NOT NULL,
ADD COLUMN     "contactFirstName" TEXT NOT NULL,
ADD COLUMN     "contactLastName" TEXT NOT NULL,
ADD COLUMN     "contactPhone" TEXT NOT NULL,
ADD COLUMN     "deliveryMethod" TEXT NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "shippingCity" TEXT NOT NULL,
ADD COLUMN     "shippingCountry" TEXT NOT NULL DEFAULT 'India',
ADD COLUMN     "shippingLine1" TEXT NOT NULL,
ADD COLUMN     "shippingLine2" TEXT,
ADD COLUMN     "shippingPincode" TEXT NOT NULL,
ADD COLUMN     "shippingState" TEXT NOT NULL;
