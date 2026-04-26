export function TrustBlock() {
  return (
    <section className="border-b bg-gradient-to-b from-primary/[0.04] to-transparent">
      <div className="px-4 py-6 md:py-7">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
            🤝 단독 제휴
          </span>
          <p className="text-sm font-bold text-foreground md:text-base">
            밤여시 카페 회원 <span className="text-primary">2만+</span> 단독 제휴
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
          <StatCard num="20,538" label="카페 회원" />
          <StatCard num="11,328" label="일 평균 조회수" />
          <StatCard num="614명" label="월 평균 가입" />

          <a
            href="https://cafe.naver.com/3giphone"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative col-span-3 flex items-center gap-3 overflow-hidden rounded-xl border border-primary/35 bg-card px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_6px_24px_rgba(212,168,83,0.15)] md:col-span-1"
          >
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#03c75a] text-base font-black text-white shadow-[0_2px_8px_rgba(3,199,90,0.3)]">
              N
            </span>
            <span className="relative min-w-0 flex-1">
              <span className="block text-[13px] font-bold leading-tight text-primary">
                거짓말 아닙니다, 직접 보세요
              </span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                밤여시 카페 실시간 공개
              </span>
            </span>
            <span className="relative text-lg font-bold text-primary opacity-60 transition-opacity group-hover:opacity-100">
              ↗
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}

function StatCard({ num, label }: { num: string; label: string }) {
  return (
    <div className="rounded-xl border bg-card p-3 text-center transition-colors hover:border-primary/40 md:p-4">
      <div className="text-2xl font-extrabold leading-none text-primary md:text-[28px]">
        {num}
      </div>
      <div className="mt-1.5 text-[11px] text-muted-foreground md:text-xs">{label}</div>
    </div>
  );
}
