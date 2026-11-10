import type { ReactNode } from "react";

import { SessionActivity } from "@/components/auth/session-activity";

import { AppFooter } from "./app-footer";
import { AppHeader } from "./app-header";
import { AppMobileNavigation } from "./app-navigation";
import { AppSidebar } from "./app-sidebar";

type AppShellProps = Readonly<{ children: ReactNode; csrf: string }>;

export function AppShell({ children, csrf }: AppShellProps) {
  return (
    <div className="app-frame">
      <SessionActivity csrf={csrf} />
      <AppHeader csrf={csrf} />
      <AppMobileNavigation />
      <div className="app-frame__body">
        <AppSidebar />
        <div className="app-frame__content">
          <main className="app-main" id="main-content">
            {children}
          </main>
          <AppFooter />
        </div>
      </div>
    </div>
  );
}
