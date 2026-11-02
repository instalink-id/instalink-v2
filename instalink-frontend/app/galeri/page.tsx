import { PageShell } from "../../components/page-shell";

const items = ["Pemasangan fiber ke rumah pelanggan", "Tim teknisi lokal Instalink", "Konektivitas untuk aktivitas daerah", "Perangkat jaringan dan monitoring", "Dukungan untuk bisnis lokal", "Aktivitas komunitas Instalink"];

export default function GalleryPage() {
  return <PageShell><main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8"><p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">Galeri</p><h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Cerita koneksi dari lapangan.</h1><p className="mt-5 max-w-2xl text-lg text-slate-600">Ruang untuk dokumentasi pemasangan, tim, dan aktivitas Instalink.</p><div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((item, index) => <article key={item} className="group overflow-hidden rounded-3xl bg-white shadow-sm"><div className={`flex h-56 items-end bg-gradient-to-br ${index % 2 === 0 ? "from-cyan-200 to-slate-200" : "from-slate-800 to-cyan-900"} p-6`}><span className={`text-sm font-semibold ${index % 2 === 0 ? "text-slate-700" : "text-white"}`}>Foto {String(index + 1).padStart(2, "0")}</span></div><p className="p-5 font-semibold text-slate-800">{item}</p></article>)}</div></main></PageShell>;
}
