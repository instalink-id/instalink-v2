"use client";

import { FormEvent, useState } from "react";

export function InstallationForm() {
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return <div className="rounded-2xl bg-emerald-50 p-5 text-emerald-800">Ajuan tersimpan sebagai simulasi lokal. Tim Instalink akan menghubungi Anda setelah backend registrasi tersedia.</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <label className="grid gap-2 text-sm font-medium">Nama lengkap<input required name="name" className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-cyan-600" /></label>
      <label className="grid gap-2 text-sm font-medium">Email<input required type="email" name="email" className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-cyan-600" /></label>
      <label className="grid gap-2 text-sm font-medium">Nomor WhatsApp<input required name="phone" className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-cyan-600" /></label>
      <label className="grid gap-2 text-sm font-medium">Alamat pemasangan<textarea required name="address" rows={3} className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-cyan-600" /></label>
      <label className="grid gap-2 text-sm font-medium">Paket pilihan<input name="plan" placeholder="Contoh: InstaHome 50 Mbps" className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-cyan-600" /></label>
      <button className="rounded-full bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-cyan-700">Kirim ajuan pemasangan →</button>
    </form>
  );
}

