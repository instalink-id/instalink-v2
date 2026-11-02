import Link from "next/link";
import { publicContact } from "../lib/public-content";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-3 lg:px-8">
        <div>
          <Link href="/" className="text-xl font-bold text-slate-950">
            Insta<span className="text-cyan-600">Link</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-500">
            PT Sinergi Infrastruktur Digital menghadirkan koneksi internet untuk rumah dan bisnis.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-slate-950">Layanan</h2>
          <div className="mt-4 grid gap-2 text-sm text-slate-600">
            <Link href="/pasang-wifi-sumedang">Paket Internet</Link>
            <Link href="/pasang-wifi-sumedang-murah">Pasang Baru</Link>
            <Link href="/corporate">Solusi Corporate</Link>
            <Link href="/portal-pelanggan">Portal Pelanggan</Link>
          </div>
        </div>
        <div>
          <h2 className="font-semibold text-slate-950">Hubungi Kami</h2>
          <div className="mt-4 grid gap-2 text-sm text-slate-600">
            <a href={`mailto:${publicContact.email}`}>{publicContact.email}</a>
            <a href={`https://wa.me/${publicContact.adminWhatsApp}`} target="_blank" rel="noreferrer">Admin: {publicContact.adminDisplay} ↗</a>
            <a href={`https://wa.me/${publicContact.technicianWhatsApp}`} target="_blank" rel="noreferrer">Teknisi: {publicContact.technicianDisplay} ↗</a>
            <span>{publicContact.operatingHours}</span>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-100 px-6 py-4 text-center text-xs text-slate-400">
        © 2026 PT Sinergi Infrastruktur Digital. Hak cipta dilindungi.
      </div>
    </footer>
  );
}
