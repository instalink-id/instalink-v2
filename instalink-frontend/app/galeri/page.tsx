import { ContentSection } from "../../components/content-section";
import { DraftBadge } from "../../components/draft-badge";
import { PageShell } from "../../components/page-shell";

const items = ["Pemasangan fiber ke rumah pelanggan", "Tim teknisi lokal InstaLink", "Konektivitas untuk aktivitas daerah", "Perangkat jaringan dan monitoring", "Dukungan untuk bisnis lokal", "Aktivitas komunitas InstaLink"];

export default function GalleryPage() {
  return <PageShell><main><section className="bg-slate-950 text-white"><div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8"><p className="eyebrow text-sm font-bold uppercase text-cyan-300">Galeri InstaLink</p><h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-6xl">Dokumentasi yang akan bercerita dari lapangan.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Galeri ini disiapkan untuk foto pemasangan, tim, jaringan, dan aktivitas InstaLink setelah aset disetujui.</p></div></section><ContentSection eyebrow="Menunggu aset" title="Ruang untuk dokumentasi nyata, bukan ilustrasi pengganti."><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((item, index) => <article key={item} className="rounded-3xl border border-dashed border-slate-300 bg-white p-6"><div className="flex h-44 items-center justify-center rounded-2xl bg-slate-100 text-center text-sm font-semibold text-slate-500">Foto {String(index + 1).padStart(2, "0")}<br />menunggu aset</div><h2 className="mt-5 text-lg font-semibold">{item}</h2><div className="mt-4"><DraftBadge label="Aset belum tersedia" /></div></article>)}</div></ContentSection></main></PageShell>;
}
