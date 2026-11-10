import type { ReactNode } from "react";

import { AppFooter } from "./app-footer";
import { AppHeader } from "./app-header";
import { AppMobileNavigation } from "./app-navigation";
import { AppSidebar } from "./app-sidebar";

type AppShellProps = Readonly<{ children: ReactNode }>;

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-frame">
      <AppHeader />
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
