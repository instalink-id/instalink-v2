import type { ReactNode } from "react";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell min-h-screen bg-[#f7fbfc] text-slate-950">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
