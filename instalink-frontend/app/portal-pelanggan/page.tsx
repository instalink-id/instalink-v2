"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ContentSection } from "../../components/content-section";
import { PageShell } from "../../components/page-shell";

export default function CustomerPortalPage() {
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSubmitted(true); };
  return (
    <PageShell>
      <main>
        <section className="bg-slate-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <p className="eyebrow text-sm font-bold uppercase text-cyan-300">Portal pelanggan</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-6xl">Satu tempat untuk memahami layanan Anda.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Portal pelanggan akan menjadi ruang untuk layanan, tagihan, pembayaran, notifikasi, dan bantuan setelah identity backend tersedia.</p>
          </div>
        </section>
        <ContentSection eyebrow="Yang akan tersedia" title="Portal dirancang untuk kebutuhan pelanggan sehari-hari." description="Fitur berikut adalah rancangan permukaan portal, bukan layanan yang sudah aktif di environment lokal.">
          <div className="grid gap-4 md:grid-cols-3">
            {["Ringkasan layanan", "Tagihan dan pembayaran", "Bantuan dan notifikasi"].map((title) => <article key={title} className="rounded-3xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold">{title}</h2><p className="mt-3 text-sm leading-6 text-slate-600">Akan terhubung ke backend setelah modul identity dan domain pelanggan tersedia.</p></article>)}
          </div>
        </ContentSection>
        <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 sm:px-6 sm:pb-20 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
          <div><p className="eyebrow text-sm font-bold uppercase text-cyan-700">Akses akun</p><h2 className="mt-4 text-3xl font-semibold">Login belum diaktifkan di lokal.</h2><p className="mt-4 leading-7 text-slate-600">Jangan masukkan kredensial produksi di halaman ini. Untuk bantuan, gunakan kontak resmi InstaLink.</p><Link href="/kontak" className="mt-6 inline-flex rounded-full bg-cyan-700 px-5 py-3 font-semibold text-white hover:bg-cyan-800">Minta bantuan →</Link></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-semibold">Simulasi tampilan login</h2>
            <p className="mt-3 text-sm text-slate-500">Form ini hanya menguji tampilan lokal dan tidak melakukan autentikasi.</p>
            {submitted ? <div className="mt-6 rounded-2xl bg-amber-50 p-5 text-amber-800">Login belum tersedia. Silakan gunakan kanal bantuan untuk pelanggan.</div> : <form onSubmit={handleSubmit} className="mt-6 grid gap-4"><label className="grid gap-2 text-sm font-medium">ID Pelanggan<input required disabled placeholder="Belum tersedia di lokal" className="rounded-xl border border-slate-300 px-4 py-3 font-normal disabled:bg-slate-100" /></label><label className="grid gap-2 text-sm font-medium">Password<input required disabled type="password" placeholder="Belum tersedia di lokal" className="rounded-xl border border-slate-300 px-4 py-3 font-normal disabled:bg-slate-100" /></label><button disabled className="rounded-full bg-slate-300 px-5 py-3 font-semibold text-slate-600">Login belum tersedia</button></form>}
          </div>
        </section>
        <ContentSection eyebrow="Catatan" title="Fitur portal akan mengikuti kontrak backend yang aman." className="bg-cyan-50"><p className="max-w-2xl leading-7 text-slate-700">Identity, session, RBAC, invoice, dan notifikasi akan diaktifkan bertahap setelah modul backend selesai dan diuji.</p></ContentSection>
      </main>
    </PageShell>
  );
}
