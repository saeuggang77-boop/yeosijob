import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "사장님 회원가입",
  description: "여시잡 사장님 회원가입. 광고 등록 · 인재 검색 · 제휴 입점.",
  alternates: {
    canonical: "/register/business",
  },
};

export default function BusinessRegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
