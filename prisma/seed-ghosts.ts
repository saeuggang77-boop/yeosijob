import { PrismaClient, GhostPersonality } from "../src/generated/prisma/client";

// 100 밤여시풍 닉네임 - 감성적/귀여운/쿨한 느낌
const GHOST_USERS = [
  // CHATTY (수다쟁이) ~17명
  { name: "달콤체리", personality: "CHATTY" as GhostPersonality },
  { name: "수다쟁이언니", personality: "CHATTY" as GhostPersonality },
  { name: "반짝반짝", personality: "CHATTY" as GhostPersonality },
  { name: "핑크요정", personality: "CHATTY" as GhostPersonality },
  { name: "웃긴언니", personality: "CHATTY" as GhostPersonality },
  { name: "떠드는게좋아", personality: "CHATTY" as GhostPersonality },
  { name: "수다퀸", personality: "CHATTY" as GhostPersonality },
  { name: "톡톡이", personality: "CHATTY" as GhostPersonality },
  { name: "밤하늘별", personality: "CHATTY" as GhostPersonality },
  { name: "체리블라썸", personality: "CHATTY" as GhostPersonality },
  { name: "하트뿅뿅", personality: "CHATTY" as GhostPersonality },
  { name: "설레는밤", personality: "CHATTY" as GhostPersonality },
  { name: "달달한하루", personality: "CHATTY" as GhostPersonality },
  { name: "캔디걸", personality: "CHATTY" as GhostPersonality },
  { name: "장미빛인생", personality: "CHATTY" as GhostPersonality },
  { name: "러블리민지", personality: "CHATTY" as GhostPersonality },
  { name: "초코파이", personality: "CHATTY" as GhostPersonality },

  // ADVISOR (조언러) ~17명
  { name: "현실언니", personality: "ADVISOR" as GhostPersonality },
  { name: "경험치높은언니", personality: "ADVISOR" as GhostPersonality },
  { name: "든든한선배", personality: "ADVISOR" as GhostPersonality },
  { name: "알려주는언니", personality: "ADVISOR" as GhostPersonality },
  { name: "따뜻한조언", personality: "ADVISOR" as GhostPersonality },
  { name: "오래된언니", personality: "ADVISOR" as GhostPersonality },
  { name: "지혜로운밤", personality: "ADVISOR" as GhostPersonality },
  { name: "멘토언니", personality: "ADVISOR" as GhostPersonality },
  { name: "노하우공유", personality: "ADVISOR" as GhostPersonality },
  { name: "진심어린조언", personality: "ADVISOR" as GhostPersonality },
  { name: "배테랑언니", personality: "ADVISOR" as GhostPersonality },
  { name: "엄마같은언니", personality: "ADVISOR" as GhostPersonality },
  { name: "챙겨주는언니", personality: "ADVISOR" as GhostPersonality },
  { name: "힘내라고말하는언니", personality: "ADVISOR" as GhostPersonality },
  { name: "인생선배", personality: "ADVISOR" as GhostPersonality },
  { name: "따스한말", personality: "ADVISOR" as GhostPersonality },
  { name: "응원하는사람", personality: "ADVISOR" as GhostPersonality },

  // QUESTIONER (질문러) ~17명
  { name: "궁금한고양이", personality: "QUESTIONER" as GhostPersonality },
  { name: "질문많은신입", personality: "QUESTIONER" as GhostPersonality },
  { name: "알고싶은게많아", personality: "QUESTIONER" as GhostPersonality },
  { name: "처음이에요", personality: "QUESTIONER" as GhostPersonality },
  { name: "호기심천국", personality: "QUESTIONER" as GhostPersonality },
  { name: "새내기언니", personality: "QUESTIONER" as GhostPersonality },
  { name: "이것도궁금", personality: "QUESTIONER" as GhostPersonality },
  { name: "여쭤볼게요", personality: "QUESTIONER" as GhostPersonality },
  { name: "배우고싶어요", personality: "QUESTIONER" as GhostPersonality },
  { name: "왕초보", personality: "QUESTIONER" as GhostPersonality },
  { name: "도와주세요", personality: "QUESTIONER" as GhostPersonality },
  { name: "신기한세상", personality: "QUESTIONER" as GhostPersonality },
  { name: "뭐든지물어봐", personality: "QUESTIONER" as GhostPersonality },
  { name: "궁금해서잠이안와", personality: "QUESTIONER" as GhostPersonality },
  { name: "첫출근", personality: "QUESTIONER" as GhostPersonality },
  { name: "물음표소녀", personality: "QUESTIONER" as GhostPersonality },
  { name: "이거어떡해", personality: "QUESTIONER" as GhostPersonality },

  // EMOJI_LOVER (이모티콘러) ~17명
  { name: "뿌잉뿌잉", personality: "EMOJI_LOVER" as GhostPersonality },
  { name: "냥냥이", personality: "EMOJI_LOVER" as GhostPersonality },
  { name: "별빛요정", personality: "EMOJI_LOVER" as GhostPersonality },
  { name: "무지개솜사탕", personality: "EMOJI_LOVER" as GhostPersonality },
  { name: "꽃길만걷자", personality: "EMOJI_LOVER" as GhostPersonality },
  { name: "하트폭탄", personality: "EMOJI_LOVER" as GhostPersonality },
  { name: "반짝이는눈", personality: "EMOJI_LOVER" as GhostPersonality },
  { name: "귀요미퀸", personality: "EMOJI_LOVER" as GhostPersonality },
  { name: "스마일가득", personality: "EMOJI_LOVER" as GhostPersonality },
  { name: "달님별님", personality: "EMOJI_LOVER" as GhostPersonality },
  { name: "콩콩이", personality: "EMOJI_LOVER" as GhostPersonality },
  { name: "쪼꼬미", personality: "EMOJI_LOVER" as GhostPersonality },
  { name: "방긋이", personality: "EMOJI_LOVER" as GhostPersonality },
  { name: "루루랄라", personality: "EMOJI_LOVER" as GhostPersonality },
  { name: "포근한구름", personality: "EMOJI_LOVER" as GhostPersonality },
  { name: "삐약이", personality: "EMOJI_LOVER" as GhostPersonality },
  { name: "눈웃음", personality: "EMOJI_LOVER" as GhostPersonality },

  // CALM (차분한 언니) ~16명
  { name: "고요한밤", personality: "CALM" as GhostPersonality },
  { name: "차분한언니", personality: "CALM" as GhostPersonality },
  { name: "잔잔한물결", personality: "CALM" as GhostPersonality },
  { name: "새벽감성", personality: "CALM" as GhostPersonality },
  { name: "조용한관찰자", personality: "CALM" as GhostPersonality },
  { name: "달빛아래", personality: "CALM" as GhostPersonality },
  { name: "은은한향기", personality: "CALM" as GhostPersonality },
  { name: "여유로운하루", personality: "CALM" as GhostPersonality },
  { name: "평화주의자", personality: "CALM" as GhostPersonality },
  { name: "조용히응원", personality: "CALM" as GhostPersonality },
  { name: "나뚜두", personality: "CALM" as GhostPersonality },
  { name: "고즈넉한밤", personality: "CALM" as GhostPersonality },
  { name: "맑은샘물", personality: "CALM" as GhostPersonality },
  { name: "부드러운바람", personality: "CALM" as GhostPersonality },
  { name: "하늘빛언니", personality: "CALM" as GhostPersonality },
  { name: "잠못드는밤", personality: "CALM" as GhostPersonality },

  // SASSY (쿨한 언니) ~16명
  { name: "쿨한언니", personality: "SASSY" as GhostPersonality },
  { name: "솔직담백", personality: "SASSY" as GhostPersonality },
  { name: "할말은하는언니", personality: "SASSY" as GhostPersonality },
  { name: "걸크러쉬", personality: "SASSY" as GhostPersonality },
  { name: "직설언니", personality: "SASSY" as GhostPersonality },
  { name: "보라빛여우", personality: "SASSY" as GhostPersonality },
  { name: "시크한밤", personality: "SASSY" as GhostPersonality },
  { name: "카리스마언니", personality: "SASSY" as GhostPersonality },
  { name: "분위기여신", personality: "SASSY" as GhostPersonality },
  { name: "독한언니", personality: "SASSY" as GhostPersonality },
  { name: "까칠한고양이", personality: "SASSY" as GhostPersonality },
  { name: "팩트폭격기", personality: "SASSY" as GhostPersonality },
  { name: "눈치없는언니", personality: "SASSY" as GhostPersonality },
  { name: "돌직구언니", personality: "SASSY" as GhostPersonality },
  { name: "자신감뿜뿜", personality: "SASSY" as GhostPersonality },
  { name: "natural high", personality: "SASSY" as GhostPersonality },
];

export async function seedGhostUsers(prisma: PrismaClient) {
  console.log("🤖 유령회원 시드 시작...");

  let created = 0;

  for (let i = 0; i < GHOST_USERS.length; i++) {
    const ghost = GHOST_USERS[i];
    const email = `ghost_${i + 1}@yeosijob.internal`;

    // 이미 존재하면 스킵
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) continue;

    // createdAt을 최근 1-3개월 랜덤 분산
    const daysAgo = Math.floor(Math.random() * 90) + 1;
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);

    await prisma.user.create({
      data: {
        name: ghost.name,
        email,
        role: "JOBSEEKER",
        isGhost: true,
        ghostPersonality: ghost.personality,
        isActive: true,
        createdAt,
      },
    });
    created++;
  }

  console.log(`✅ 유령회원 ${created}명 생성 완료 (총 ${GHOST_USERS.length}명)`);
}
