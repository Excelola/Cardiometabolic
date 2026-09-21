import { AppNavigation } from "./app-navigation";

export function AppSidebar() {
  return (
    <aside className="app-sidebar">
      <AppNavigation />
      <div className="app-sidebar__secondary" aria-label="Unavailable preview navigation" role="group">
        <span aria-disabled="true">Settings</span>
        <span aria-disabled="true">Sign out</span>
      </div>
    </aside>
  );
}
