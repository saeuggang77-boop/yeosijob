import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hash } from "bcryptjs";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://kwonrishop:kwonrishop_dev@localhost:5432/yeosialba?schema=public",
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SAMPLE_ADS = [
  // 1. BANNER
  {
    title: "강남 프리미엄 룸싸롱 대규모 채용",
    businessName: "강남 다이아몬드",
    businessType: "ROOM_SALON" as const,
    regions: ["SEOUL" as const],
    salaryText: "일급 50만~80만+α",
    workHours: "PM 7:00 ~ AM 3:00",
    benefits: "의상, 헤어, 메이크업, 숙소, 택시비 전부 지원",
    description: "강남 최고급 프리미엄 룸싸롱에서 대규모 채용합니다.\n\n업계 최고 대우, 경력 무관.\n숙소 완비, 전국에서 오시는 분 환영!",
    contactPhone: "01011112222",
    contactKakao: "diamond_ceo",
    thumbnailUrl: null,
  },
  // 2. VIP 1
  {
    title: "강남 고급 룸싸롱 여성 정직원 모집",
    businessName: "강남 로얄클럽",
    businessType: "ROOM_SALON" as const,
    regions: ["SEOUL" as const],
    salaryText: "일급 30만~50만+α",
    workHours: "PM 7:00 ~ AM 3:00",
    benefits: "의상 제공, 식사 제공, 택시비 지원, 숙소 제공 가능",
    description: "강남 최고급 룸싸롱에서 함께할 분을 모집합니다.\n\n경력 무관, 미경험자도 환영합니다.",
    contactPhone: "01012345678",
    contactKakao: "royalclub_ceo",
  },
  // 3. VIP 2
  {
    title: "청담 하이엔드 바라운지 채용",
    businessName: "청담 루미에르",
    businessType: "BAR_LOUNGE" as const,
    regions: ["SEOUL" as const],
    salaryText: "일급 40만~60만",
    workHours: "PM 8:00 ~ AM 4:00",
    benefits: "숙소, 의상, 택시비, 식사 제공",
    description: "청담동 최고급 바라운지에서 함께할 분을 찾습니다.\n\n고급스러운 분위기에서 일하고 싶으신 분 환영!",
    contactPhone: "01011223344",
    contactKakao: "lumiere_cd",
  },
  // 4. PREMIUM 1
  {
    title: "홍대 텐카페 신규 오픈 대량 모집",
    businessName: "홍대 스타카페",
    businessType: "TEN_CAFE" as const,
    regions: ["SEOUL" as const],
    salaryText: "시급 25,000~35,000",
    workHours: "PM 6:00 ~ AM 2:00",
    benefits: "식사 제공, 의상 제공",
    description: "홍대에 신규 오픈하는 텐카페입니다!\n\n밝고 활기찬 분위기에서 함께할 분을 모집합니다.",
    contactPhone: "01023456789",
    contactKakao: "starcafe_hd",
  },
  // 5. PREMIUM 2
  {
    title: "분당 프리미엄 셔츠룸 정직원",
    businessName: "분당 엘리시움",
    businessType: "SHIRT_ROOM" as const,
    regions: ["GYEONGGI" as const],
    salaryText: "일급 35만~50만",
    workHours: "PM 7:30 ~ AM 3:00",
    benefits: "셔츠 제공, 식사, 택시비",
    description: "분당 최대 규모 셔츠룸에서 정직원을 구합니다.\n\n안정적인 수입 보장!",
    contactPhone: "01033445566",
    contactKakao: "elysium_bd",
  },
  // 6. SPECIAL 1
  {
    title: "부산 서면 바라운지 스탭 모집",
    businessName: "서면 블루라운지",
    businessType: "BAR_LOUNGE" as const,
    regions: ["BUSAN" as const],
    salaryText: "시급 20,000~30,000",
    workHours: "PM 8:00 ~ AM 4:00",
    benefits: "식사 제공, 택시비 지원",
    description: "서면 중심가에 위치한 바라운지에서 스탭을 구합니다.",
    contactPhone: "01034567890",
  },
  // 7. SPECIAL 2
  {
    title: "해운대 클럽 주말 파트 모집",
    businessName: "해운대 웨이브",
    businessType: "CLUB" as const,
    regions: ["BUSAN" as const],
    salaryText: "시급 35,000+팁",
    workHours: "PM 10:00 ~ AM 5:00 (금토)",
    benefits: "팁 전액, 음료 무제한",
    description: "해운대 최대 클럽에서 주말 파트타임을 구합니다.\n\n팁 전액 본인!",
    contactPhone: "01044556677",
  },
  // 8. URGENT 1
  {
    title: "강남 퍼블릭바 주말 파트타임 급구",
    businessName: "강남 네온바",
    businessType: "PUBLIC_BAR" as const,
    regions: ["SEOUL" as const, "GYEONGGI" as const],
    salaryText: "시급 22,000+팁",
    workHours: "PM 9:00 ~ AM 5:00 (주말)",
    benefits: "팁 100% 본인, 식사 제공",
    description: "강남역 5분 거리 퍼블릭바에서 주말 파트타임을 구합니다.\n\n팁 전액 본인!\n바로 출근 가능한 분 연락주세요.",
    contactPhone: "01045678901",
    contactKakao: "neonbar",
  },
  // 9. URGENT 2
  {
    title: "경기 수원 셔츠룸 긴급 채용",
    businessName: "수원 엘리트",
    businessType: "SHIRT_ROOM" as const,
    regions: ["GYEONGGI" as const],
    salaryText: "일급 28만~45만",
    workHours: "PM 7:30 ~ AM 3:00",
    benefits: "식사, 셔츠 제공, 택시비",
    description: "수원 인계동 셔츠룸에서 급하게 채용합니다.\n\n바로 출근 가능한 분 우대!\n일급 당일 정산.",
    contactPhone: "01078901234",
  },
  // 10. RECOMMEND 1
  {
    title: "대구 동성로 노래방 도우미 모집",
    businessName: "동성로 스타노래방",
    businessType: "KARAOKE" as const,
    regions: ["DAEGU" as const],
    salaryText: "일급 15만~25만",
    workHours: "PM 7:00 ~ AM 2:00",
    benefits: "식사, 의상 제공",
    description: "대구 동성로 대형 노래방에서 도우미를 모집합니다.",
    contactPhone: "01056789012",
  },
  // 11. RECOMMEND 2
  {
    title: "인천 하이퍼블릭 정직원 구합니다",
    businessName: "인천 파티클럽",
    businessType: "HYPER_PUBLIC" as const,
    regions: ["INCHEON" as const],
    salaryText: "일급 25만~40만",
    workHours: "PM 8:00 ~ AM 4:00",
    benefits: "숙소, 식사, 의상, 택시비 전부 제공",
    description: "인천 최대 규모 하이퍼블릭에서 정직원을 구합니다.",
    contactPhone: "01067890123",
    contactKakao: "partyclub_ic",
  },
  // 12. LINE 1
  {
    title: "광주 클럽 주말 알바 모집",
    businessName: "광주 매직클럽",
    businessType: "CLUB" as const,
    regions: ["GWANGJU" as const],
    salaryText: "시급 30,000+팁",
    workHours: "PM 10:00 ~ AM 5:00 (금토)",
    benefits: "팁 전액, 음료 무제한",
    description: "광주 최대 클럽에서 주말 파트타임을 구합니다.",
    contactPhone: "01089012345",
  },
  // 13. LINE 2
  {
    title: "대전 마사지샵 관리사 모집",
    businessName: "대전 힐링스파",
    businessType: "MASSAGE" as const,
    regions: ["DAEJEON" as const],
    salaryText: "월급 250만~350만",
    workHours: "AM 11:00 ~ PM 10:00 (교대)",
    benefits: "숙소 제공, 식사 제공",
    description: "대전 중심가 마사지샵에서 관리사를 모집합니다.\n\n경력자 우대.",
    contactPhone: "01090123456",
  },
  // 14. LINE 3
  {
    title: "울산 노래방 파트타임",
    businessName: "울산 스타노래방",
    businessType: "KARAOKE" as const,
    regions: ["ULSAN" as const],
    salaryText: "시급 18,000~25,000",
    workHours: "PM 8:00 ~ AM 2:00",
    benefits: "식사 제공",
    description: "울산 중구 노래방에서 파트타임을 구합니다.",
    contactPhone: "01001234567",
  },
  // 15. LINE 4
  {
    title: "제주 바라운지 스탭 채용",
    businessName: "제주 선셋바",
    businessType: "BAR_LOUNGE" as const,
    regions: ["JEJU" as const],
    salaryText: "시급 20,000~28,000",
    workHours: "PM 7:00 ~ AM 3:00",
    benefits: "숙소 제공, 식사 제공, 항공권 지원",
    description: "제주도 바라운지에서 스탭을 채용합니다.\n\n숙소+항공권 지원!",
    contactPhone: "01012340000",
    contactKakao: "sunset_jeju",
  },
  // 16. FREE 1
  {
    title: "강릉 카페 아르바이트 모집",
    businessName: "강릉 바다카페",
    businessType: "TEN_CAFE" as const,
    regions: ["GANGWON" as const],
    salaryText: "시급 15,000",
    workHours: "PM 2:00 ~ PM 10:00",
    benefits: "식사 제공",
    description: "강릉 해변가 카페에서 아르바이트를 구합니다.\n\n편안한 분위기에서 일하실 분 연락주세요.",
    contactPhone: "01055556666",
  },
  // 17. FREE 2
  {
    title: "춘천 노래방 도우미 모집",
    businessName: "춘천 뮤직노래방",
    businessType: "KARAOKE" as const,
    regions: ["GANGWON" as const],
    salaryText: "일급 12만~18만",
    workHours: "PM 8:00 ~ AM 2:00",
    benefits: "식사 제공",
    description: "춘천 중심가 노래방에서 도우미를 구합니다.",
    contactPhone: "01066667777",
  },
  // 18. FREE 3
  {
    title: "전주 술집 홀 서빙 모집",
    businessName: "전주 전통주점",
    businessType: "PUBLIC_BAR" as const,
    regions: ["JEONBUK" as const],
    salaryText: "시급 12,000",
    workHours: "PM 6:00 ~ AM 1:00",
    description: "전주 한옥마을 인근 전통주점에서 홀 서빙을 구합니다.\n\n한복 제공, 관광객 많은 곳입니다.",
    contactPhone: "01077778888",
  },
];

async function main() {
  console.log("Seeding database...");

  // 기존 데이터 삭제
  await prisma.jumpLog.deleteMany();
  await prisma.adOption.deleteMany();
  await prisma.adDailyMetric.deleteMany();
  await prisma.scrap.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.ad.deleteMany();
  await prisma.resume.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // 사장님 계정 생성
  const bizPassword = await hash("test1234", 12);
  const bizUser = await prisma.user.create({
    data: {
      name: "테스트사장",
      email: "boss@yeosialba.com",
      phone: "01099998888",
      hashedPassword: bizPassword,
      role: "BUSINESS",
      businessName: "테스트업소",
      isVerifiedBiz: true,
    },
  });

  // 구직자 계정 생성
  const jobPassword = await hash("test1234", 12);
  await prisma.user.create({
    data: {
      name: "테스트구직자",
      email: "job@yeosialba.com",
      phone: "01077776666",
      hashedPassword: jobPassword,
      role: "JOBSEEKER",
    },
  });

  // 관리자 계정 생성
  const adminPassword = await hash("admin1234", 12);
  await prisma.user.create({
    data: {
      name: "관리자",
      email: "admin@yeosialba.com",
      phone: "01000000000",
      hashedPassword: adminPassword,
      role: "ADMIN",
    },
  });

  // 광고 생성
  const now = new Date();
  for (let i = 0; i < SAMPLE_ADS.length; i++) {
    const sample = SAMPLE_ADS[i];
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 10));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);

    const lastJumped = new Date(now);
    lastJumped.setMinutes(lastJumped.getMinutes() - i * 15);

    // 등급별 차별화: BANNER 1, VIP 2, PREMIUM 2, SPECIAL 2, URGENT 2, RECOMMEND 2, LINE 4, FREE 3
    const productIds = ["BANNER", "VIP", "VIP", "PREMIUM", "PREMIUM", "SPECIAL", "SPECIAL", "URGENT", "URGENT", "RECOMMEND", "RECOMMEND", "LINE", "LINE", "LINE", "LINE", "FREE", "FREE", "FREE"] as const;
    const amounts = [700000, 500000, 500000, 300000, 300000, 200000, 200000, 150000, 150000, 100000, 100000, 70000, 70000, 70000, 70000, 0, 0, 0];
    const isFreeAd = productIds[i] === "FREE";

    await prisma.ad.create({
      data: {
        userId: bizUser.id,
        title: sample.title,
        businessName: sample.businessName,
        businessType: sample.businessType,
        regions: sample.regions,
        salaryText: sample.salaryText,
        workHours: sample.workHours || null,
        benefits: sample.benefits || null,
        description: sample.description,
        contactPhone: sample.contactPhone,
        contactKakao: sample.contactKakao || null,
        productId: productIds[i],
        durationDays: isFreeAd ? 0 : 30,
        totalAmount: amounts[i],
        status: "ACTIVE",
        startDate: isFreeAd ? new Date() : startDate,
        endDate: isFreeAd ? undefined : endDate,
        autoJumpPerDay: isFreeAd ? 0 : 12,
        manualJumpPerDay: 0,
        lastJumpedAt: lastJumped,
        isVerified: i < 5,
        viewCount: Math.floor(Math.random() * 500),
        maxEdits: isFreeAd ? 999 : 1,
      },
    });
  }

  // 구직자 이력서 생성
  const jobUser = await prisma.user.findUnique({ where: { email: "job@yeosialba.com" } });

  // 추가 구직자 계정 + 이력서 생성
  const jobPassword2 = await hash("test1234", 12);
  const jobUser2 = await prisma.user.create({
    data: {
      name: "김서연",
      email: "job2@yeosialba.com",
      phone: "01055554444",
      hashedPassword: jobPassword2,
      role: "JOBSEEKER",
    },
  });
  const jobUser3 = await prisma.user.create({
    data: {
      name: "이유진",
      email: "job3@yeosialba.com",
      phone: "01033332222",
      hashedPassword: jobPassword2,
      role: "JOBSEEKER",
    },
  });

  if (jobUser) {
    await prisma.resume.create({
      data: {
        userId: jobUser.id,
        nickname: "밝은미소",
        gender: "여성",
        age: 25,
        height: 165,
        weight: 50,
        region: "SEOUL",
        districts: ["서울 강남구", "서울 서초구"],
        desiredJobs: ["ROOM_SALON", "KARAOKE"],
        experienceLevel: "UNDER_6M",
        desiredSalaryType: "DAILY",
        desiredSalaryAmount: 200000,
        availableHours: "오후 7시~새벽 2시",
        kakaoId: "bright_smile",
        phone: "010-7777-6666",
        title: "성실하게 일하겠습니다",
        introduction: "안녕하세요. 밝은 성격의 25세 여성입니다. 경험은 적지만 항상 밝은 미소로 열심히 하겠습니다. 강남/서초 지역에서 근무를 희망합니다.",
        isPublic: true,
        lastBumpedAt: now,
      },
    });
  }

  await prisma.resume.create({
    data: {
      userId: jobUser2.id,
      nickname: "예쁜언니",
      gender: "여성",
      age: 28,
      height: 170,
      weight: 52,
      region: "SEOUL",
      districts: ["서울 마포구", "서울 영등포구"],
      desiredJobs: ["TEN_CAFE", "BAR_LOUNGE", "PUBLIC_BAR"],
      experienceLevel: "1Y_TO_3Y",
      desiredSalaryType: "DAILY",
      desiredSalaryAmount: 300000,
      availableHours: "평일 오후 8시~새벽 3시",
      kakaoId: "pretty_unni28",
      title: "경력 2년차 프로입니다",
      introduction: "텐카페, 바라운지 경력 2년입니다. 서비스 마인드가 좋다는 평가를 많이 받았습니다. 마포/영등포 지역 희망합니다.",
      isPublic: true,
      lastBumpedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
  });

  await prisma.resume.create({
    data: {
      userId: jobUser3.id,
      nickname: "새출발",
      gender: "여성",
      age: 22,
      region: "BUSAN",
      districts: ["부산 해운대구"],
      desiredJobs: ["KARAOKE", "CLUB"],
      experienceLevel: "BEGINNER",
      desiredSalaryType: "NEGOTIABLE",
      availableHours: "주말 가능",
      kakaoId: "new_start22",
      phone: "010-3333-2222",
      title: "초보지만 열심히 하겠습니다",
      introduction: "안녕하세요! 부산 해운대 거주 22세입니다. 처음이라 긴장되지만 열심히 배우겠습니다.",
      isPublic: true,
      lastBumpedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
  });

  // 공지사항 시드
  const adminUser = await prisma.user.findUnique({ where: { email: "admin@yeosialba.com" } });
  if (adminUser) {
    await prisma.notice.deleteMany();
    const notices = [
      {
        title: "여시알바 오픈 안내",
        content: "안녕하세요, 여시알바입니다.\n\n밤여시 카페 기반의 신뢰할 수 있는 구인구직 플랫폼 '여시알바'가 오픈했습니다.\n\n사장님은 합리적인 가격에 구인 광고를, 구직자는 믿을 수 있는 채용정보를 만나보세요.\n\n많은 이용 부탁드립니다. 감사합니다.",
        isPinned: true,
        viewCount: 156,
      },
      {
        title: "광고 등록 가이드",
        content: "광고 등록 방법을 안내합니다.\n\n1. 사장님 회원가입 후 로그인\n2. 상단 '광고등록' 버튼 클릭\n3. 업소 정보 입력 (업소명, 업종, 연락처, 근무조건 등)\n4. 광고 등급 선택 (무료~특수배너)\n5. 결제 후 광고 게시\n\n무료 등급도 있으니 부담 없이 시작하세요!\n문의사항은 고객센터로 연락 주세요.",
        isPinned: true,
        viewCount: 89,
      },
      {
        title: "이용약관 안내",
        content: "여시알바 이용약관을 안내합니다.\n\n1. 서비스 이용 시 허위 정보 기재를 금지합니다.\n2. 타인의 개인정보를 무단으로 수집/이용하는 행위를 금지합니다.\n3. 불법적인 업소 광고는 즉시 삭제되며, 계정이 정지될 수 있습니다.\n4. 구직자와 사장님 모두 상호 존중하며 건전한 거래 환경을 만들어 주세요.\n\n자세한 내용은 고객센터로 문의 주세요.",
        isPinned: false,
        viewCount: 42,
      },
    ];
    for (const notice of notices) {
      await prisma.notice.create({
        data: {
          ...notice,
          authorId: adminUser.id,
        },
      });
    }
  }

  console.log("Seed complete!");
  console.log("  - 1 Business user: boss@yeosialba.com / test1234");
  console.log("  - 3 Jobseeker users: job@, job2@, job3@yeosialba.com / test1234");
  console.log("  - 1 Admin user: admin@yeosialba.com / admin1234");
  console.log(`  - ${SAMPLE_ADS.length} sample ads (including 3 FREE tier)`);
  console.log("  - 3 sample resumes");
  console.log("  - 3 sample notices");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
