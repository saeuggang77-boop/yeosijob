import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const propertyId = process.env.GA_PROPERTY_ID;
  const clientEmail = process.env.GA_CLIENT_EMAIL;
  const privateKey = process.env.GA_PRIVATE_KEY;

  // 1. 환경변수 존재 여부 확인
  const envCheck = {
    GA_PROPERTY_ID: propertyId ? `SET (${propertyId})` : "MISSING",
    GA_CLIENT_EMAIL: clientEmail ? `SET (${clientEmail})` : "MISSING",
    GA_PRIVATE_KEY: privateKey
      ? `SET (length: ${privateKey.length}, starts: ${privateKey.substring(0, 30)}...)`
      : "MISSING",
  };

  // 2. Private Key 포맷 확인
  let keyCheck = "N/A";
  if (privateKey) {
    const processed = privateKey.replace(/\\n/g, "\n");
    const hasBegin = processed.includes("-----BEGIN PRIVATE KEY-----");
    const hasEnd = processed.includes("-----END PRIVATE KEY-----");
    keyCheck = `hasBegin: ${hasBegin}, hasEnd: ${hasEnd}, processedLength: ${processed.length}`;
  }

  // 3. API 연결 테스트
  let apiTest = "SKIPPED";
  if (propertyId && clientEmail && privateKey) {
    try {
      const { BetaAnalyticsDataClient } = await import("@google-analytics/data");
      const client = new BetaAnalyticsDataClient({
        credentials: {
          client_email: clientEmail,
          private_key: privateKey.replace(/\\n/g, "\n"),
        },
      });

      const [response] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
        metrics: [{ name: "activeUsers" }],
      });

      apiTest = `SUCCESS - rows: ${response.rows?.length || 0}, value: ${response.rows?.[0]?.metricValues?.[0]?.value || "no data"}`;
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      apiTest = `ERROR - ${errMsg}`;
    }
  }

  return NextResponse.json({ envCheck, keyCheck, apiTest });
}
