import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { PushSubscriptionManager } from "@/components/push/PushSubscriptionManager";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1 overflow-x-hidden pb-16 md:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />
      <PushSubscriptionManager />
    </div>
  );
}
