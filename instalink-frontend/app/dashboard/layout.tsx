import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { DashboardShell } from "../../components/dashboard/dashboard-shell";

export const metadata: Metadata = {
  title: "Dashboard Customer Service | InstaLink",
  description: "Ruang kerja internal untuk mengelola registrasi calon pelanggan InstaLink.",
};

export const instant = false;

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f3f8fa] px-5 text-slate-600">
          <p role="status" className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm">
            Memuat dashboard...
          </p>
        </main>
      }
    >
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
