"use client";

import { FormEvent, useState } from "react";
import { PageShell } from "../../components/page-shell";

export default function CustomerPortalPage() {
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSubmitted(true); };
  return <PageShell><main className="mx-auto grid min-h-[65vh] max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:px-8"><div><p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">Portal pelanggan</p><h1 className="mt-4 text-5xl font-semibold tracking-tight">Kelola layanan Anda dengan mudah.</h1><p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">Gunakan ID pelanggan dan password portal untuk melihat layanan, tagihan, pembayaran, notifikasi, dan pengajuan bantuan.</p><div className="mt-8 grid gap-3 text-sm text-slate-600"><span>✓ Ringkasan layanan dan status koneksi</span><span>✓ Tagihan dan riwayat pembayaran</span><span>✓ Notifikasi dan bantuan pelanggan</span></div></div><div className="rounded-3xl bg-white p-8 shadow-lg shadow-slate-200"><h2 className="text-2xl font-semibold">Masuk ke akun pelanggan</h2><p className="mt-3 text-sm text-slate-500">Portal API akan dihubungkan pada fase identity backend.</p>{submitted ? <div className="mt-6 rounded-2xl bg-amber-50 p-5 text-amber-800">Login belum diaktifkan di environment lokal. Fondasi form berhasil diuji.</div> : <form onSubmit={handleSubmit} className="mt-6 grid gap-4"><label className="grid gap-2 text-sm font-medium">ID Pelanggan<input required placeholder="Contoh: INS2610261234" className="rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-cyan-600" /></label><label className="grid gap-2 text-sm font-medium">Password<input required type="password" placeholder="Masukkan password portal" className="rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-cyan-600" /></label><button className="rounded-full bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-cyan-700">Masuk Portal</button></form>}</div></main></PageShell>;
}

