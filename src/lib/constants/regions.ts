export const REGIONS = {
  SEOUL: { label: "서울", shortLabel: "서울" },
  GYEONGGI: { label: "경기", shortLabel: "경기" },
  INCHEON: { label: "인천", shortLabel: "인천" },
  BUSAN: { label: "부산", shortLabel: "부산" },
  DAEGU: { label: "대구", shortLabel: "대구" },
  DAEJEON: { label: "대전", shortLabel: "대전" },
  GWANGJU: { label: "광주", shortLabel: "광주" },
  ULSAN: { label: "울산", shortLabel: "울산" },
  SEJONG: { label: "세종", shortLabel: "세종" },
  GANGWON: { label: "강원", shortLabel: "강원" },
  CHUNGBUK: { label: "충북", shortLabel: "충북" },
  CHUNGNAM: { label: "충남", shortLabel: "충남" },
  JEONBUK: { label: "전북", shortLabel: "전북" },
  JEONNAM: { label: "전남", shortLabel: "전남" },
  GYEONGBUK: { label: "경북", shortLabel: "경북" },
  GYEONGNAM: { label: "경남", shortLabel: "경남" },
  JEJU: { label: "제주", shortLabel: "제주" },
} as const;

export type RegionKey = keyof typeof REGIONS;

export const REGION_LIST = Object.entries(REGIONS).map(([key, value]) => ({
  value: key as RegionKey,
  label: value.label,
}));
