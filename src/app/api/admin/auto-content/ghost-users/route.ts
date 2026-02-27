import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GhostPersonality } from "@/generated/prisma/client";

// 형용사 배열 (60개)
const ADJECTIVES = [
  "반짝이는", "귀여운", "달콤한", "새콤한", "따뜻한", "시원한", "포근한", "깜찍한", "상큼한", "활발한",
  "조용한", "수줍은", "용감한", "씩씩한", "느긋한", "재빠른", "신비로운", "우아한", "소중한", "예쁜",
  "화려한", "은은한", "산뜻한", "청순한", "발랄한", "명랑한", "차분한", "영롱한", "신나는", "행복한",
  "즐거운", "설레는", "기분좋은", "몽글한", "사랑스러운", "매력적인", "호기심많은", "자유로운", "꿈꾸는", "빛나는",
  "따스한", "아련한", "감성적인", "낭만적인", "순수한", "천진한", "발칙한", "도도한", "당당한", "찬란한",
  "영롱한", "청아한", "맑은", "투명한", "환한", "포실한", "보들보들", "사뿐사뿐", "살랑살랑", "반짝반짝",
];

// 명사 배열 (60개)
const NOUNS = [
  "별", "고양이", "토끼", "나비", "꽃", "체리", "딸기", "구름", "달", "하늘",
  "바다", "숲", "노을", "무지개", "햇살", "이슬", "민들레", "장미", "라벤더", "코스모스",
  "수국", "벚꽃", "진달래", "매화", "동백", "제비꽃", "해바라기", "은방울꽃", "튤립", "아이리스",
  "도토리", "다람쥐", "여우", "사슴", "참새", "비둘기", "앵무새", "펭귄", "수달", "판다",
  "햄스터", "치즈", "마카롱", "쿠키", "캔디", "젤리", "초코", "라떼", "밀크티", "아이스크림",
  "요정", "공주", "천사", "인어", "소녀", "레이디", "퀸", "걸", "베이비", "하트",
];

/**
 * 형용사 + 명사 조합으로 유령회원 닉네임 생성
 * 예: "반짝이는별", "귀여운고양이"
 */
function generateGhostNickname(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return adj + noun;
}

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

    if (count < 1 || count > 100) {
      return NextResponse.json(
        { error: "생성 수는 1~100 사이여야 합니다" },
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

    const users = [];
    let created = 0;
    const maxAttempts = 10; // 닉네임 생성 최대 시도 횟수

    for (let i = 0; i < count; i++) {
      let nickname = "";
      let attempts = 0;

      // 중복되지 않는 닉네임 생성 (최대 10회 시도)
      while (attempts < maxAttempts) {
        nickname = generateGhostNickname();
        if (!usedNames.has(nickname)) {
          usedNames.add(nickname); // 이번 배치에서도 중복 방지
          break;
        }
        attempts++;
      }

      // 10회 시도해도 중복이면 건너뛰기
      if (attempts >= maxAttempts) {
        continue;
      }

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
      created++;
    }

    if (users.length === 0) {
      return NextResponse.json(
        { error: "유일한 닉네임 생성에 실패했습니다. 잠시 후 다시 시도해주세요." },
        { status: 400 }
      );
    }

    await prisma.user.createMany({
      data: users,
    });

    const msg = created < count
      ? `${created}명 생성 (${count - created}명은 닉네임 중복으로 미생성)`
      : `${created}명의 유령회원이 생성되었습니다`;

    return NextResponse.json({
      message: msg,
      created: created,
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

    // 닉네임 중복 체크
    const nameExists = await prisma.user.findFirst({
      where: { name: name.trim(), isActive: true, id: { not: id } },
      select: { id: true },
    });
    if (nameExists) {
      return NextResponse.json(
        { error: "이미 사용 중인 닉네임입니다" },
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
