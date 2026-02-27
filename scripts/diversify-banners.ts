/**
 * 배너 템플릿/색상을 다양하게 분산 배정
 * 실행: npx tsx scripts/diversify-banners.ts
 * 프로덕션: set -a && . .env.vercel-production && set +a && npx tsx scripts/diversify-banners.ts
 */
import "dotenv/config";
import pg from "pg";
import { guardSafeOperation } from "./db-safety";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  guardSafeOperation("배너 템플릿/색상 분산 배정", process.env.DATABASE_URL);

  const client = await pool.connect();
  try {
    const { rows: ads } = await client.query(
      `SELECT id, "bannerTemplate", "bannerColor" FROM ads ORDER BY "createdAt" ASC`
    );

    console.log(`대상 광고: ${ads.length}건`);

    let updated = 0;
    for (let i = 0; i < ads.length; i++) {
      const template = i % 30; // 0~29 템플릿 순환
      const color = i % 15;    // 0~14 색상 순환

      await client.query(
        `UPDATE ads SET "bannerTemplate" = $1, "bannerColor" = $2 WHERE id = $3`,
        [template, color, ads[i].id]
      );
      updated++;
    }

    console.log(`완료: ${updated}건 업데이트`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
