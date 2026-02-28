import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인",
  description: "여시잡 로그인. 이메일 또는 카카오, 구글 계정으로 간편하게 로그인하세요.",
  alternates: {
    canonical: "/login",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
