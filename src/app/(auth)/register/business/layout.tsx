import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "사장님 회원가입 | 여시잡",
  description: "사장님 회원가입",
};

export default function BusinessRegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
