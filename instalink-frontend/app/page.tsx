import Link from "next/link";
import { PageShell } from "../components/page-shell";
import { Reveal } from "../components/reveal";

export default function Home() {
  return (
    <PageShell>
      <main>
        <section className="mx-auto grid max-w-7xl gap-12 px-6 pb-24 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pt-24">
          <Reveal className="flex flex-col justify-center">
            <p className="eyebrow text-sm font-bold uppercase text-cyan-700">Koneksi rumah kecepatan simetris</p>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.06em] text-slate-950 sm:text-7xl">
              Internet cepat,
              <span className="block text-cyan-600">ruang untuk bertumbuh.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Koneksi fiber optik untuk rumah, bisnis, dan institusi dengan dukungan tim lokal yang siap membantu.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/pasang-wifi-sumedang-murah" className="rounded-full bg-slate-950 px-6 py-3 font-semibold text-white hover:bg-cyan-700">Pasang sekarang →</Link>
              <Link href="/pasang-wifi-sumedang" className="rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:border-cyan-600 hover:text-cyan-700">Lihat paket internet</Link>
            </div>
          </Reveal>
          <Reveal delay="delay-2" className="soft-panel relative min-h-[390px] overflow-hidden bg-slate-950 p-8 text-white shadow-xl shadow-cyan-900/10 sm:p-10">
            <div className="network-pulse organic-blob absolute -right-20 -top-20 h-72 w-72 bg-cyan-400/20 blur-3xl" />
            <div className="network-orbit absolute -bottom-28 -left-20 h-64 w-64 rounded-full border border-cyan-300/20" />
            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-center justify-between text-sm text-cyan-200"><span>INSTALINK</span><span>FTTH</span></div>
              <div>
                <p className="text-sm text-slate-400">Koneksi yang mendukung</p>
                <p className="mt-3 max-w-sm text-3xl font-semibold leading-tight">Aktivitas penting Anda, tanpa kompromi.</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div className="rounded-2xl bg-white/10 p-4"><strong className="block text-xl text-cyan-300">∞</strong><span className="text-slate-300">Tanpa FUP</span></div>
                <div className="rounded-2xl bg-white/10 p-4"><strong className="block text-xl text-cyan-300">1:1</strong><span className="text-slate-300">Simetris</span></div>
                <div className="rounded-2xl bg-white/10 p-4"><strong className="block text-xl text-cyan-300">24/7</strong><span className="text-slate-300">Dukungan</span></div>
              </div>
            </div>
          </Reveal>
        </section>

        <Reveal><section className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:px-8">
            <div><p className="eyebrow text-sm font-bold uppercase text-cyan-700">Cek jangkauan</p><h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.04em]">Dekat dengan jaringan yang Anda butuhkan.</h2><p className="mt-5 max-w-md text-slate-600">Pilih lokasi pemasangan dan kami akan membantu mengonfirmasi ketersediaan jaringan.</p></div>
            <div className="soft-panel-reverse bg-cyan-50 p-7"><div className="organic-blob relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-cyan-200 via-cyan-50 to-amber-100 text-center text-sm text-cyan-900"><div className="absolute h-32 w-32 rounded-full border border-cyan-700/20" /><div className="absolute h-56 w-56 rounded-full border border-cyan-700/10" /><span className="relative font-semibold">Temukan jaringan<br />di sekitar Anda</span></div><Link href="/pasang-wifi-sumedang-murah" className="mt-5 inline-block font-semibold text-cyan-700">Periksa lokasi pemasangan <span aria-hidden>↗</span></Link></div>
          </div>
        </section></Reveal>

        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <Reveal><p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">Pilihan layanan</p>
          <h2 className="mt-3 text-3xl font-semibold">Satu jaringan, kebutuhan yang berbeda.</h2></Reveal>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <Reveal><Link href="/pasang-wifi-sumedang" className="card-lift block rounded-3xl bg-cyan-100 p-8"><p className="text-sm font-bold text-cyan-800">UNTUK RUMAH</p><h3 className="mt-3 text-3xl font-semibold">InstaHome</h3><p className="mt-4 max-w-md text-slate-600">Paket internet rumah dengan pilihan kecepatan dan harga bulanan yang jelas.</p><span className="mt-8 inline-block font-semibold text-cyan-800">Lihat paket InstaHome →</span></Link></Reveal>
            <Reveal delay="delay-1"><Link href="/corporate" className="card-lift block rounded-3xl bg-slate-950 p-8 text-white"><p className="text-sm font-bold text-cyan-300">UNTUK BISNIS & INSTITUSI</p><h3 className="mt-3 text-3xl font-semibold">InstaBiz</h3><p className="mt-4 max-w-md text-slate-300">Solusi koneksi dan managed services yang menyesuaikan kebutuhan operasional.</p><span className="mt-8 inline-block font-semibold text-cyan-300">Jelajahi solusi bisnis →</span></Link></Reveal>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
