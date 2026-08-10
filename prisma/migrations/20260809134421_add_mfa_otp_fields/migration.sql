-- AlterTable
ALTER TABLE "User" ADD COLUMN     "otpAttemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "otpExpiresAt" TIMESTAMP(3),
ADD COLUMN     "otpHash" TEXT;
