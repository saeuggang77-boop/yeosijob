import { Metadata } from "next";

export const metadata: Metadata = {
  title: "글쓰기",
  description: "커뮤니티에 새 글을 작성합니다.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
