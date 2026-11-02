import Link from "next/link";
import { ContentSection } from "../../components/content-section";
import { DraftBadge } from "../../components/draft-badge";
import { PageShell } from "../../components/page-shell";

export default function CorporatePage() {
  return (
    <PageShell>
      <main>
        <section className="bg-slate-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <p className="eyebrow text-sm font-bold uppercase text-cyan-300">Profil PT Sinergi Infrastruktur Digital</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-6xl">Mengenal perusahaan di balik InstaLink.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Halaman ini akan menjelaskan profil, visi, misi, nilai, layanan, dan komitmen perusahaan berdasarkan company profile resmi.</p>
            <div className="mt-8"><DraftBadge label="Menunggu company profile" /></div>
          </div>
        </section>

        <ContentSection eyebrow="Tentang perusahaan" title="Profil PT akan menjadi dasar informasi publik yang akurat." description="Materi lengkap perusahaan belum tersedia di repository. Struktur ini disiapkan agar company profile dapat diterjemahkan menjadi konten yang mudah dibaca tanpa mengarang klaim." className="bg-white">
          <div className="grid gap-4 md:grid-cols-3">
            {["Profil dan perjalanan perusahaan", "Visi, misi, dan nilai", "Komitmen kepada pelanggan"].map((title) => <article key={title} className="rounded-3xl border border-dashed border-slate-300 bg-[#f7fbfc] p-6"><DraftBadge /><h2 className="mt-5 text-xl font-semibold">{title}</h2><p className="mt-3 text-sm leading-6 text-slate-600">Konten akan diisi setelah materi company profile disetujui.</p></article>)}
          </div>
        </ContentSection>

        <ContentSection eyebrow="Ruang lingkup layanan" title="Jelaskan kemampuan InstaLink dengan konteks yang tepat.">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              ["Konektivitas", "Penjelasan layanan konektivitas untuk kebutuhan rumah, bisnis, dan institusi."],
              ["Dukungan teknis", "Informasi tentang cara pelanggan mendapatkan bantuan dan tindak lanjut."],
              ["Kolaborasi daerah", "Peran perusahaan dalam mendukung kebutuhan konektivitas di area layanan."],
            ].map(([title, description]) => <article key={title} className="rounded-3xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold">{title}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{description}</p><div className="mt-5"><DraftBadge /></div></article>)}
          </div>
        </ContentSection>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <div className="rounded-[2rem] bg-cyan-50 p-7 sm:p-10">
            <p className="eyebrow text-sm font-bold uppercase text-cyan-700">Konsultasi</p>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold">Punya kebutuhan konektivitas untuk organisasi?</h2>
            <p className="mt-4 max-w-2xl leading-7 text-slate-600">Sampaikan lokasi, kebutuhan pengguna, dan konteks layanan melalui kanal kontak yang tersedia. Tim akan membantu mengarahkan percakapan.</p>
            <Link href="/kontak" className="mt-7 inline-flex rounded-full bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-cyan-700">Hubungi InstaLink →</Link>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
