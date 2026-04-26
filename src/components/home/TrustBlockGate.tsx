"use client";

import { useSession } from "next-auth/react";

export function TrustBlockGate({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  if (session?.user?.role === "JOBSEEKER") {
    return null;
  }

  return <>{children}</>;
}
