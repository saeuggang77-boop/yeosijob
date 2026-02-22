/**
 * 카카오 알림톡 설정
 * Phase 3 Item 29
 */

/**
 * 카카오 알림톡 사용 가능 여부 확인
 */
export function isKakaoAlertEnabled(): boolean {
  const apiKey = process.env.KAKAO_ALERT_API_KEY;
  const senderKey = process.env.KAKAO_ALERT_SENDER_KEY;
  return !!(apiKey && senderKey);
}

/**
 * 카카오 알림톡 발송 (placeholder)
 * TODO: 실제 카카오 비즈메시지 API 연동 구현
 * - API Endpoint: https://kapi.kakao.com/v2/api/alimtalk/send
 * - Authorization: Bearer {KAKAO_ALERT_API_KEY}
 * - Body: { senderKey, templateId, to, variables }
 */
export async function sendKakaoAlert(
  phone: string,
  templateId: string,
  variables: Record<string, string>
): Promise<boolean> {
  if (!isKakaoAlertEnabled()) {
    console.log("[카카오 알림톡] 서비스가 비활성화되어 있습니다");
    return false;
  }

  // TODO: 실제 카카오 비즈메시지 API 호출 구현
  console.log("[카카오 알림톡] 발송 (placeholder):", {
    phone,
    templateId,
    variables,
    timestamp: new Date().toISOString(),
  });

  // Placeholder: 성공 반환
  return true;
}
