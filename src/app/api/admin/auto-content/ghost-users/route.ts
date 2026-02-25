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

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const ghostUsers = await prisma.user.findMany({
      where: {
        isGhost: true,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        ghostPersonality: true,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ ghostUsers });
  } catch (error) {
    console.error("Ghost user fetch error:", error);
    return NextResponse.json(
      { error: "유령회원 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}

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

    // 이미 사용 중인 닉네임 조회
    const existingUsers = await prisma.user.findMany({
      where: { isGhost: true, isActive: true },
      select: { name: true },
    });
    const usedNames = new Set(existingUsers.map(u => u.name));

    // 사용 가능한 닉네임만 필터링 후 셔플
    const available = GHOST_NICKNAMES.filter(n => !usedNames.has(n));
    for (let i = available.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [available[i], available[j]] = [available[j], available[i]];
    }

    const toCreate = Math.min(count, available.length);
    if (toCreate === 0) {
      return NextResponse.json(
        { error: "사용 가능한 닉네임이 없습니다. 기존 유령회원을 삭제해주세요." },
        { status: 400 }
      );
    }

    const users = [];
    for (let i = 0; i < toCreate; i++) {
      const personality =
        personalities[Math.floor(Math.random() * personalities.length)];

      users.push({
        name: available[i],
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

    const msg = toCreate < count
      ? `${toCreate}명 생성 (닉네임 부족으로 ${count - toCreate}명 미생성)`
      : `${toCreate}명의 유령회원이 생성되었습니다`;

    return NextResponse.json({
      message: msg,
      created: toCreate,
    });
  } catch (error) {
    console.error("Ghost user creation error:", error);
    return NextResponse.json(
      { error: "유령회원 생성에 실패했습니다" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name } = body;

    if (!id || !name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "유효한 ID와 닉네임이 필요합니다" },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { name: name.trim() },
      select: {
        id: true,
        name: true,
        ghostPersonality: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      message: "닉네임이 수정되었습니다",
      user: updated,
    });
  } catch (error) {
    console.error("Ghost user update error:", error);
    return NextResponse.json(
      { error: "유령회원 수정에 실패했습니다" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    // body JSON 또는 query param 둘 다 지원
    let ids: string[] = [];
    try {
      const body = await request.json();
      ids = body.ids || (body.id ? [body.id] : []);
    } catch {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");
      if (id) ids = [id];
    }

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "유저 ID가 필요합니다" },
        { status: 400 }
      );
    }

    await prisma.user.updateMany({
      where: { id: { in: ids }, isGhost: true },
      data: { isActive: false },
    });

    return NextResponse.json({
      message: `${ids.length}명의 유령회원이 삭제되었습니다`,
      deletedCount: ids.length,
    });
  } catch (error) {
    console.error("Ghost user delete error:", error);
    return NextResponse.json(
      { error: "유령회원 삭제에 실패했습니다" },
      { status: 500 }
    );
  }
}
