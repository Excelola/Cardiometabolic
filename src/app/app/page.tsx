import { redirect } from "next/navigation";

import { requireSession } from "@/server/auth/request-session";

export default async function ApplicationIndexPage() {
  await requireSession();
  redirect("/app/dashboard");
}
