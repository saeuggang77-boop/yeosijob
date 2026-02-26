import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { MessageList } from "@/components/message/MessageList";

export const metadata = {
  title: "쪽지함",
};

export default async function MessagesPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">쪽지함</h1>
      <MessageList />
    </div>
  );
}
