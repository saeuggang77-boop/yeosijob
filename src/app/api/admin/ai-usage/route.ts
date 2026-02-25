import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMonthlyAiUsage, checkBudgetStatus } from "@/lib/ai-usage";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    const [usage, budget] = await Promise.all([
      getMonthlyAiUsage(),
      checkBudgetStatus(),
    ]);

    return NextResponse.json({
      usage,
      budget,
    });
  } catch (error) {
    console.error("AI usage stats error:", error);
    return NextResponse.json(
      { error: "사용량 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
