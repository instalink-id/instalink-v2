import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header sticky top-0 z-20 border-b border-white/60 bg-[#f7fbfc]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="group flex items-center gap-2 text-xl font-bold tracking-tight text-slate-950">
          <span className="brand-mark"><span /></span>
          Insta<span className="text-cyan-600">Link</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link href="/pasang-wifi-sumedang" className="hover:text-cyan-700">Paket</Link>
          <Link href="/corporate" className="hover:text-cyan-700">Corporate</Link>
          <Link href="/galeri" className="hover:text-cyan-700">Galeri</Link>
          <Link href="/berita" className="hover:text-cyan-700">Kabar</Link>
          <Link href="/kontak" className="hover:text-cyan-700">Kontak</Link>
          <Link href="/portal-pelanggan" className="button-primary rounded-full bg-slate-950 px-4 py-2 text-white hover:bg-cyan-700">
            Portal pelanggan
          </Link>
        </nav>
        <Link href="/portal-pelanggan" className="button-primary rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white md:hidden">
          Portal
        </Link>
      </div>
    </header>
  );
}
