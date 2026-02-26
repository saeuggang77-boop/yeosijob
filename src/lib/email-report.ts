import { Resend } from "resend";

const REPORT_REASON_LABELS: Record<string, string> = {
  ABUSE: "욕설/비방",
  OBSCENE: "음란물",
  SPAM: "광고/홍보",
  PRIVACY: "개인정보노출",
  OTHER: "기타",
};

export async function sendReportNotificationEmail({
  targetType,
  targetTitle,
  reason,
  detail,
  reporterName,
}: {
  targetType: "게시글" | "댓글";
  targetTitle: string;
  reason: string;
  detail?: string | null;
  reporterName: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // API 키 없으면 조용히 스킵

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  try {
    const resend = new Resend(apiKey);
    const baseUrl = process.env.AUTH_URL || "https://yeosijob.com";

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "여시잡 <onboarding@resend.dev>",
      to: adminEmail,
      subject: `[여시잡 신고] ${targetType}: ${targetTitle.substring(0, 30)}`,
      html: `
        <div style="max-width: 480px; margin: 0 auto; font-family: sans-serif;">
          <h2 style="color: #e53e3e;">신고 접수</h2>
          <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0 0 8px;"><strong>대상:</strong> ${targetType}</p>
            <p style="margin: 0 0 8px;"><strong>내용:</strong> ${targetTitle.substring(0, 100)}</p>
            <p style="margin: 0 0 8px;"><strong>사유:</strong> ${REPORT_REASON_LABELS[reason] || reason}</p>
            ${detail ? `<p style="margin: 0 0 8px;"><strong>상세:</strong> ${detail.substring(0, 200)}</p>` : ""}
            <p style="margin: 0;"><strong>신고자:</strong> ${reporterName}</p>
          </div>
          <a href="${baseUrl}/admin/reports" style="display: inline-block; padding: 12px 24px; background: #e53e3e; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">
            신고 관리 페이지
          </a>
          <hr style="margin-top: 24px; border: none; border-top: 1px solid #eee;" />
          <p style="color: #999; font-size: 12px;">여시잡 - 유흥업계 No.1 구인구직</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Report email notification failed:", error);
    // 이메일 실패해도 인앱 알림은 정상 동작
  }
}
