import type { Viewport } from "next";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app/app-shell";

export const viewport: Viewport = { viewportFit: "cover" };

export default function AuthenticatedLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <AppShell>{children}</AppShell>;
}
