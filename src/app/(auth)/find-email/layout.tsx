import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이메일 찾기",
  description: "전화번호로 가입한 이메일을 찾습니다.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
