import { prisma } from "@/lib/prisma";

export interface ActiveEvent {
  eventName: string;
  bonus30: number;
  bonus60: number;
  bonus90: number;
  endDate: Date | null;
}

/**
 * 현재 활성화된 이벤트를 조회한다.
 * - enabled === true
 * - startDate <= now <= endDate (날짜 설정된 경우)
 * - 날짜 미설정이면 enabled만으로 판단
 */
export async function getActiveEvent(): Promise<ActiveEvent | null> {
  const config = await prisma.eventConfig.findUnique({
    where: { id: "singleton" },
  });

  if (!config || !config.enabled) return null;

  const now = new Date();

  if (config.startDate && now < config.startDate) return null;
  if (config.endDate && now > config.endDate) return null;

  return {
    eventName: config.eventName,
    bonus30: config.bonus30,
    bonus60: config.bonus60,
    bonus90: config.bonus90,
    endDate: config.endDate,
  };
}

/**
 * 선택한 기간에 대한 보너스 일수를 반환한다.
 */
export function getBonusDays(
  durationDays: number,
  event: ActiveEvent | null
): number {
  if (!event) return 0;

  switch (durationDays) {
    case 30:
      return event.bonus30;
    case 60:
      return event.bonus60;
    case 90:
      return event.bonus90;
    default:
      return 0;
  }
}
