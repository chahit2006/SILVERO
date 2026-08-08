import { PrismaClient } from "@prisma/client";

// Standard Next.js dev-mode singleton — prevents exhausting the Postgres
// connection pool from hot-reload creating a new PrismaClient on every edit.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
