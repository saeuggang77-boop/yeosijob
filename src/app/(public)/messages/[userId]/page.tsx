import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ConversationView } from "@/components/message/ConversationView";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function ConversationPage({ params }: PageProps) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { userId } = await params;

  const partner = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  if (!partner || !partner.name) {
    redirect("/messages");
  }

  return (
    <ConversationView
      partnerId={userId}
      partnerName={partner.name}
      currentUserId={session.user.id}
    />
  );
}
