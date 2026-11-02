import Link from "next/link";
import { ContentSection } from "../../components/content-section";
import { DraftBadge } from "../../components/draft-badge";
import { FaqList } from "../../components/faq-list";
import { PageShell } from "../../components/page-shell";
import { homePlans } from "../../lib/catalog";
import { publicFaqs } from "../../lib/public-content";

export default function PlansPage() {
  return (
    <PageShell>
      <main>
        <section className="bg-slate-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <p className="eyebrow text-sm font-bold uppercase text-cyan-300">Pilihan paket InstaLink</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-6xl">Temukan struktur layanan yang sesuai kebutuhan rumah Anda.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Gunakan informasi kecepatan dan manfaat sebagai orientasi awal. Harga dan ketersediaan final perlu dikonfirmasi melalui katalog resmi dan alamat pemasangan.</p>
            <div className="mt-8"><DraftBadge label="Harga mengikuti katalog resmi" /></div>
          </div>
        </section>

        <ContentSection eyebrow="InstaHome" title="Bandingkan pilihan berdasarkan kebutuhan, bukan sekadar angka.">
          <div className="grid gap-5 md:grid-cols-3">
            {homePlans.map((plan) => (
              <article key={plan.id ?? plan.name} className={`rounded-3xl border p-6 ${plan.featured ? "border-cyan-500 bg-cyan-50 shadow-lg shadow-cyan-900/10" : "border-slate-200 bg-white"}`}>
                <div className="flex items-start justify-between gap-3"><p className="text-sm font-bold text-slate-500">{plan.name}</p><DraftBadge /></div>
                <p className="mt-5 text-xl font-semibold text-slate-700">Detail paket segera tersedia</p>
                <p className="mt-4 text-sm leading-6 text-slate-600">{plan.description}</p>
                <p className="mt-5 text-sm leading-6 text-slate-500">Kecepatan, manfaat, dan harga akan mengikuti katalog resmi.</p>
                <Link href="/pasang-wifi-sumedang-murah" className="mt-7 inline-block rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700">Cek ketersediaan & harga →</Link>
              </article>
            ))}
          </div>
        </ContentSection>

        <ContentSection eyebrow="Cara memilih" title="Siapkan informasi yang membantu tim memberi arahan.">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Aktivitas utama", "Ceritakan aktivitas digital yang ingin didukung, seperti belajar, bekerja, hiburan, atau kebutuhan usaha."],
              ["Lokasi pemasangan", "Alamat membantu tim memeriksa area dan kondisi jaringan secara lebih tepat."],
              ["Kebutuhan lanjutan", "Sampaikan pertanyaan tentang dukungan dan kebutuhan teknis saat konfirmasi."],
            ].map(([title, description]) => <article key={title} className="rounded-3xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold">{title}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{description}</p><div className="mt-5"><DraftBadge /></div></article>)}
          </div>
        </ContentSection>

        <ContentSection eyebrow="Ketentuan informasi" title="Data paket dapat berubah mengikuti katalog resmi." className="bg-cyan-50">
          <div className="max-w-3xl rounded-3xl border border-cyan-200 bg-white p-7">
            <p className="leading-7 text-slate-700">Halaman ini tidak menampilkan harga karena katalog backend belum tersedia. Hubungi tim untuk mendapatkan informasi paket terbaru dan konfirmasi apakah layanan dapat dipasang di alamat Anda.</p>
            <Link href="/pasang-wifi-sumedang-murah" className="mt-6 inline-block rounded-full bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-cyan-700">Cek alamat pemasangan →</Link>
          </div>
        </ContentSection>

        <ContentSection eyebrow="Pertanyaan umum" title="Masih menentukan pilihan?">
          <FaqList items={publicFaqs} />
        </ContentSection>
      </main>
    </PageShell>
  );
}
