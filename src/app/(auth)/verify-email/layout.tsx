import { Metadata } from "next";

export const metadata: Metadata = {
  title: "이메일 인증",
  description: "이메일 인증을 완료하여 회원가입을 마무리합니다.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
