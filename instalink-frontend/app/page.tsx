import Link from "next/link";
import { ContentSection } from "../components/content-section";
import { DraftBadge } from "../components/draft-badge";
import { FaqList } from "../components/faq-list";
import { PageShell } from "../components/page-shell";
import { ProcessSteps } from "../components/process-steps";
import { Reveal } from "../components/reveal";
import { homePlans } from "../lib/catalog";
import { installationSteps, publicFaqs, serviceAreas } from "../lib/public-content";

export default function Home() {
  return (
    <PageShell>
      <main>
        <section className="hero-video relative isolate flex min-h-[calc(100svh-73px)] items-center overflow-hidden bg-slate-950 px-4 py-16 sm:px-6 lg:px-8">
          <video className="hero-video__media" autoPlay muted loop playsInline aria-hidden="true">
            <source src="/hero-background.mp4" type="video/mp4" />
          </video>
          <div className="hero-video__overlay" aria-hidden="true" />
          <Reveal className="relative z-10 mx-auto w-full max-w-7xl">
            <p className="eyebrow text-sm font-bold uppercase text-cyan-200">Koneksi rumah untuk aktivitas digital</p>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.06em] text-white sm:text-5xl sm:leading-[1.02] lg:text-7xl">
              Internet yang siap
              <span className="block text-cyan-300">menemani ruang bertumbuh.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-200">
              Jelajahi layanan fiber optik InstaLink untuk rumah, bisnis, dan institusi dengan dukungan tim lokal.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/pasang-wifi-sumedang-murah" className="rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-200">Cek coverage & pasang →</Link>
              <Link href="/pasang-wifi-sumedang" className="rounded-full border border-white/50 px-6 py-3 font-semibold text-white hover:border-cyan-300 hover:text-cyan-200">Jelajahi paket</Link>
            </div>
          </Reveal>
        </section>

        <ContentSection
          eyebrow="Tentang InstaLink"
          title="Koneksi yang dijelaskan dengan jelas, dari alamat sampai layanan."
          description="Kami membantu calon pelanggan memahami pilihan layanan, mengecek ketersediaan berdasarkan alamat, dan mengetahui langkah berikutnya sebelum pemasangan."
          className="bg-white"
        >
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["01", "Fiber optik", "Infrastruktur fiber optik menjadi dasar layanan yang perlu disesuaikan dengan kondisi jaringan di lokasi."],
              ["02", "Tim lokal", "Pertanyaan tentang area, pemasangan, dan layanan dapat diteruskan ke tim InstaLink melalui kanal yang tersedia."],
              ["03", "Alur transparan", "Mulai dari pengecekan alamat, konfirmasi, hingga pengajuan pemasangan dijelaskan tanpa menjanjikan hasil sebelum verifikasi."],
            ].map(([number, title, description]) => (
              <article key={number} className="rounded-3xl border border-slate-200 bg-[#f7fbfc] p-6">
                <span className="text-sm font-bold text-cyan-700">{number}</span>
                <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
                <div className="mt-5"><DraftBadge /></div>
              </article>
            ))}
          </div>
        </ContentSection>

        <ContentSection
          eyebrow="Pilihan untuk rumah"
          title="Kenali pilihan koneksi sebelum meminta konfirmasi harga."
          description="Kartu berikut membantu Anda membandingkan struktur pilihan layanan. Harga dan status akhir mengikuti katalog resmi yang akan dikelola dari backend."
        >
          <div className="grid gap-5 md:grid-cols-3">
            {homePlans.map((plan) => (
              <article key={plan.id ?? plan.name} className={`rounded-3xl border p-6 ${plan.featured ? "border-cyan-500 bg-cyan-50 shadow-lg shadow-cyan-900/10" : "border-slate-200 bg-white"}`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-bold text-slate-500">{plan.name}</p>
                  <DraftBadge />
                </div>
                <p className="mt-5 text-4xl font-semibold">{plan.speed}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{plan.description}</p>
                <ul className="mt-5 grid gap-2 text-sm text-slate-600">
                  {plan.benefits?.map((benefit) => <li key={benefit}>✓ {benefit}</li>)}
                </ul>
                <Link href="/pasang-wifi-sumedang-murah" className="mt-7 inline-block rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700">Cek ketersediaan & harga →</Link>
              </article>
            ))}
          </div>
        </ContentSection>

        <section className="border-y border-slate-200 bg-cyan-50">
          <ContentSection
            eyebrow="Area layanan"
            title="Mulai dari wilayah Anda, lalu konfirmasi alamat pemasangan."
            description="InstaLink melayani area yang mencakup wilayah berikut. Jangkauan aktual dapat berbeda di setiap alamat dan perlu diperiksa melalui peta atau tim kami."
          >
            <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-center">
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {serviceAreas.map((area) => <div key={area} className="rounded-2xl border border-cyan-200 bg-white px-5 py-4 font-semibold text-slate-900">{area}<span className="mt-1 block text-xs font-normal text-slate-500">Kabupaten Sumedang</span></div>)}
              </div>
              <div className="map-ornament relative min-h-64 overflow-hidden rounded-[2rem] bg-[#dff8f7] p-7 text-cyan-950">
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 640 260" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M-20 58C94 14 153 94 250 64C355 31 405 12 505 50C568 74 606 54 660 28M-18 205C91 165 135 216 242 174C348 133 415 184 487 145C550 111 604 151 663 119" stroke="#B5E5E3" strokeWidth="28" strokeLinecap="round" />
                  <path d="M-16 146C87 112 148 157 239 122C325 89 366 134 438 94C512 53 578 99 656 70" stroke="#0891B2" strokeWidth="5" strokeLinecap="round" strokeDasharray="1 18" />
                  <circle cx="356" cy="112" r="31" fill="#ECFEFF" stroke="#0891B2" strokeWidth="3" />
                  <path d="M356 96C348.268 96 342 102.268 342 110C342 121 356 132 356 132C356 132 370 121 370 110C370 102.268 363.732 96 356 96Z" fill="#0E7490" />
                </svg>
                <div className="relative max-w-xs rounded-2xl bg-white/85 p-5 shadow-sm backdrop-blur-sm">
                  <p className="text-sm font-bold uppercase tracking-[0.14em] text-cyan-700">Pemeriksaan indikatif</p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">Hasil peta bukan keputusan akhir. Tim InstaLink tetap perlu mengonfirmasi alamat dan kondisi jaringan.</p>
                  <Link href="/pasang-wifi-sumedang-murah" className="mt-5 inline-block font-semibold text-cyan-700">Periksa lokasi pemasangan ↗</Link>
                </div>
              </div>
            </div>
          </ContentSection>
        </section>

        <ContentSection
          eyebrow="Cara berlangganan"
          title="Setiap langkah punya tujuan yang jelas."
          description="Ikuti alur awal berikut untuk mengetahui apa yang perlu disiapkan sebelum layanan dipasang."
        >
          <ProcessSteps steps={installationSteps} />
        </ContentSection>

        <ContentSection eyebrow="Pertanyaan umum" title="Hal penting sebelum Anda mengajukan pemasangan." className="bg-white">
          <FaqList items={publicFaqs} />
        </ContentSection>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <div className="rounded-[2rem] bg-slate-950 px-6 py-10 text-white sm:px-10 sm:py-14">
            <p className="eyebrow text-sm font-bold uppercase text-cyan-300">Langkah berikutnya</p>
            <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Mulai dari alamat Anda.</h2>
                <p className="mt-4 max-w-xl leading-7 text-slate-300">Cek coverage secara indikatif, lengkapi data pemasangan, lalu lanjutkan konfirmasi bersama tim melalui WhatsApp.</p>
              </div>
              <Link href="/pasang-wifi-sumedang-murah" className="inline-flex w-fit rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-200">Cek coverage sekarang →</Link>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
