import { BetaAnalyticsDataClient } from "@google-analytics/data";

// GA 클라이언트 초기화
let analyticsClient: BetaAnalyticsDataClient | null = null;

function getClient() {
  if (analyticsClient) return analyticsClient;

  const propertyId = process.env.GA_PROPERTY_ID?.trim();
  const clientEmail = process.env.GA_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GA_PRIVATE_KEY?.trim();

  if (!propertyId || !clientEmail || !privateKey) {
    console.warn("Google Analytics credentials not configured");
    return null;
  }

  try {
    analyticsClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, "\n"),
      },
    });
    return analyticsClient;
  } catch (error) {
    console.error("Failed to initialize Google Analytics client:", error);
    return null;
  }
}

interface TrafficSummary {
  today: { visitors: number; pageViews: number };
  last7Days: { visitors: number; pageViews: number };
  last30Days: { visitors: number; pageViews: number };
}

interface TopPage {
  pagePath: string;
  pageViews: number;
  visitors: number;
}

interface TrafficSource {
  source: string;
  sessions: number;
}

interface DeviceBreakdown {
  device: string;
  sessions: number;
  percentage: number;
}

/**
 * 오늘/7일/30일 트래픽 요약 조회
 */
export async function getTrafficSummary(): Promise<TrafficSummary | null> {
  const client = getClient();
  if (!client) return null;

  const propertyId = process.env.GA_PROPERTY_ID;
  if (!propertyId) return null;

  try {
    const [todayReport, last7DaysReport, last30DaysReport] = await Promise.all([
      client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: "today", endDate: "today" }],
        metrics: [
          { name: "activeUsers" },
          { name: "screenPageViews" },
        ],
      }),
      client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
        metrics: [
          { name: "activeUsers" },
          { name: "screenPageViews" },
        ],
      }),
      client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        metrics: [
          { name: "activeUsers" },
          { name: "screenPageViews" },
        ],
      }),
    ]);

    return {
      today: {
        visitors: parseInt(todayReport[0].rows?.[0]?.metricValues?.[0]?.value || "0"),
        pageViews: parseInt(todayReport[0].rows?.[0]?.metricValues?.[1]?.value || "0"),
      },
      last7Days: {
        visitors: parseInt(last7DaysReport[0].rows?.[0]?.metricValues?.[0]?.value || "0"),
        pageViews: parseInt(last7DaysReport[0].rows?.[0]?.metricValues?.[1]?.value || "0"),
      },
      last30Days: {
        visitors: parseInt(last30DaysReport[0].rows?.[0]?.metricValues?.[0]?.value || "0"),
        pageViews: parseInt(last30DaysReport[0].rows?.[0]?.metricValues?.[1]?.value || "0"),
      },
    };
  } catch (error) {
    console.error("Failed to fetch traffic summary:", error);
    return null;
  }
}

/**
 * 인기 페이지 TOP N 조회
 */
export async function getTopPages(limit = 10): Promise<TopPage[] | null> {
  const client = getClient();
  if (!client) return null;

  const propertyId = process.env.GA_PROPERTY_ID;
  if (!propertyId) return null;

  try {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      dimensions: [{ name: "pagePath" }],
      metrics: [
        { name: "screenPageViews" },
        { name: "activeUsers" },
      ],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit,
    });

    if (!response.rows || response.rows.length === 0) return [];

    return response.rows.map((row) => ({
      pagePath: row.dimensionValues?.[0]?.value || "",
      pageViews: parseInt(row.metricValues?.[0]?.value || "0"),
      visitors: parseInt(row.metricValues?.[1]?.value || "0"),
    }));
  } catch (error) {
    console.error("Failed to fetch top pages:", error);
    return null;
  }
}

/**
 * 유입 경로별 세션수 조회
 */
export async function getTrafficSources(): Promise<TrafficSource[] | null> {
  const client = getClient();
  if (!client) return null;

  const propertyId = process.env.GA_PROPERTY_ID;
  if (!propertyId) return null;

  try {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      dimensions: [{ name: "sessionSource" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    });

    if (!response.rows || response.rows.length === 0) return [];

    return response.rows.map((row) => ({
      source: row.dimensionValues?.[0]?.value || "(direct)",
      sessions: parseInt(row.metricValues?.[0]?.value || "0"),
    }));
  } catch (error) {
    console.error("Failed to fetch traffic sources:", error);
    return null;
  }
}

/**
 * 기기별 비율 조회
 */
export async function getDeviceBreakdown(): Promise<DeviceBreakdown[] | null> {
  const client = getClient();
  if (!client) return null;

  const propertyId = process.env.GA_PROPERTY_ID;
  if (!propertyId) return null;

  try {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      dimensions: [{ name: "deviceCategory" }],
      metrics: [{ name: "sessions" }],
    });

    if (!response.rows || response.rows.length === 0) return [];

    const totalSessions = response.rows.reduce(
      (sum, row) => sum + parseInt(row.metricValues?.[0]?.value || "0"),
      0
    );

    return response.rows.map((row) => {
      const sessions = parseInt(row.metricValues?.[0]?.value || "0");
      return {
        device: row.dimensionValues?.[0]?.value || "unknown",
        sessions,
        percentage: totalSessions > 0 ? (sessions / totalSessions) * 100 : 0,
      };
    });
  } catch (error) {
    console.error("Failed to fetch device breakdown:", error);
    return null;
  }
}
