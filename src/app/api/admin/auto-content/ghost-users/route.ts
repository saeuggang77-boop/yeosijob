import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GhostPersonality } from "@/generated/prisma/client";

const GHOST_NICKNAMES = [
  "밤의여왕",
  "골드걸",
  "하이루키",
  "샴페인러버",
  "스파클링",
  "문라이트",
  "블링블링",
  "하이볼",
  "칵테일러버",
  "섹시큐티",
  "부끄럼쟁이",
  "도도한그녀",
  "사랑꾼",
  "자유로운영혼",
  "밤하늘별",
  "로즈샴페인",
  "댄싱퀸",
  "허니걸",
  "야경러버",
  "글리터",
  "샤이니",
  "돔페리뇽",
  "스타라이트",
  "문스톤",
  "골드핑거",
  "실버문",
  "다이아몬드걸",
  "루비하트",
  "사파이어",
  "에메랄드",
  "펄걸",
  "크리스탈",
  "벨벳로즈",
  "실크터치",
  "새틴걸",
  "레이스하트",
  "샤넬걸",
  "프라다러버",
  "구찌퀸",
  "에르메스",
  "티파니",
  "불가리",
  "카르티에",
  "버킨걸",
  "켈리백",
  "빈티지러버",
  "앤틱걸",
  "모던시크",
  "클래식뷰티",
  "엘레강스",
];

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const body = await request.json();
    const { count = 10 } = body;

    if (count < 1 || count > 50) {
      return NextResponse.json(
        { error: "생성 수는 1~50 사이여야 합니다" },
        { status: 400 }
      );
    }

    const personalities: GhostPersonality[] = [
      "CHATTY",
      "ADVISOR",
      "QUESTIONER",
      "EMOJI_LOVER",
      "CALM",
      "SASSY",
    ];

    const users = [];
    for (let i = 0; i < count; i++) {
      const nickname =
        GHOST_NICKNAMES[Math.floor(Math.random() * GHOST_NICKNAMES.length)] +
        Math.floor(Math.random() * 9999);
      const personality =
        personalities[Math.floor(Math.random() * personalities.length)];

      users.push({
        name: nickname,
        email: `ghost_${Date.now()}_${i}@ghost.local`,
        role: "JOBSEEKER" as const,
        isGhost: true,
        ghostPersonality: personality,
        isActive: true,
      });
    }

    await prisma.user.createMany({
      data: users,
    });

    return NextResponse.json({
      message: `${count}명의 유령회원이 생성되었습니다`,
      created: count,
    });
  } catch (error) {
    console.error("Ghost user creation error:", error);
    return NextResponse.json(
      { error: "유령회원 생성에 실패했습니다" },
      { status: 500 }
    );
  }
}
