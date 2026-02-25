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
  // 꽃 계열
  "벚꽃소녀",
  "라벤더향",
  "장미빛인생",
  "해바라기",
  "수선화",
  "튤립걸",
  "카네이션",
  "백합공주",
  "데이지러버",
  "코스모스",
  "민들레홀씨",
  "히아신스",
  "작약향기",
  "수국소녀",
  "동백꽃",
  // 감성 계열
  "새벽감성",
  "노을빛",
  "달빛요정",
  "비오는날",
  "꿈꾸는밤",
  "별헤는밤",
  "초저녁",
  "한여름밤",
  "햇살가득",
  "구름타기",
  "달콤한꿈",
  "포근한밤",
  "설렘가득",
  "두근두근",
  "반짝반짝",
  // 동물 계열
  "고양이눈",
  "아기여우",
  "토끼소녀",
  "나비처럼",
  "새처럼자유",
  "곰돌이",
  "팬더걸",
  "사슴눈망울",
  "강아지상",
  "햄스터볼",
  "얼룩고양이",
  "샴고양이",
  "아기호랑이",
  "물개소녀",
  "돌고래",
  // 음식 계열
  "딸기우유",
  "마카롱",
  "카라멜",
  "솜사탕",
  "초코무스",
  "바닐라향",
  "민트초코",
  "밀크티",
  "복숭아맛",
  "레몬에이드",
  "체리파이",
  "허니버터",
  "치즈케이크",
  "크림빵",
  "푸딩공주",
  // 뷰티 계열
  "글로시립",
  "속눈썹요정",
  "치크핑크",
  "네일아트",
  "섀도우퀸",
  "블러셔",
  "틴트러버",
  "하이라이터",
  "매트립스틱",
  "아이섀도우",
  "컨실러",
  "쿠션팩트",
  "마스카라",
  "아이라인",
  "립밤공주",
  // 패션 계열
  "하이힐걸",
  "미니스커트",
  "오프숄더",
  "크롭탑",
  "원피스러버",
  "데님걸",
  "레더자켓",
  "니트소녀",
  "블라우스",
  "플리츠스커트",
  "트렌치코트",
  "가디건",
  "슬랙스",
  "셔츠걸",
  "후드티",
  // 계절 계열
  "봄바람",
  "여름밤",
  "가을향기",
  "겨울요정",
  "봄꽃처럼",
  "한여름",
  "가을낙엽",
  "겨울눈꽃",
  "봄날",
  "여름해",
  "가을하늘",
  "겨울왕국",
  "춘향",
  "하지",
  "추석달",
  // 색상 계열
  "핑크빛",
  "퍼플걸",
  "블루베리",
  "레드퀸",
  "골드스타",
  "실버샤인",
  "화이트걸",
  "블랙펄",
  "민트컬러",
  "코랄핑크",
  "라벤더퍼플",
  "스카이블루",
  "로즈골드",
  "네이비블루",
  "베이지톤",
  // 캐릭터성 계열
  "새침데기",
  "까칠공주",
  "반짝소녀",
  "눈웃음",
  "볼터치",
  "애교쟁이",
  "깜찍이",
  "사랑둥이",
  "귀염둥이",
  "개구쟁이",
  "수줍음쟁이",
  "장난꾸러기",
  "씩씩이",
  "똘똘이",
  "반전매력",
  // 보석·귀금속 계열
  "오팔",
  "토파즈",
  "자수정",
  "아쿠아마린",
  "가넷",
  "진주소녀",
  "옥구슬",
  "호박구슬",
  "산호빛",
  "터키석",
  "청금석",
  "공작석",
  "비취",
  "마노",
  "호안석",
  // 음악·예술 계열
  "재즈러버",
  "팝송퀸",
  "힙합걸",
  "락스타",
  "발라드",
  "클래식",
  "EDM걸",
  "뮤지컬러버",
  "피아노소녀",
  "바이올린",
  "첼로요정",
  "기타걸",
  "드럼퀸",
  "노래하는밤",
  "멜로디",
  // 낭만·로맨스 계열
  "로맨티스트",
  "사랑별",
  "연애중",
  "하트시그널",
  "설레임",
  "첫사랑",
  "운명같은",
  "로맨스퀸",
  "핑크빛연애",
  "달콤살벌",
  "청순가련",
  "순정만화",
  "로맨틱걸",
  "사랑가득",
  "하트퀸",
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
