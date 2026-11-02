import { PageShell } from "../../components/page-shell";

const news = [{ title: "Instalink memperluas akses internet fiber untuk masyarakat", date: "02 November 2026", text: "Kabar terbaru tentang pengembangan jaringan dan layanan Instalink." }, { title: "Tips menjaga koneksi internet tetap stabil di rumah", date: "25 Oktober 2026", text: "Panduan sederhana untuk membantu aktivitas digital keluarga." }, { title: "Dukungan konektivitas untuk usaha lokal", date: "12 Oktober 2026", text: "Bagaimana layanan bisnis Instalink membantu operasional dan kolaborasi." }];

export default function NewsPage() {
  return <PageShell><main className="mx-auto max-w-7xl px-6 py-20 lg:px-8"><p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">Kabar Instalink</p><h1 className="mt-4 text-5xl font-semibold tracking-tight">Cerita, panduan, dan kabar terbaru.</h1><div className="mt-12 grid gap-6 md:grid-cols-3">{news.map((item) => <article key={item.title} className="rounded-3xl border border-slate-200 bg-white p-7"><p className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-700">{item.date}</p><h2 className="mt-4 text-2xl font-semibold leading-tight">{item.title}</h2><p className="mt-4 text-sm leading-6 text-slate-600">{item.text}</p><button className="mt-6 font-semibold text-cyan-700">Baca selengkapnya →</button></article>)}</div></main></PageShell>;
}

