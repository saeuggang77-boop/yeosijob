import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { AgeVerification } from "@/components/AgeVerification";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const baseUrl = process.env.AUTH_URL || "https://yeosijob.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "여시잡 | 유흥알바 밤알바 룸알바 No.1 구인구직",
    template: "%s | 여시잡",
  },
  description: "여시잡에서 유흥업소 채용정보와 인재를 만나보세요. 룸싸롱, 노래방, 텐카페, 바, 클럽 등 전국 유흥알바 구인구직",
  keywords: ["유흥알바", "밤알바", "룸알바", "구인구직", "여시잡", "룸싸롱", "노래방", "텐카페", "바", "클럽"],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "여시잡",
    title: "여시잡 | 유흥알바 밤알바 룸알바 No.1 구인구직",
    description: "여시잡에서 유흥업소 채용정보와 인재를 만나보세요. 룸싸롱, 노래방, 텐카페, 바, 클럽 등 전국 유흥알바 구인구직",
  },
  twitter: {
    card: "summary",
    title: "여시잡 | 유흥알바 밤알바 룸알바 No.1 구인구직",
    description: "여시잡에서 유흥업소 채용정보와 인재를 만나보세요.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${jakartaSans.variable} antialiased`}>
        <GoogleAnalytics />
        <ThemeProvider>
          <SessionProvider>
            <AgeVerification />
            {children}
            <Toaster />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
