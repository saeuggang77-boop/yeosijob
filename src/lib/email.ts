import { Resend } from "resend";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY 환경변수가 설정되지 않았습니다");
  }
  return new Resend(apiKey);
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resend = getResend();
  const resetLink = `${process.env.AUTH_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "여시잡 <onboarding@resend.dev>",
    to: email,
    subject: "[여시잡] 비밀번호 재설정",
    html: `
      <div style="max-width: 480px; margin: 0 auto; font-family: sans-serif;">
        <h2 style="color: #333;">비밀번호 재설정</h2>
        <p>아래 버튼을 클릭하여 비밀번호를 재설정하세요.</p>
        <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #c8a84e; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">
          비밀번호 재설정
        </a>
        <p style="margin-top: 16px; color: #666; font-size: 14px;">
          이 링크는 1시간 후 만료됩니다.<br/>
          본인이 요청하지 않은 경우 이 이메일을 무시해주세요.
        </p>
        <hr style="margin-top: 24px; border: none; border-top: 1px solid #eee;" />
        <p style="color: #999; font-size: 12px;">여시잡 - 유흥업계 No.1 구인구직</p>
      </div>
    `,
  });
}

export async function sendAdExpiryNotification(
  email: string,
  adTitle: string,
  daysLeft: number,
  adId: string,
) {
  const resend = getResend();
  const baseUrl = process.env.AUTH_URL || "https://yeosijob.com";
  const adLink = `${baseUrl}/business/ads/${adId}`;

  const daysText = daysLeft === 0 ? "오늘" : `${daysLeft}일 후`;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "여시잡 <onboarding@resend.dev>",
    to: email,
    subject: `[여시잡] 광고 "${adTitle}" ${daysText} 만료 예정`,
    html: `
      <div style="max-width: 480px; margin: 0 auto; font-family: sans-serif;">
        <h2 style="color: #333;">광고 만료 안내</h2>
        <p>등록하신 광고가 <strong>${daysText}</strong> 만료됩니다.</p>
        <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0; font-weight: bold; color: #333;">${adTitle}</p>
        </div>
        <p>광고를 계속 노출하시려면 만료 전에 연장 또는 재등록해주세요.</p>
        <a href="${adLink}" style="display: inline-block; padding: 12px 24px; background: #c8a84e; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">
          광고 관리하기
        </a>
        <hr style="margin-top: 24px; border: none; border-top: 1px solid #eee;" />
        <p style="color: #999; font-size: 12px;">여시잡 - 유흥업계 No.1 구인구직</p>
      </div>
    `,
  });
}
