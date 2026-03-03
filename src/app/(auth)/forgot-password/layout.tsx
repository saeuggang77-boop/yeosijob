import { Metadata } from "next";

export const metadata: Metadata = {
  title: "비밀번호 찾기",
  description: "가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
