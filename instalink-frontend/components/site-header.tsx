"use client";

import Link from "next/link";
import { useState } from "react";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header sticky top-0 z-20 border-b border-white/60 bg-[#f7fbfc]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <Link href="/" onClick={closeMenu} className="group flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight text-slate-950 sm:text-xl">
          <span className="brand-mark"><span /></span>
          Insta<span className="text-cyan-600">Link</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link href="/pasang-wifi-sumedang" className="hover:text-cyan-700">Paket</Link>
          <Link href="/corporate" className="hover:text-cyan-700">Corporate</Link>
          <Link href="/galeri" className="hover:text-cyan-700">Galeri</Link>
          <Link href="/berita" className="hover:text-cyan-700">Kabar</Link>
          <Link href="/kontak" className="hover:text-cyan-700">Kontak</Link>
          <Link href="/portal-pelanggan" className="button-primary rounded-full bg-slate-950 px-4 py-2 text-white hover:bg-cyan-700">Portal pelanggan</Link>
        </nav>
        <button type="button" className="button-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-950 md:hidden" aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={menuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"} onClick={() => setMenuOpen((open) => !open)}>
          <span className="sr-only">{menuOpen ? "Tutup menu" : "Buka menu navigasi"}</span>
          <span className="grid gap-1" aria-hidden="true">
            <span className={`block h-0.5 w-5 rounded-full bg-current transition-transform ${menuOpen ? "translate-y-1.5 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-5 rounded-full bg-current transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 rounded-full bg-current transition-transform ${menuOpen ? "-translate-y-1.5 -rotate-45" : ""}`} />
          </span>
        </button>
      </div>
      {menuOpen ? <nav id="mobile-navigation" className="mobile-navigation-enter border-t border-slate-200 bg-[#f7fbfc] px-4 py-3 md:hidden"><div className="mx-auto grid max-w-7xl gap-1 text-sm font-medium text-slate-700">
        <Link href="/pasang-wifi-sumedang" onClick={closeMenu} className="rounded-xl px-4 py-3 hover:bg-cyan-50 hover:text-cyan-700">Paket</Link>
        <Link href="/corporate" onClick={closeMenu} className="rounded-xl px-4 py-3 hover:bg-cyan-50 hover:text-cyan-700">Corporate</Link>
        <Link href="/galeri" onClick={closeMenu} className="rounded-xl px-4 py-3 hover:bg-cyan-50 hover:text-cyan-700">Galeri</Link>
        <Link href="/berita" onClick={closeMenu} className="rounded-xl px-4 py-3 hover:bg-cyan-50 hover:text-cyan-700">Kabar</Link>
        <Link href="/kontak" onClick={closeMenu} className="rounded-xl px-4 py-3 hover:bg-cyan-50 hover:text-cyan-700">Kontak</Link>
        <Link href="/portal-pelanggan" onClick={closeMenu} className="mt-2 rounded-xl bg-slate-950 px-4 py-3 text-center text-white hover:bg-cyan-700">Portal pelanggan</Link>
      </div></nav> : null}
    </header>
  );
}
