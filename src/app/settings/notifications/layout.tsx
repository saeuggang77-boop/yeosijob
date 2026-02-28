import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "알림 설정",
  description: "알림 수신 설정을 관리하세요. 쪽지, 댓글, 좋아요, 공지사항 알림을 켜거나 끌 수 있습니다.",
};

export default function NotificationSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
