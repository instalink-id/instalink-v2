import { ContentSection } from "../../components/content-section";
import { DraftBadge } from "../../components/draft-badge";
import { PageShell } from "../../components/page-shell";

const topics = ["Panduan memilih koneksi", "Kabar pengembangan layanan", "Cerita dukungan untuk daerah"];

export default function NewsPage() {
  return <PageShell><main><section className="bg-slate-950 text-white"><div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8"><p className="eyebrow text-sm font-bold uppercase text-cyan-300">Kabar InstaLink</p><h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-6xl">Informasi, panduan, dan cerita konektivitas.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Ruang editorial ini akan memuat artikel yang disetujui pemilik konten dan dapat membantu pelanggan mengambil keputusan.</p></div></section><ContentSection eyebrow="Editorial" title="Topik yang akan dikembangkan." description="Artikel publik belum memiliki sumber resmi di repository. Struktur berikut menunggu naskah dan approval Gingin."><div className="grid gap-5 md:grid-cols-3">{topics.map((title) => <article key={title} className="rounded-3xl border border-slate-200 bg-white p-6"><p className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-700">Draft editorial</p><h2 className="mt-4 text-2xl font-semibold leading-tight">{title}</h2><p className="mt-4 text-sm leading-6 text-slate-600">Naskah, tanggal publikasi, dan sumber akan ditambahkan setelah disetujui.</p><div className="mt-5"><DraftBadge /></div></article>)}</div></ContentSection></main></PageShell>;
}
