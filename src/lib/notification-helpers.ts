import { prisma } from "@/lib/prisma";

const NOTIF_PREF_SELECT = {
  notifyMessage: true,
  notifyComment: true,
  notifyNotice: true,
  notifyLike: true,
  notifyResume: true,
  quietHoursStart: true,
  quietHoursEnd: true,
} as const;

export type NotifPrefs = {
  notifyMessage: boolean;
  notifyComment: boolean;
  notifyNotice: boolean;
  notifyLike: boolean;
  notifyResume: boolean;
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
};

/**
 * 사용자의 알림 설정을 조회한다.
 * 사용자가 없으면 모든 알림 ON (기본값)을 반환.
 */
export async function getUserNotifPrefs(userId: string): Promise<NotifPrefs> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: NOTIF_PREF_SELECT,
  });

  if (!user) {
    return {
      notifyMessage: true,
      notifyComment: true,
      notifyNotice: true,
      notifyLike: true,
      notifyResume: true,
      quietHoursStart: null,
      quietHoursEnd: null,
    };
  }

  return user;
}

/**
 * 현재 한국시간(KST) 기준으로 방해금지 시간인지 체크.
 * start=23, end=7 → 23:00~06:59 사이면 true
 * start/end가 null이면 방해금지 비활성 → false
 */
export function isInQuietHours(
  start: number | null,
  end: number | null
): boolean {
  if (start === null || end === null) return false;

  const now = new Date();
  // KST = UTC+9
  const kstHour = (now.getUTCHours() + 9) % 24;

  if (start <= end) {
    // 예: start=9, end=18 → 09:00~17:59
    return kstHour >= start && kstHour < end;
  } else {
    // 예: start=23, end=7 → 23:00~06:59 (자정 넘김)
    return kstHour >= start || kstHour < end;
  }
}
