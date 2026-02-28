import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "사장님 회원가입",
  description: "여시잡 사장님 회원가입. 광고를 등록하고 인재를 찾아보세요.",
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
