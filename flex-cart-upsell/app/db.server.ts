import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient;
}

if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient();
  }
}

const prisma = global.prismaGlobal ?? new PrismaClient();

let sessionTableReady: Promise<void> | undefined;

/**
 * Repairs a CamoSignal database whose original Session migration is recorded
 * as applied even though the physical table was removed. This runs once per
 * server instance and is safe after the table has been restored.
 */
export function ensureSessionTable() {
  if (!sessionTableReady) {
    sessionTableReady = prisma
      .$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Session" (
          "id" TEXT NOT NULL,
          "shop" TEXT NOT NULL,
          "state" TEXT NOT NULL,
          "isOnline" BOOLEAN NOT NULL DEFAULT false,
          "scope" TEXT,
          "expires" TIMESTAMP(3),
          "accessToken" TEXT NOT NULL,
          "userId" BIGINT,
          "firstName" TEXT,
          "lastName" TEXT,
          "email" TEXT,
          "accountOwner" BOOLEAN NOT NULL DEFAULT false,
          "locale" TEXT,
          "collaborator" BOOLEAN DEFAULT false,
          "emailVerified" BOOLEAN DEFAULT false,
          "refreshToken" TEXT,
          "refreshTokenExpires" TIMESTAMP(3),
          CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
        )
      `)
      .then(() => undefined)
      .catch((error) => {
        sessionTableReady = undefined;
        throw error;
      });
  }

  return sessionTableReady;
}

export default prisma;
