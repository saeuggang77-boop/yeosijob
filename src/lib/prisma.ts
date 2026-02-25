import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * bigint → number 재귀 변환
 * PrismaPg 어댑터가 count() 등에서 bigint를 반환하여
 * JSON 직렬화 시 0이 되는 문제를 근본적으로 해결
 */
function convertBigInts(obj: unknown): unknown {
  if (typeof obj === "bigint") return Number(obj);
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(convertBigInts);
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = convertBigInts(value);
    }
    return result;
  }
  return obj;
}

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });

  return client.$extends({
    query: {
      $allOperations({ args, query }) {
        return query(args).then((result) => convertBigInts(result));
      },
    },
  }) as unknown as PrismaClient;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
