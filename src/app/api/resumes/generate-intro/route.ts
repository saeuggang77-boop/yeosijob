import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAiUsage } from "@/lib/ai-usage";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();
const DAILY_LIMIT = 5;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "JOBSEEKER") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "AI 서비스를 사용할 수 없습니다" }, { status: 503 });
    }

    // 1일 5회 제한
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = await prisma.aiUsageLog.count({
      where: {
        context: `resume-intro:${session.user.id}`,
        createdAt: { gte: todayStart },
      },
    });
    if (todayCount >= DAILY_LIMIT) {
      return NextResponse.json(
        { error: `AI 자동완성은 1일 ${DAILY_LIMIT}회까지 사용할 수 있습니다` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { nickname, age, experienceLevel, desiredJobs, region } = body;

    if (!nickname || !age) {
      return NextResponse.json({ error: "닉네임과 나이를 먼저 입력해주세요" }, { status: 400 });
    }

    const experienceMap: Record<string, string> = {
      BEGINNER: "경험 없는 초보",
      UNDER_6M: "6개월 미만 경력",
      "6M_TO_1Y": "6개월~1년 경력",
      "1Y_TO_3Y": "1년~3년 경력",
      OVER_3Y: "3년 이상 경력",
    };

    const expText = experienceMap[experienceLevel] || "초보";
    const regionText = region || "미정";

    const prompt = `접객 서비스 분야 구직자의 자기소개를 300~400자로 작성해주세요.

구조: 아래 순서로 단락을 나눠 작성하세요. 각 단락 사이에 줄바꿈을 넣으세요.
1. 인사 + 간단한 자기소개 (닉네임, 나이, 경력)
2. 성격과 장점 (친화력, 분위기, 대화 능력 등)
3. 근무 태도 (성실함, 시간 약속, 책임감 등)
4. 마무리 어필 한 줄

톤: 밝고 친근하며 자신감 있는 느낌. 딱딱한 취업 자소서가 아니라, 사장님에게 어필하는 가벼운 인사말 스타일.
금지: "회사 발전", "팀워크", "비전" 같은 기업 면접 표현은 절대 쓰지 마세요.
금지: 개인정보(실명, 전화번호) 포함 금지.
존댓말(~합니다, ~입니다)을 사용하세요.

- 닉네임: ${nickname}
- 나이: ${age}세
- 경력: ${expText}
- 희망 근무지역: ${regionText}

자기소개 문구만 출력하세요.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    // 사용량 로깅
    logAiUsage(
      "claude-sonnet-4-20250514",
      message.usage.input_tokens,
      message.usage.output_tokens,
      `resume-intro:${session.user.id}`
    );

    return NextResponse.json({ introduction: text.trim(), remainingCount: DAILY_LIMIT - todayCount - 1 });
  } catch (error) {
    console.error("Generate intro error:", error);
    return NextResponse.json(
      { error: "자기소개 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
