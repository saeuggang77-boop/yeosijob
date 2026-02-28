// 업종별 배경 이미지 그룹 매핑
export const BANNER_IMAGE_GROUPS: Record<string, { group: string; count: number }> = {
  ROOM_SALON: { group: "room", count: 107 },
  TEN_CAFE: { group: "room", count: 107 },
  SHIRT_ROOM: { group: "room", count: 107 },
  LEGGINGS_ROOM: { group: "room", count: 107 },
  HYPER_PUBLIC: { group: "room", count: 107 },
  BAR_LOUNGE: { group: "bar", count: 67 },
  PUBLIC_BAR: { group: "bar", count: 67 },
  CLUB: { group: "club", count: 68 },
  KARAOKE: { group: "karaoke", count: 66 },
  MASSAGE: { group: "spa", count: 61 },
  GUANRI: { group: "spa", count: 61 },
  OTHER: { group: "room", count: 107 },
};

export function getBannerImageUrl(businessType: string, template: number): string {
  const mapping = BANNER_IMAGE_GROUPS[businessType] || BANNER_IMAGE_GROUPS.OTHER;
  const imageIndex = (template % mapping.count) + 1;
  return `/banners/${mapping.group}/${imageIndex}.jpg`;
}
