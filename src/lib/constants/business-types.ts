export const BUSINESS_TYPES = {
  KARAOKE: { label: "노래방/가라오케", shortLabel: "노래방", icon: "🎤" },
  ROOM_SALON: { label: "룸싸롱", shortLabel: "룸싸롱", icon: "🥂" },
  TEN_CAFE: { label: "텐카페", shortLabel: "텐카페", icon: "☕" },
  SHIRT_ROOM: { label: "셔츠룸", shortLabel: "셔츠룸", icon: "👔" },
  LEGGINGS_ROOM: { label: "레깅스룸", shortLabel: "레깅스룸", icon: "👠" },
  PUBLIC_BAR: { label: "퍼블릭바", shortLabel: "퍼블릭", icon: "🍸" },
  HYPER_PUBLIC: { label: "하이퍼블릭", shortLabel: "하이퍼", icon: "🎉" },
  BAR_LOUNGE: { label: "바/라운지", shortLabel: "바", icon: "🍷" },
  CLUB: { label: "클럽", shortLabel: "클럽", icon: "🎵" },
  MASSAGE: { label: "마사지", shortLabel: "마사지", icon: "💆" },
  GUANRI: { label: "관리사", shortLabel: "관리사", icon: "✨" },
  OTHER: { label: "기타", shortLabel: "기타", icon: "📋" },
} as const;

export type BusinessTypeKey = keyof typeof BUSINESS_TYPES;

export const BUSINESS_TYPE_LIST = Object.entries(BUSINESS_TYPES).map(
  ([key, value]) => ({
    value: key as BusinessTypeKey,
    label: value.label,
  })
);
