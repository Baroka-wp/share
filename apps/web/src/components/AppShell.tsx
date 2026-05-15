import type { ReactNode } from "react";
import AppHeader from "./AppHeader";

type Props = {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  footer?: ReactNode;
};

export default function AppShell({
  children,
  showHeader = true,
  showFooter = false,
  footer,
}: Props) {
  return (
    <div className="shell">
      {showHeader && <AppHeader variant="app" />}
      <main className="shell-main">{children}</main>
      {showFooter && (footer ?? null)}
    </div>
  );
}
