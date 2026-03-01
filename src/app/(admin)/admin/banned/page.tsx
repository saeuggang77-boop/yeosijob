import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BannedUsersClient } from "./BannedUsersClient";

export default async function AdminBannedPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return <BannedUsersClient />;
}
