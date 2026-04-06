import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "여시잡 - 사람이 없는 게 아닙니다, 찾는 곳이 달라졌을 뿐입니다",
  description:
    "여시잡 - 유흥업소 전문 구인구직 플랫폼. 업계 여성종사자 전용 카페 회원 20,538명. 매달 수백 명씩 새로운 구직자가 유입됩니다. 무료 광고부터 시작하세요.",
  openGraph: {
    title: "여시잡 - 사람이 없는 게 아닙니다, 찾는 곳이 달라졌을 뿐입니다",
    description:
      "업계 여성종사자 전용 카페 회원 20,538명 · 매달 수백 명씩 새로운 구직자 유입 · 무료 광고 등록 가능",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function WelcomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
