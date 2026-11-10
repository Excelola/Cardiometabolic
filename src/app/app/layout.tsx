import type { Viewport } from "next";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app/app-shell";
import { getAuthConfig } from "@/server/auth/config";
import { issueSessionCsrf } from "@/server/auth/mutation-security";
import { requireSession } from "@/server/auth/request-session";

export const viewport: Viewport = { viewportFit: "cover" };

export default async function AuthenticatedLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { sessionId } = await requireSession();
  const csrf = issueSessionCsrf(sessionId, getAuthConfig().csrfSecret);
  return <AppShell csrf={csrf}>{children}</AppShell>;
}
