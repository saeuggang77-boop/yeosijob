export const BUSINESS_TYPES = {
  KARAOKE: { label: "노래방/가라오케", shortLabel: "노래방" },
  ROOM_SALON: { label: "룸싸롱", shortLabel: "룸싸롱" },
  TEN_CAFE: { label: "텐카페", shortLabel: "텐카페" },
  SHIRT_ROOM: { label: "셔츠룸", shortLabel: "셔츠룸" },
  LEGGINGS_ROOM: { label: "레깅스룸", shortLabel: "레깅스룸" },
  PUBLIC_BAR: { label: "퍼블릭바", shortLabel: "퍼블릭" },
  HYPER_PUBLIC: { label: "하이퍼블릭", shortLabel: "하이퍼" },
  BAR_LOUNGE: { label: "바/라운지", shortLabel: "바" },
  CLUB: { label: "클럽", shortLabel: "클럽" },
  MASSAGE: { label: "마사지", shortLabel: "마사지" },
  GUANRI: { label: "관리사", shortLabel: "관리사" },
  OTHER: { label: "기타", shortLabel: "기타" },
} as const;

export type BusinessTypeKey = keyof typeof BUSINESS_TYPES;

export const BUSINESS_TYPE_LIST = Object.entries(BUSINESS_TYPES).map(
  ([key, value]) => ({
    value: key as BusinessTypeKey,
    label: value.label,
  })
);
