import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "JOBSEEKER") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "AI 서비스를 사용할 수 없습니다" }, { status: 503 });
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

    const jobNames = (desiredJobs || []).join(", ") || "미정";
    const expText = experienceMap[experienceLevel] || "초보";
    const regionText = region || "미정";

    const prompt = `당신은 한국 유흥업소 구직 플랫폼의 자기소개 작성 도우미입니다.
아래 정보를 바탕으로 구직자의 자기소개 문구를 200자 내외로 작성해주세요.
밝고 긍정적이며 성실한 인상을 주는 문체로 작성하세요.
존댓말(~합니다, ~입니다)을 사용하세요.
절대 개인정보(실명, 전화번호 등)를 포함하지 마세요.

- 닉네임: ${nickname}
- 나이: ${age}세
- 경력: ${expText}
- 희망 업종: ${jobNames}
- 희망 지역: ${regionText}

자기소개 문구만 작성하고, 다른 설명은 하지 마세요.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({ introduction: text.trim() });
  } catch (error) {
    console.error("Generate intro error:", error);
    return NextResponse.json(
      { error: "자기소개 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
