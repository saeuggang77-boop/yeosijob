// 업종별 배경 이미지 그룹 매핑
export const BANNER_IMAGE_GROUPS: Record<string, { group: string; count: number }> = {
  ROOM_SALON: { group: "room", count: 70 },
  TEN_CAFE: { group: "room", count: 70 },
  SHIRT_ROOM: { group: "room", count: 70 },
  LEGGINGS_ROOM: { group: "room", count: 70 },
  HYPER_PUBLIC: { group: "room", count: 70 },
  BAR_LOUNGE: { group: "bar", count: 70 },
  PUBLIC_BAR: { group: "bar", count: 70 },
  CLUB: { group: "club", count: 70 },
  KARAOKE: { group: "karaoke", count: 70 },
  MASSAGE: { group: "spa", count: 70 },
  GUANRI: { group: "spa", count: 70 },
  OTHER: { group: "room", count: 70 },
};

export function getBannerImageUrl(businessType: string, template: number): string {
  const mapping = BANNER_IMAGE_GROUPS[businessType] || BANNER_IMAGE_GROUPS.OTHER;
  const imageIndex = (template % mapping.count) + 1;
  return `/banners/${mapping.group}/${imageIndex}.jpg`;
}
