"use client";

import { useSession } from "next-auth/react";

export function HeroSubtitle() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isBusinessAudience = role === "BUSINESS" || role === "ADMIN";

  if (isBusinessAudience) {
    return (
      <p className="mt-4 text-lg md:text-xl" style={{ color: "#B0B0B0" }}>
        사람이 없는 게 아닙니다.
        <br />
        <span style={{ color: "#D4A853" }}>찾는 곳이 달라졌을 뿐입니다</span>
      </p>
    );
  }

  return (
    <p className="mt-4 text-lg md:text-xl" style={{ color: "#B0B0B0" }}>
      가장 어울리는 곳에서 당신이 더 빛날 수 있게
    </p>
  );
}
