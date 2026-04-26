import { ReactNode } from "react";
import { TopNav } from "@/components/layout/top-nav";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main>{children}</main>
    </div>
  );
}
