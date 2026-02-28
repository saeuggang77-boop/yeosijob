import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "구직자 회원가입 | 여시잡",
  description: "구직자 회원가입",
};

export default function JobseekerRegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
