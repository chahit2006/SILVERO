-- ADMIN_PANEL_SPEC.md §1/§7 — Role enum + User.role.

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'CIRCLE', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'CUSTOMER';

-- Backfill. Every existing Circle member predates this column and would
-- otherwise be left at the CUSTOMER default, breaking the DATA_MODEL.md
-- invariant that a CircleMembership row and role = CIRCLE always agree.
-- No row is backfilled to ADMIN — admins are promoted deliberately, one at a
-- time, via prisma/promote-admin.ts.
UPDATE "User"
SET "role" = 'CIRCLE'
WHERE "id" IN (SELECT "userId" FROM "CircleMembership");
