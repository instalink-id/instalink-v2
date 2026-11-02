import Link from "next/link";
import { PageShell } from "../components/page-shell";
import { Reveal } from "../components/reveal";

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
            <p className="eyebrow text-sm font-bold uppercase text-cyan-200">Koneksi rumah kecepatan simetris</p>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.06em] text-white sm:text-5xl sm:leading-[1.02] lg:text-7xl">
              Internet CEPAT,
              <span className="block text-cyan-300">ruang untuk bertumbuh.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-200">
              Koneksi fiber optik untuk rumah, bisnis, dan institusi dengan dukungan tim lokal yang siap membantu.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/pasang-wifi-sumedang-murah" className="rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-200">Pasang sekarang →</Link>
              <Link href="/pasang-wifi-sumedang" className="rounded-full border border-white/50 px-6 py-3 font-semibold text-white hover:border-cyan-300 hover:text-cyan-200">Lihat paket internet</Link>
            </div>
          </Reveal>
        </section>

        <Reveal><section className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:px-8">
            <div><p className="eyebrow text-sm font-bold uppercase text-cyan-700">Cek jangkauan</p><h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.04em]">Dekat dengan jaringan yang Anda butuhkan.</h2><p className="mt-5 max-w-md text-slate-600">Pilih lokasi pemasangan dan kami akan membantu mengonfirmasi ketersediaan jaringan.</p></div>
            <div className="soft-panel-reverse bg-cyan-50 p-7">
              <div className="map-ornament relative h-48 overflow-hidden rounded-[2rem] bg-[#dff8f7] text-cyan-950" aria-label="Ornamen peta jaringan Instalink" role="img">
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 640 260" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M-20 58C94 14 153 94 250 64C355 31 405 12 505 50C568 74 606 54 660 28" stroke="#B5E5E3" strokeWidth="28" strokeLinecap="round" />
                  <path d="M-18 205C91 165 135 216 242 174C348 133 415 184 487 145C550 111 604 151 663 119" stroke="#B5E5E3" strokeWidth="20" strokeLinecap="round" />
                  <path d="M104 -18C130 48 109 88 159 137C205 181 188 214 218 278M446 -18C411 42 458 90 423 128C385 169 426 222 401 278" stroke="#C1EAE8" strokeWidth="13" strokeLinecap="round" />
                  <path d="M-16 146C87 112 148 157 239 122C325 89 366 134 438 94C512 53 578 99 656 70" stroke="#0891B2" strokeWidth="5" strokeLinecap="round" strokeDasharray="1 18" />
                  <path d="M-16 146C87 112 148 157 239 122C325 89 366 134 438 94C512 53 578 99 656 70" stroke="#67E8F9" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="356" cy="112" r="31" fill="#ECFEFF" stroke="#0891B2" strokeWidth="3" />
                  <circle cx="356" cy="112" r="43" stroke="#0891B2" strokeOpacity=".2" strokeWidth="2" />
                  <path d="M356 96C348.268 96 342 102.268 342 110C342 121 356 132 356 132C356 132 370 121 370 110C370 102.268 363.732 96 356 96Z" fill="#0E7490" />
                  <circle cx="356" cy="110" r="4" fill="white" />
                </svg>
                <div className="absolute bottom-5 left-5 rounded-xl bg-white/80 px-3 py-2 text-xs font-semibold shadow-sm backdrop-blur-sm">
                  Temukan jaringan<br />di sekitar Anda
                </div>
                <span className="absolute right-5 top-5 rounded-full bg-white/75 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-700">Coverage</span>
              </div>
              <Link href="/pasang-wifi-sumedang-murah" className="mt-5 inline-block font-semibold text-cyan-700">Periksa lokasi pemasangan <span aria-hidden>↗</span></Link>
            </div>
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
