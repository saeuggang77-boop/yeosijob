/**
 * 데이터베이스 안전 유틸리티
 * 프로덕션 DB 실수 접근 방지
 */
import * as readline from "readline";

// Neon production DB host patterns
const PRODUCTION_PATTERNS = [
  "neon.tech",
  "neon-serverless",
  "vercel-storage",
  ".neon.",
];

export function isProductionDB(databaseUrl?: string): boolean {
  if (!databaseUrl) return false;
  const url = databaseUrl.toLowerCase();
  return PRODUCTION_PATTERNS.some((pattern) => url.includes(pattern));
}

export function getDbLabel(databaseUrl?: string): string {
  if (!databaseUrl) return "UNKNOWN";
  if (isProductionDB(databaseUrl)) return "🔴 PRODUCTION";
  if (databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1")) return "🟢 LOCAL";
  return "🟡 UNKNOWN";
}

/**
 * 파괴적 작업 전 프로덕션 DB 보호
 * - 프로덕션 DB인 경우 ALLOW_PRODUCTION_DESTRUCTIVE=true 환경변수 필요
 * - 인터랙티브 확인 프롬프트 표시
 */
export async function guardDestructiveOperation(
  operationName: string,
  databaseUrl?: string
): Promise<void> {
  const dbLabel = getDbLabel(databaseUrl);
  console.log(`\n🗄️  대상 데이터베이스: ${dbLabel}`);
  console.log(`⚠️  작업: ${operationName}\n`);

  if (isProductionDB(databaseUrl)) {
    if (process.env.ALLOW_PRODUCTION_DESTRUCTIVE !== "true") {
      console.error("🚫 프로덕션 DB에서 파괴적 작업이 차단되었습니다!");
      console.error("   이 작업을 실행하려면 환경변수를 설정하세요:");
      console.error("   ALLOW_PRODUCTION_DESTRUCTIVE=true");
      console.error("");
      console.error("   예: ALLOW_PRODUCTION_DESTRUCTIVE=true npx tsx prisma/seed.ts");
      process.exit(1);
    }

    // Even with the flag, require interactive confirmation
    const confirmed = await confirmPrompt(
      `⚠️  정말로 프로덕션 DB에서 "${operationName}"을(를) 실행하시겠습니까?\n` +
      "   이 작업은 되돌릴 수 없습니다. 'YES'를 입력하세요: "
    );

    if (confirmed !== "YES") {
      console.log("❌ 작업이 취소되었습니다.");
      process.exit(0);
    }

    console.log("✅ 프로덕션 작업 승인됨\n");
  }
}

/**
 * 비파괴적 작업 (읽기/추가만) 전 안전 확인
 * - 프로덕션 DB인 경우 경고만 표시
 */
export function guardSafeOperation(
  operationName: string,
  databaseUrl?: string
): void {
  const dbLabel = getDbLabel(databaseUrl);
  console.log(`\n🗄️  대상 데이터베이스: ${dbLabel}`);
  console.log(`📋 작업: ${operationName}\n`);
}

function confirmPrompt(question: string): Promise<string> {
  // If not interactive (CI/piped), reject by default
  if (!process.stdin.isTTY) {
    console.error("🚫 비인터랙티브 환경에서는 프로덕션 파괴적 작업을 실행할 수 없습니다.");
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}
