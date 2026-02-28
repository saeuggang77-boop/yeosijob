import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "구직자 회원가입",
  description: "여시잡 구직자 회원가입. 무료로 가입하고 유흥업소 채용정보를 확인하세요.",
  alternates: {
    canonical: "/register/jobseeker",
  },
};

export default function JobseekerRegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
