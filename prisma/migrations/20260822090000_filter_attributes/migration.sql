-- FILTER_SPEC_IMPLEMENTATION.md Part 1 — admin-managed filter attributes.
-- Headings are fixed in code (lib/attributes.ts); rows here are upserted by
-- prisma/seed-attributes.ts, which also backfills the options already in use
-- by existing products so nothing disappears from the PLP on deploy.

CREATE TABLE "FilterHeading" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,

    CONSTRAINT "FilterHeading_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FilterOption" (
    "id" TEXT NOT NULL,
    "headingId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FilterOption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FilterHeading_key_key" ON "FilterHeading"("key");
CREATE INDEX "FilterOption_headingId_sortOrder_idx" ON "FilterOption"("headingId", "sortOrder");
CREATE UNIQUE INDEX "FilterOption_headingId_label_key" ON "FilterOption"("headingId", "label");

ALTER TABLE "FilterOption" ADD CONSTRAINT "FilterOption_headingId_fkey" FOREIGN KEY ("headingId") REFERENCES "FilterHeading"("id") ON DELETE CASCADE ON UPDATE CASCADE;
