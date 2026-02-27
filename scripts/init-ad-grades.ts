/**
 * 기존 유료 광고의 durationDays를 합산하여 User.totalPaidAdDays 초기화
 * 실행: npx tsx scripts/init-ad-grades.ts
 * 프로덕션: set -a && . .env.vercel-production && set +a && npx tsx scripts/init-ad-grades.ts
 */
import "dotenv/config";
import pg from "pg";
import { guardSafeOperation } from "./db-safety";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  guardSafeOperation("User.totalPaidAdDays 초기화", process.env.DATABASE_URL);

  const client = await pool.connect();
  try {
    // 유료 광고(FREE 제외)의 durationDays를 유저별로 합산
    const { rows } = await client.query(`
      SELECT a."userId", COALESCE(SUM(a."durationDays"), 0)::int AS total_days
      FROM ads a
      WHERE a."productId" != 'FREE'
        AND a.status IN ('ACTIVE', 'EXPIRED')
      GROUP BY a."userId"
    `);

    console.log(`대상 유저: ${rows.length}명`);

    let updated = 0;
    for (const row of rows) {
      if (row.total_days > 0) {
        await client.query(
          `UPDATE users SET "totalPaidAdDays" = $1 WHERE id = $2`,
          [row.total_days, row.userId]
        );
        updated++;
        console.log(`  ${row.userId}: ${row.total_days}일`);
      }
    }

    console.log(`완료: ${updated}명 업데이트`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
