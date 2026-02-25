import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { logAiUsage } from "@/lib/ai-usage";

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "AI 서비스를 사용할 수 없습니다" }, { status: 503 });
    }

    const body = await request.json();
    const { texts } = body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json({ error: "텍스트가 필요합니다" }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `다음은 유흥업소 구인구직 커뮤니티의 게시글 제목/문장 목록입니다.
각 항목에서 구글 SEO에 유용한 핵심 키워드만 추출하세요.

규칙:
1. 감정 표현(ㅠㅠ, ㅋㅋ, 하.., 제발, 진짜 등) 제거
2. 의미 없는 조사/어미 제거
3. 검색에 실제 사용될 업계 용어와 핵심 명사만 추출
4. 한 항목에서 1~3개 키워드 추출
5. 중복 키워드는 하나만 남기기
6. 너무 일반적인 단어(것, 거, 좀, 뭐 등)는 제외

입력:
${texts.map((t: string, i: number) => `${i + 1}. ${t}`).join("\n")}

반드시 아래 JSON 배열 형식으로만 반환하세요 (다른 텍스트 없이):
["키워드1", "키워드2", "키워드3", ...]`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "AI 응답 형식 오류" }, { status: 500 });
    }

    await logAiUsage(
      "KEYWORD_EXTRACT",
      message.usage.input_tokens,
      message.usage.output_tokens
    );

    const keywords: string[] = JSON.parse(content.text);

    return NextResponse.json({ keywords });
  } catch (error) {
    console.error("Keyword extraction error:", error);
    return NextResponse.json(
      { error: "키워드 추출에 실패했습니다" },
      { status: 500 }
    );
  }
}
