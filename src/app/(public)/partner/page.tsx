import { prisma } from "@/lib/prisma";
import { PARTNER_CATEGORIES } from "@/lib/constants/partners";
import { PartnerCard } from "@/components/partners/PartnerCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const revalidate = 60;

export const metadata = {
  title: "제휴업체 | 여시잡",
  description: "여시잡과 함께하는 제휴업체를 소개합니다",
};

interface PageProps {
  searchParams: Promise<{ category?: string }>;
}

// Shuffle helper
function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default async function PartnerListPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const category = sp.category || "";

  // Fetch ACTIVE + profile complete partners only
  const partners = await prisma.partner.findMany({
    where: {
      status: "ACTIVE",
      isProfileComplete: true,
      ...(category ? { category: category as any } : {}),
    },
    select: {
      id: true,
      name: true,
      category: true,
      region: true,
      description: true,
      highlight: true,
      thumbnailUrl: true,
      grade: true,
      tags: true,
      viewCount: true,
    },
  });

  // Group by grade
  const gradeOrder = ["A", "B", "C", "D"] as const;
  const grouped = gradeOrder.map((grade) =>
    partners.filter((p) => p.grade === grade)
  );

  // Shuffle within each grade, then concatenate
  const sorted = grouped.flatMap((group) => shuffleArray(group));

  const categories = [
    { value: "", label: "전체" },
    ...Object.entries(PARTNER_CATEGORIES).map(([key, val]) => ({
      value: key,
      label: `${val.emoji} ${val.label}`,
    })),
  ];

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold">제휴업체</h1>
        <p className="mt-2 text-muted-foreground">
          여시잡과 함께하는 제휴업체를 소개합니다
        </p>
      </div>

      {/* Category Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 justify-center">
        {categories.map((cat) => {
          const isActive = category === cat.value;
          return (
            <Link key={cat.value} href={`/partner${cat.value ? `?category=${cat.value}` : ""}`}>
              <Button
                variant={isActive ? "default" : "outline"}
                size="sm"
                className="h-9"
              >
                {cat.label}
              </Button>
            </Link>
          );
        })}
      </div>

      {/* Partner Grid */}
      {sorted.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <p className="text-lg">등록된 제휴업체가 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sorted.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} />
          ))}
        </div>
      )}

      {/* Bottom CTA */}
      <div className="mt-12 rounded-lg border bg-gradient-to-r from-primary/5 to-transparent p-6 text-center">
        <h2 className="text-xl font-bold">입점을 원하시나요?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          여시잡과 함께 성장하세요
        </p>
        <Link
          href="https://pf.kakao.com/_zEqYG/chat"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button className="mt-4" size="lg">
            카카오톡 문의하기
          </Button>
        </Link>
      </div>
    </div>
  );
}
