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
  {
    title: "강남 고급 룸싸롱 여성 정직원 모집",
    businessName: "강남 로얄클럽",
    businessType: "ROOM_SALON" as const,
    regions: ["SEOUL" as const],
    salaryText: "일급 30만~50만+α",
    workHours: "PM 7:00 ~ AM 3:00",
    benefits: "의상 제공, 식사 제공, 택시비 지원, 숙소 제공 가능",
    description:
      "강남 최고급 룸싸롱에서 함께할 분을 모집합니다.\n\n경력 무관, 미경험자도 환영합니다.\n매니저가 친절하게 도와드립니다.\n\n- 일급 30만~50만+α (능력에 따라)\n- 의상, 헤어, 메이크업 무료 지원\n- 퇴근 후 택시비 지원\n- 숙소 필요시 제공 가능\n\n편하게 연락주세요!",
    contactPhone: "01012345678",
    contactKakao: "royalclub_ceo",
  },
  {
    title: "홍대 텐카페 신규 오픈 대량 모집",
    businessName: "홍대 스타카페",
    businessType: "TEN_CAFE" as const,
    regions: ["SEOUL" as const],
    salaryText: "시급 25,000~35,000",
    workHours: "PM 6:00 ~ AM 2:00",
    benefits: "식사 제공, 의상 제공",
    description:
      "홍대에 신규 오픈하는 텐카페입니다!\n\n밝고 활기찬 분위기에서 함께할 분을 모집합니다.\n경력 무관, 초보자 환영!\n\n지원 시 카카오톡으로 연락주세요.",
    contactPhone: "01023456789",
    contactKakao: "starcafe_hd",
  },
  {
    title: "부산 서면 바라운지 스탭 급구",
    businessName: "서면 블루라운지",
    businessType: "BAR_LOUNGE" as const,
    regions: ["BUSAN" as const],
    salaryText: "시급 20,000~30,000",
    workHours: "PM 8:00 ~ AM 4:00",
    benefits: "식사 제공, 택시비 지원",
    description:
      "서면 중심가에 위치한 바라운지에서 스탭을 구합니다.\n\n분위기 좋은 곳에서 편하게 일하실 분 환영!\n\n급구이니 바로 연락주세요.",
    contactPhone: "01034567890",
  },
  {
    title: "강남 퍼블릭바 주말 파트타임",
    businessName: "강남 네온바",
    businessType: "PUBLIC_BAR" as const,
    regions: ["SEOUL" as const, "GYEONGGI" as const],
    salaryText: "시급 22,000+팁",
    workHours: "PM 9:00 ~ AM 5:00 (주말)",
    benefits: "팁 100% 본인, 식사 제공",
    description:
      "강남역 5분 거리 퍼블릭바에서 주말 파트타임을 구합니다.\n\n팁 전액 본인!\n주 2~3일 가능한 분 우대.",
    contactPhone: "01045678901",
    contactKakao: "neonbar",
  },
  {
    title: "대구 동성로 노래방 도우미 모집",
    businessName: "동성로 스타노래방",
    businessType: "KARAOKE" as const,
    regions: ["DAEGU" as const],
    salaryText: "일급 15만~25만",
    workHours: "PM 7:00 ~ AM 2:00",
    benefits: "식사, 의상 제공",
    description:
      "대구 동성로 대형 노래방에서 도우미를 모집합니다.\n\n친절하고 성실한 분 환영!\n경력자 우대, 초보 가능.",
    contactPhone: "01056789012",
  },
  {
    title: "인천 하이퍼블릭 정직원 구합니다",
    businessName: "인천 파티클럽",
    businessType: "HYPER_PUBLIC" as const,
    regions: ["INCHEON" as const],
    salaryText: "일급 25만~40만",
    workHours: "PM 8:00 ~ AM 4:00",
    benefits: "숙소, 식사, 의상, 택시비 전부 제공",
    description:
      "인천 최대 규모 하이퍼블릭에서 정직원을 구합니다.\n\n전국에서 오시는 분 숙소 지원!\n4대 보험 가능.\n\n편하게 문의주세요.",
    contactPhone: "01067890123",
    contactKakao: "partyclub_ic",
  },
  {
    title: "경기 수원 셔츠룸 긴급 채용",
    businessName: "수원 엘리트",
    businessType: "SHIRT_ROOM" as const,
    regions: ["GYEONGGI" as const],
    salaryText: "일급 28만~45만",
    workHours: "PM 7:30 ~ AM 3:00",
    benefits: "식사, 셔츠 제공, 택시비",
    description:
      "수원 인계동 셔츠룸에서 급하게 채용합니다.\n\n바로 출근 가능한 분 우대!\n일급 당일 정산.",
    contactPhone: "01078901234",
  },
  {
    title: "광주 클럽 주말 알바 모집",
    businessName: "광주 매직클럽",
    businessType: "CLUB" as const,
    regions: ["GWANGJU" as const],
    salaryText: "시급 30,000+팁",
    workHours: "PM 10:00 ~ AM 5:00 (금토)",
    benefits: "팁 전액, 음료 무제한",
    description:
      "광주 최대 클럽에서 주말 파트타임을 구합니다.\n금토 근무, 팁 전액 본인!\n\n즐겁게 일하면서 돈 벌어보세요.",
    contactPhone: "01089012345",
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
        productId: "LINE",
        durationDays: 30,
        totalAmount: 70000,
        status: "ACTIVE",
        startDate,
        endDate,
        autoJumpPerDay: 12,
        manualJumpPerDay: 0,
        lastJumpedAt: lastJumped,
        isVerified: i < 3,
        viewCount: Math.floor(Math.random() * 500),
        maxEdits: 1,
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

  const resumeExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

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
        expiresAt: resumeExpiry,
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
      expiresAt: resumeExpiry,
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
      expiresAt: resumeExpiry,
      lastBumpedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
  });

  console.log("Seed complete!");
  console.log("  - 1 Business user: boss@yeosialba.com / test1234");
  console.log("  - 3 Jobseeker users: job@, job2@, job3@yeosialba.com / test1234");
  console.log("  - 1 Admin user: admin@yeosialba.com / admin1234");
  console.log(`  - ${SAMPLE_ADS.length} sample ads`);
  console.log("  - 3 sample resumes");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
