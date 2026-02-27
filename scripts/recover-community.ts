/**
 * 커뮤니티 콘텐츠 복구 스크립트
 * DB 재시드 후 커뮤니티 게시글/댓글/좋아요/공지 복원
 *
 * 실행: npx tsx scripts/recover-community.ts
 * 프로덕션: set -a && . .env.vercel-production && set +a && npx tsx scripts/recover-community.ts
 */
import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

type GhostUser = { id: string; name: string | null };
type Category = "CHAT" | "BEAUTY" | "QNA" | "WORK";

// 카테고리별 게시글 템플릿
const POST_TEMPLATES: Record<Category, Array<{ title: string; content: string }>> = {
  CHAT: [
    { title: "오늘 손님이 진짜 웃긴 분 오셨어요 ㅋㅋㅋ", content: "아니 진짜 오늘 손님 중에 한 분이 너무 웃기셨어요 ㅋㅋㅋ\n\n분위기도 좋고 팁도 주시고 너무 좋았어요 😊\n\n이런 손님들만 오시면 좋겠다..." },
    { title: "헤어 어디서 하세요? 추천 좀..", content: "언니들 헤어 어디서 하세요?\n저 담주에 염색 다시 해야되는데 잘하는 곳 추천 좀 부탁드려요 🙏\n\n강남/역삼 쪽이면 더 좋구요!" },
    { title: "오늘 날씨 진짜 좋다 💕", content: "오늘 날씨 진짜 좋은데 낮에 산책이라도 하고 싶네요...\n\n근데 밤 일하면 낮에는 잠자는게 최고긴 함 ㅋㅋㅋ\n\n언니들은 낮에 주로 뭐하세요?" },
    { title: "헬스장 등록했는데 안가게 되네요 ㅠ", content: "작년에 헬스장 등록했는데 요즘 또 안가고 있어요 ㅠㅠ\n\n돈만 나가고... 언니들은 운동 꾸준히 하시나요?\n\n동기부여 좀 해주세요 🥺" },
    { title: "이번주도 화이팅입니다 💪", content: "다들 이번주도 화이팅하시길!\n\n날씨도 좋고 손님들도 좋은 분들만 오셨으면 좋겠네요 ㅎㅎ\n\n오늘도 좋은 하루 보내세요!" },
  ],
  BEAUTY: [
    { title: "네일 새로 받았어요 💅", content: "오늘 네일 새로 받았는데 너무 예쁘게 나왔어요!\n\n이번엔 프렌치로 했는데 심플해서 더 좋은 것 같아요 ✨\n\n언니들은 어떤 디자인 좋아하세요?" },
    { title: "다이어트 성공하신 분 계세요?", content: "진짜 다이어트가 제일 어려운 것 같아요 ㅠㅠ\n\n작심삼일이 계속 반복되네요...\n\n성공하신 분들 비법 좀 알려주세요! 🙏" },
    { title: "요즘 립스틱 뭐 쓰세요?", content: "요즘 쓰던 립스틱이 다 떨어져서 새로 사려고 하는데\n추천 좀 해주세요!\n\n지속력 좋고 발색 예쁜거요 💄" },
    { title: "피부과 추천 부탁드려요", content: "레이저 시술 받으려고 하는데 어디가 좋을까요?\n\n강남 쪽에 괜찮은 곳 아시는 분 계시면 추천 부탁드립니다!\n\n가격대도 같이 알려주시면 감사하겠습니다 ☺️" },
    { title: "향수 추천 받아요~", content: "요즘 향수 새로 사려고 하는데\n뭐가 좋을까요?\n\n은은하고 오래가는거로 추천해주세요! 🌸" },
  ],
  QNA: [
    { title: "초보인데 급여 궁금해요", content: "안녕하세요 이제 막 시작하려고 하는데\n초보도 급여 괜찮게 받을 수 있나요?\n\n경험 있으신 분들 조언 부탁드립니다!" },
    { title: "면접 볼 때 뭘 물어보나요?", content: "다음주에 면접 보러 가는데 긴장되네요 ㅠㅠ\n\n보통 면접 때 어떤 질문들 하시나요?\n\n미리 준비하고 싶어서요!" },
    { title: "셔츠룸이랑 레깅스룸 차이가 뭔가요?", content: "업종 알아보는 중인데\n셔츠룸이랑 레깅스룸 차이를 모르겠어요 ㅠㅠ\n\n둘 다 해보신 분 계시면 차이점 알려주세요!" },
    { title: "세금 신고는 어떻게 하나요?", content: "일한지 좀 됐는데 세금 관련해서 궁금한게 있어요\n\n세금 신고 따로 해야 하나요?\n\n어떻게 처리하는지 알려주세요 🙏" },
    { title: "가게 옮기려고 하는데 조언 부탁드려요", content: "지금 일하는 곳에서 좀 불편한 일들이 생겨서\n가게 옮기려고 하는데\n\n다른 가게로 옮길 때 주의할 점 있을까요?" },
  ],
  WORK: [
    { title: "우리 가게 사장님 너무 좋으세요", content: "지금 일하는 곳 사장님이 진짜 좋으세요\n\n직원들 챙겨주시고 복지도 잘 되어있고...\n\n이런 곳에서 오래 일하고 싶네요 😊" },
    { title: "손님 응대할 때 팁 있나요?", content: "아직 초보라 손님 응대가 어려워요 ㅠㅠ\n\n어색하지 않게 대화하는 팁이 있을까요?\n\n선배님들 조언 부탁드립니다!" },
    { title: "야간 근무 체력 관리 어떻게 하세요?", content: "야간 근무하다보니 체력 관리가 힘들더라구요\n\n언니들은 체력 관리 어떻게 하시나요?\n\n영양제나 운동 같은거 하시는지 궁금해요!" },
    { title: "안전한 가게 구별법 알려주세요", content: "처음 시작하는데 안전한 가게를 찾고 싶어요\n\n어떤 부분을 확인해야 할까요?\n\n경험 많으신 분들 조언 부탁드립니다 🙏" },
    { title: "복장은 어떤게 좋을까요?", content: "출근할 때 복장 고민이에요\n\n어떤 스타일이 좋을까요?\n\n추천해주시면 감사하겠습니다!" },
  ],
};

const COMMENT_TEMPLATES = [
  "공감돼요!",
  "저도 그랬어요 ㅋㅋㅋ",
  "좋은 정보 감사합니다!",
  "저도 궁금했는데 도움 됐어요!",
  "언니 최고 👍",
  "나중에 저도 한번 가봐야겠어요",
  "완전 공감ㅠㅠ",
  "진짜 그렇죠 ㅋㅋ",
  "오 좋은데요!",
  "저도 같은 경험 있어요!",
  "정보 감사합니다 😊",
  "도움 많이 됐어요!",
  "저도 한번 해봐야겠어요",
  "완전 대박이네요!",
  "와 진짜요? 신기하다",
];

const REPLY_TEMPLATES = [
  "맞아요 ㅎㅎ",
  "그렇죠!",
  "감사해요!",
  "넵 도움 됐어요!",
  "좋은 정보 감사합니다 💕",
  "앞으로도 자주 올게요!",
  "저도 그렇게 생각해요",
  "완전 공감이에요",
  "ㅋㅋㅋ 맞아요",
  "그러게요!",
];

function generateSlug(title: string): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getRandomKSTDate(daysAgo: number): Date {
  const now = new Date();
  const kstOffset = 9 * 60; // KST is UTC+9
  const kstNow = new Date(now.getTime() + kstOffset * 60000);

  // 밤 시간대에 더 많이 분포 (14:00-04:00 KST)
  const isNightTime = Math.random() > 0.3; // 70% 밤 시간대

  let hour: number;
  if (isNightTime) {
    // 14:00-04:00 범위 (밤 시간대)
    const nightHours = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4];
    hour = nightHours[Math.floor(Math.random() * nightHours.length)];
  } else {
    // 04:00-14:00 범위 (낮 시간대)
    hour = 4 + Math.floor(Math.random() * 10);
  }

  const minute = Math.floor(Math.random() * 60);
  const second = Math.floor(Math.random() * 60);

  kstNow.setDate(kstNow.getDate() - daysAgo);
  kstNow.setHours(hour, minute, second, 0);

  // Convert back to UTC
  return new Date(kstNow.getTime() - kstOffset * 60000);
}

function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function pickRandomCount<T>(array: T[], min: number, max: number): T[] {
  const count = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

async function main() {
  const client = await pool.connect();

  try {
    console.log("🔍 데이터베이스 상태 확인 중...");

    // 1. Check ContentPool status
    const { rows: brokenPools } = await client.query(`
      SELECT cp.id, cp."publishedPostId"
      FROM content_pool cp
      WHERE cp."isUsed" = true
        AND cp."publishedPostId" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM posts p WHERE p.id = cp."publishedPostId"
        )
    `);

    if (brokenPools.length > 0) {
      console.log(`⚠️  삭제된 게시글을 참조하는 ContentPool ${brokenPools.length}건 발견`);
      await client.query(`
        UPDATE content_pool
        SET "isUsed" = false, "publishedPostId" = NULL
        WHERE "isUsed" = true
          AND "publishedPostId" IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM posts p WHERE p.id = "publishedPostId"
          )
      `);
      console.log("✅ ContentPool 상태 리셋 완료");
    }

    // 2. Check existing posts
    const { rows: [{ count: postCount }] } = await client.query(
      `SELECT COUNT(*)::int as count FROM posts`
    );

    console.log(`📊 현재 게시글: ${postCount}건`);

    if (postCount > 20) {
      console.log("ℹ️  이미 충분한 커뮤니티 게시글이 존재합니다. 게시글 생성을 건너뜁니다.");
    } else {
      console.log("📝 커뮤니티 게시글 생성 시작...");

      // Get ghost users
      const { rows: ghostUsers } = await client.query<GhostUser>(`
        SELECT id, name FROM users WHERE "isGhost" = true ORDER BY "createdAt"
      `);

      if (ghostUsers.length === 0) {
        console.error("❌ 유령 사용자가 없습니다. 먼저 시드를 실행해주세요.");
        return;
      }

      console.log(`👥 유령 사용자: ${ghostUsers.length}명`);

      // Create posts
      const categories: Category[] = ["CHAT", "BEAUTY", "QNA", "WORK"];
      const postsToCreate = 60;
      let createdPosts = 0;

      for (let i = 0; i < postsToCreate; i++) {
        const category = pickRandom(categories);
        const template = pickRandom(POST_TEMPLATES[category]);
        const author = pickRandom(ghostUsers);
        const daysAgo = Math.floor(Math.random() * 7); // 0-7 days ago
        const createdAt = getRandomKSTDate(daysAgo);
        const slug = generateSlug(template.title);
        const viewCount = Math.floor(Math.random() * 50);

        const { rows: [post] } = await client.query<{ id: string }>(
          `INSERT INTO posts (id, title, slug, content, category, "authorId", "viewCount", "isHidden", "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, false, $7, $7)
           RETURNING id`,
          [template.title, slug, template.content, category, author.id, viewCount, createdAt]
        );

        createdPosts++;

        // Create 2-5 comments per post
        const commentCount = 2 + Math.floor(Math.random() * 4);
        const commentAuthors = pickRandomCount(ghostUsers, commentCount, commentCount);

        for (let j = 0; j < commentCount; j++) {
          const commentContent = pickRandom(COMMENT_TEMPLATES);
          const commentAuthor = commentAuthors[j];
          const commentCreatedAt = new Date(createdAt.getTime() + (j + 1) * 1000 * 60 * Math.floor(Math.random() * 120)); // 0-120분 후

          const { rows: [comment] } = await client.query<{ id: string }>(
            `INSERT INTO comments (id, content, "authorId", "postId", "parentId", "createdAt")
             VALUES (gen_random_uuid(), $1, $2, $3, NULL, $4)
             RETURNING id`,
            [commentContent, commentAuthor.id, post.id, commentCreatedAt]
          );

          // Create 1-2 replies per comment (50% chance)
          if (Math.random() > 0.5) {
            const replyCount = 1 + Math.floor(Math.random() * 2);
            const replyAuthors = pickRandomCount(
              ghostUsers.filter(u => u.id !== commentAuthor.id),
              replyCount,
              replyCount
            );

            for (let k = 0; k < replyAuthors.length; k++) {
              const replyContent = pickRandom(REPLY_TEMPLATES);
              const replyAuthor = replyAuthors[k];
              const replyCreatedAt = new Date(commentCreatedAt.getTime() + (k + 1) * 1000 * 60 * Math.floor(Math.random() * 60)); // 0-60분 후

              await client.query(
                `INSERT INTO comments (id, content, "authorId", "postId", "parentId", "createdAt")
                 VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
                [replyContent, replyAuthor.id, post.id, comment.id, replyCreatedAt]
              );
            }
          }
        }

        // Add likes to some posts (30% chance)
        if (Math.random() > 0.7) {
          const likeCount = 1 + Math.floor(Math.random() * 5);
          const likers = pickRandomCount(ghostUsers, likeCount, likeCount);

          for (const liker of likers) {
            await client.query(
              `INSERT INTO post_likes (id, "userId", "postId", "createdAt")
               VALUES (gen_random_uuid(), $1, $2, $3)
               ON CONFLICT ("userId", "postId") DO NOTHING`,
              [liker.id, post.id, createdAt]
            );
          }
        }
      }

      console.log(`✅ 게시글 ${createdPosts}건 생성 완료`);
    }

    // 3. Create/update notices
    console.log("📢 공지사항 업데이트 중...");

    const { rows: [admin] } = await client.query<{ id: string }>(
      `SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1`
    );

    if (!admin) {
      console.error("❌ 관리자 계정이 없습니다.");
      return;
    }

    const notices = [
      {
        title: "여시잡 서비스 리뉴얼 안내",
        content: `안녕하세요, 여시잡입니다.

더 나은 서비스를 제공하기 위해 여시잡이 새롭게 리뉴얼되었습니다.

주요 개선사항:
• 모바일 최적화 및 반응형 디자인
• 커뮤니티 기능 강화
• 안전한 결제 시스템 도입
• 사용자 편의성 개선

앞으로도 여시잡을 많이 이용해주시기 바랍니다.
감사합니다.`,
        isPinned: true,
      },
      {
        title: "광고 등록 & 결제 가이드",
        content: `광고 등록 및 결제 방법 안내

1. 광고 등록
   - 마이페이지 > 광고 등록하기
   - 업소 정보 및 채용 조건 입력
   - 원하는 광고 상품 선택

2. 결제 방법
   - 카드 결제 (즉시 승인)
   - 계좌이체 (입금 확인 후 승인)
   - 카카오페이 (즉시 승인)

3. 광고 승인
   - 결제 완료 후 관리자 검토
   - 승인 시 즉시 노출 시작

문의사항은 1:1 문의를 이용해주세요.`,
        isPinned: true,
      },
      {
        title: "커뮤니티 이용규칙 안내",
        content: `커뮤니티 이용규칙

1. 금지 행위
   - 욕설, 비방, 음란물 게시
   - 개인정보 무단 공개
   - 상업적 광고 및 홍보
   - 불법 정보 공유

2. 신고 기능
   - 부적절한 게시물 발견 시 신고 버튼 클릭
   - 관리자가 검토 후 조치

3. 제재 정책
   - 경고 → 일시정지 → 영구정지
   - 악질적인 경우 즉시 영구정지

건전한 커뮤니티 문화 조성에 협조 부탁드립니다.`,
        isPinned: false,
      },
      {
        title: "안전한 구직 활동 가이드",
        content: `안전한 구직 활동을 위한 가이드

1. 면접 시 확인사항
   - 업소 위치 및 영업 허가
   - 급여 지급 방식 및 시기
   - 근무 조건 및 복지

2. 주의사항
   - 선불금, 보증금 요구 시 주의
   - 계약서 작성 전 꼼꼼히 확인
   - 불편한 요구 시 거절

3. 문제 발생 시
   - 여성긴급전화 1366
   - 고용노동부 1350
   - 경찰서 112

안전한 구직 활동을 위해 항상 주의하시기 바랍니다.`,
        isPinned: false,
      },
    ];

    for (const notice of notices) {
      const { rows: existing } = await client.query<{ id: string }>(
        `SELECT id FROM notices WHERE title = $1`,
        [notice.title]
      );

      if (existing.length > 0) {
        await client.query(
          `UPDATE notices
           SET content = $1, "isPinned" = $2, "updatedAt" = NOW()
           WHERE id = $3`,
          [notice.content, notice.isPinned, existing[0].id]
        );
      } else {
        await client.query(
          `INSERT INTO notices (id, title, content, "authorId", "isPinned", "viewCount", "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, $3, $4, 0, NOW(), NOW())`,
          [notice.title, notice.content, admin.id, notice.isPinned]
        );
      }
    }

    console.log(`✅ 공지사항 ${notices.length}건 업데이트 완료`);

    // Final summary
    console.log("\n📊 최종 통계:");
    const { rows: [stats] } = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM posts) as posts,
        (SELECT COUNT(*) FROM comments WHERE "parentId" IS NULL) as comments,
        (SELECT COUNT(*) FROM comments WHERE "parentId" IS NOT NULL) as replies,
        (SELECT COUNT(*) FROM post_likes) as likes,
        (SELECT COUNT(*) FROM notices) as notices
    `);

    console.log(`  게시글: ${stats.posts}건`);
    console.log(`  댓글: ${stats.comments}건`);
    console.log(`  답글: ${stats.replies}건`);
    console.log(`  좋아요: ${stats.likes}건`);
    console.log(`  공지사항: ${stats.notices}건`);
    console.log("\n✅ 커뮤니티 복구 완료!");

  } catch (error) {
    console.error("❌ 오류 발생:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
