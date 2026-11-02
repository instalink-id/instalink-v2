"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { API_UNAUTHORIZED_EVENT, ApiError } from "../../lib/api-client";
import { getCurrentUser, logout } from "../../lib/dashboard-api";
import type { CurrentUser } from "../../lib/dashboard-types";

const DashboardUserContext = createContext<CurrentUser | null>(null);

export function useDashboardUser() {
  return useContext(DashboardUserContext);
}

const navigation = [
  { href: "/dashboard", label: "Ringkasan", mark: "01" },
  { href: "/dashboard/registrations", label: "Registrasi", mark: "02" },
];

function roleLabel(roles: string[]) {
  if (roles.includes("super_admin")) return "Super Admin";
  if (roles.includes("customer_service")) return "Customer Service";
  if (roles.includes("auditor_viewer")) return "Auditor";
  return "Staff";
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/dashboard/login";
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [logoutError, setLogoutError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleUnauthorized = () => router.replace("/dashboard/login");
    window.addEventListener(API_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => {
      window.removeEventListener(API_UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, [router]);

  const loadUser = useCallback(async () => {
    try {
      const response = await getCurrentUser();
      setUser(response.user);
      setLoadError("");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return;
      setLoadError(
        error instanceof Error
          ? error.message
          : "Identitas pengguna tidak dapat dimuat.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoginPage) return;
    let active = true;
    void getCurrentUser()
      .then((response) => {
        if (active) {
          setUser(response.user);
          setLoadError("");
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : "Identitas pengguna tidak dapat dimuat.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isLoginPage]);

  if (isLoginPage) return children;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f8fa] px-5 text-slate-600">
        <p role="status" className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm">
          Memeriksa sesi dashboard...
        </p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f8fa] px-5">
        <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-800">
            InstaLink / Dashboard
          </p>
          <h1 className="mt-4 text-xl font-semibold text-slate-950">
            Dashboard belum dapat dimuat
          </h1>
          <p role="alert" className="mt-2 text-sm leading-6 text-slate-600">
            {loadError}
          </p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setLoadError("");
              void loadUser();
            }}
            className="mt-5 min-h-11 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-cyan-800"
          >
            Coba lagi
          </button>
        </section>
      </main>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    setLogoutError("");
    try {
      await logout();
      router.replace("/dashboard/login");
    } catch (error) {
      setLogoutError(
        error instanceof Error ? error.message : "Keluar dari dashboard gagal.",
      );
    }
  };

  const nav = (
    <nav aria-label="Navigasi dashboard" className="grid gap-1">
      {navigation.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMenuOpen(false)}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium ${
              active
                ? "bg-cyan-50 text-cyan-900"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            <span className="w-6 text-[10px] font-bold tracking-wider text-cyan-700">
              {item.mark}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <DashboardUserContext.Provider value={user}>
      <div className="min-h-screen bg-[#f3f8fa] text-slate-950">
        <div className="min-h-screen md:grid md:grid-cols-[232px_minmax(0,1fr)]">
          <aside className="hidden border-r border-slate-200 bg-white px-4 py-6 md:flex md:flex-col">
            <Link href="/dashboard" className="flex items-center gap-2 px-2 text-lg font-bold tracking-tight">
              <span className="brand-mark" aria-hidden="true"><span /></span>
              <span>Insta<span className="text-cyan-700">Link</span></span>
            </Link>
            <p className="mb-3 mt-10 px-3 text-[10px] font-bold uppercase tracking-[0.17em] text-slate-400">
              Ruang kerja
            </p>
            {nav}
            <div className="mt-auto border-t border-slate-100 pt-4">
              <p className="truncate px-3 text-xs font-semibold text-slate-800">{user.email}</p>
              <p className="mt-1 px-3 text-xs text-slate-500">{roleLabel(user.roles)}</p>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="mt-4 min-h-11 w-full rounded-xl px-3 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              >
                Keluar
              </button>
            </div>
          </aside>

          <div className="min-w-0">
            <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
              <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3">
                  <Link href="/dashboard" className="flex items-center gap-2 text-base font-bold md:hidden">
                    <span className="brand-mark" aria-hidden="true"><span /></span>
                    <span>Insta<span className="text-cyan-700">Link</span></span>
                  </Link>
                  <p className="hidden text-sm font-medium text-slate-500 md:block">
                    Layanan pelanggan / <span className="text-slate-900">{navigation.find((item) => item.href === pathname)?.label ?? "Registrasi"}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="hidden max-w-52 truncate text-xs text-slate-600 sm:block">{user.email}</span>
                  <button
                    type="button"
                    aria-expanded={menuOpen}
                    aria-controls="dashboard-mobile-navigation"
                    aria-label={menuOpen ? "Tutup navigasi" : "Buka navigasi"}
                    onClick={() => setMenuOpen((open) => !open)}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 md:hidden"
                  >
                    {menuOpen ? "Tutup" : "Menu"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="hidden min-h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-950 md:block"
                  >
                    Keluar
                  </button>
                </div>
              </div>
              {menuOpen ? (
                <div id="dashboard-mobile-navigation" className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
                  {nav}
                  <p className="mt-3 truncate border-t border-slate-100 pt-3 text-xs text-slate-500">
                    {roleLabel(user.roles)} · {user.email}
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="mt-2 min-h-11 w-full rounded-xl px-3 text-left text-sm font-semibold text-slate-700"
                  >
                    Keluar dari dashboard
                  </button>
                </div>
              ) : null}
            </header>
            {logoutError ? (
              <p role="alert" className="mx-auto mt-4 max-w-7xl px-4 text-sm text-rose-700 sm:px-6 lg:px-8">
                {logoutError}
              </p>
            ) : null}
            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
              {children}
            </main>
          </div>
        </div>
      </div>
    </DashboardUserContext.Provider>
  );
}
