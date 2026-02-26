/**
 * 기존 게시글에 slug 생성 마이그레이션 스크립트
 * 실행: npx tsx scripts/migrate-slugs.ts
 */
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

function generateSlugFromTitle(title: string): string {
  return title
    .replace(/[ㄱ-ㅎㅏ-ㅣ]+/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 60)
    .replace(/-$/, "")
    || "post";
}

async function main() {
  const client = await pool.connect();
  try {
    // slug가 null인 게시글 조회
    const { rows: posts } = await client.query(
      `SELECT id, title FROM posts WHERE slug IS NULL ORDER BY "createdAt" ASC`
    );

    console.log(`slug 없는 게시글: ${posts.length}개`);

    const usedSlugs = new Set<string>();
    let updated = 0;

    for (const post of posts) {
      const baseSlug = generateSlugFromTitle(post.title);
      let slug = baseSlug;
      let suffix = 2;

      // 메모리 + DB 중복 체크
      while (true) {
        if (!usedSlugs.has(slug)) {
          const { rows } = await client.query(
            `SELECT id FROM posts WHERE slug = $1`, [slug]
          );
          if (rows.length === 0) break;
        }
        slug = `${baseSlug}-${suffix}`;
        suffix++;
      }

      try {
        await client.query(
          `UPDATE posts SET slug = $1 WHERE id = $2`, [slug, post.id]
        );
        usedSlugs.add(slug);
        updated++;
      } catch (err) {
        console.error(`Failed: ${post.id} (${post.title}) → ${slug}`, err);
      }
    }

    console.log(`완료: ${updated}/${posts.length}개 업데이트`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
