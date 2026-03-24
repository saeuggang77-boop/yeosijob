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
      viewCount: true,
    },
  });

  // 모든 유료 업체 동등 노출 - 랜덤 셔플
  const sorted = shuffleArray(partners);

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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {sorted.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} />
          ))}
        </div>
      )}

      {/* Bottom CTA */}
      <div className="mt-12 rounded-lg border bg-gradient-to-r from-primary/5 to-transparent p-6 text-center">
        <h2 className="text-xl font-bold">입점을 원하시나요?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          사장님 계정으로 로그인 후 바로 등록할 수 있습니다
        </p>
        <Link href="/business/partner">
          <Button className="mt-4" size="lg">
            제휴업체 등록하기
          </Button>
        </Link>
      </div>
    </div>
  );
}
