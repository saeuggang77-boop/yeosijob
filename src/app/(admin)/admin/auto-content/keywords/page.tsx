import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KeywordManager } from "@/components/admin/KeywordManager";

export default async function KeywordsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const config = await prisma.autoContentConfig.findUnique({
    where: { id: "singleton" },
    select: { seoKeywords: true, seoKeywordUsage: true },
  });

  return (
    <div>
      <KeywordManager
        initialKeywords={config?.seoKeywords || []}
        initialUsage={(config?.seoKeywordUsage as Record<string, number>) || {}}
      />
    </div>
  );
}
