import { ContentSection } from "../../components/content-section";
import { FaqList } from "../../components/faq-list";
import { PageShell } from "../../components/page-shell";
import { ProcessSteps } from "../../components/process-steps";
import { CoverageMapLoader } from "../../components/coverage-map-loader";
import { InstallationForm } from "../../components/installation-form";
import { installationSteps, publicFaqs, serviceAreas } from "../../lib/public-content";

export default function InstallationPage() {
  return (
    <PageShell>
      <main>
        <section className="bg-slate-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <p className="eyebrow text-sm font-bold uppercase text-cyan-300">Pasang baru</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-6xl">Mulai dari alamat, lanjutkan dengan konfirmasi yang jelas.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Pemeriksaan peta bersifat indikatif. Setelah data Anda lengkap, tim akan membantu mengonfirmasi ketersediaan dan langkah pemasangan.</p>
          </div>
        </section>

        <ContentSection eyebrow="Langkah pemasangan" title="Ikuti alur dari pemeriksaan sampai konsultasi." description="Informasi berikut membantu Anda menyiapkan data yang diperlukan. Detail proses akhir masih perlu dikonfirmasi oleh tim InstaLink.">
          <ProcessSteps steps={installationSteps} />
        </ContentSection>

        <section className="border-y border-slate-200 bg-white">
          <ContentSection eyebrow="01 — Cek jangkauan indikatif" title="Periksa lokasi jaringan di sekitar alamat Anda." description={`Wilayah yang dapat diperiksa meliputi ${serviceAreas.join(", ")}. Hasil peta bukan keputusan akhir dan harus dikonfirmasi melalui WhatsApp atau tim InstaLink.`}>
            <div className="rounded-3xl border border-slate-200 bg-[#f7fbfc] p-4 sm:p-7"><CoverageMapLoader /></div>
          </ContentSection>
        </section>

        <ContentSection eyebrow="02 — Ajukan pemasangan" title="Siapkan data agar tim dapat menindaklanjuti." description="Form ini memvalidasi data di browser. Setelah valid, Anda akan diarahkan untuk melanjutkan percakapan melalui WhatsApp; data belum disimpan ke backend.">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
            <div className="rounded-3xl bg-cyan-50 p-7">
              <h2 className="text-2xl font-semibold">Sebelum mengirim</h2>
              <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-700">
                <li>✓ Pastikan alamat pemasangan ditulis lengkap.</li>
                <li>✓ Gunakan nomor WhatsApp yang bisa dihubungi.</li>
                <li>✓ Siapkan pertanyaan tentang paket dan coverage.</li>
                <li>✓ Tunggu konfirmasi akhir dari tim, bukan hanya hasil peta.</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><InstallationForm /></div>
          </div>
        </ContentSection>

        <ContentSection eyebrow="Pertanyaan umum" title="Apa yang perlu diketahui sebelum pemasangan?">
          <FaqList items={publicFaqs} />
        </ContentSection>
      </main>
    </PageShell>
  );
}
