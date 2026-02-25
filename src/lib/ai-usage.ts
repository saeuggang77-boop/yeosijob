import { prisma } from "@/lib/prisma";

/**
 * AI 사용량 로그 기록 (Anthropic Claude API)
 *
 * @param model - 사용된 모델명 (예: "claude-sonnet-4-20250514")
 * @param inputTokens - 입력 토큰 수
 * @param outputTokens - 출력 토큰 수
 * @param context - 사용 컨텍스트 (예: "auto-content-post", "contextual-comment")
 */
export async function logAiUsage(
  model: string,
  inputTokens: number,
  outputTokens: number,
  context?: string
): Promise<void> {
  try {
    // Anthropic 가격표 (2026년 기준, USD → KRW 1,300원 환율)
    const isHaiku = model.includes("haiku");
    const pricePerMTokenInput = (isHaiku ? 1 : 3) * 1300;
    const pricePerMTokenOutput = (isHaiku ? 5 : 15) * 1300;

    const inputCost = (inputTokens / 1_000_000) * pricePerMTokenInput;
    const outputCost = (outputTokens / 1_000_000) * pricePerMTokenOutput;
    const totalCostKrw = Math.ceil(inputCost + outputCost);

    await prisma.aiUsageLog.create({
      data: {
        model,
        inputTokens,
        outputTokens,
        estimatedCostKrw: totalCostKrw,
        context: context || null,
      },
    });
  } catch (error) {
    console.error("AI usage log failed:", error);
    // 로깅 실패는 무시 (핵심 기능 방해 방지)
  }
}

/**
 * 이번 달 AI 사용량 조회
 */
export async function getMonthlyAiUsage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const logs = await prisma.aiUsageLog.findMany({
    where: {
      createdAt: { gte: monthStart },
    },
    select: {
      inputTokens: true,
      outputTokens: true,
      estimatedCostKrw: true,
    },
  });

  const totalInputTokens = logs.reduce((sum, log) => sum + log.inputTokens, 0);
  const totalOutputTokens = logs.reduce((sum, log) => sum + log.outputTokens, 0);
  const totalCostKrw = logs.reduce((sum, log) => sum + log.estimatedCostKrw, 0);

  return {
    totalInputTokens,
    totalOutputTokens,
    totalTokens: totalInputTokens + totalOutputTokens,
    totalCostKrw,
    requestCount: logs.length,
  };
}

/**
 * 월간 예산 대비 사용률 확인
 */
export async function checkBudgetStatus() {
  const config = await prisma.autoContentConfig.findUnique({
    where: { id: "singleton" },
    select: { monthlyBudgetKrw: true },
  });

  if (!config) {
    return { budgetKrw: 0, usedKrw: 0, remainingKrw: 0, usagePercent: 0, isOverBudget: false };
  }

  const usage = await getMonthlyAiUsage();
  const remainingKrw = config.monthlyBudgetKrw - usage.totalCostKrw;
  const usagePercent = (usage.totalCostKrw / config.monthlyBudgetKrw) * 100;

  return {
    budgetKrw: config.monthlyBudgetKrw,
    usedKrw: usage.totalCostKrw,
    remainingKrw,
    usagePercent: Math.round(usagePercent * 10) / 10,
    isOverBudget: usage.totalCostKrw >= config.monthlyBudgetKrw,
  };
}
