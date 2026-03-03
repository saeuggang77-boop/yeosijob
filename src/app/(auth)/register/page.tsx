import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "회원가입",
  description: "여시잡 회원가입 - 사업자 또는 구직자로 가입하세요.",
};

export default function RegisterPage() {
  redirect("/register/jobseeker");
}
