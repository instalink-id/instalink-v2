"use client";

import { FormEvent, useState } from "react";
import { publicContact } from "../lib/public-content";

type InstallationData = {
  name: string;
  email: string;
  phone: string;
  address: string;
  plan: string;
};

function buildWhatsAppUrl(data: InstallationData) {
  const message = [
    "Halo InstaLink, saya ingin mengecek pemasangan internet.",
    `Nama: ${data.name}`,
    `Email: ${data.email}`,
    `WhatsApp: ${data.phone}`,
    `Alamat: ${data.address}`,
    `Pilihan paket: ${data.plan || "Belum menentukan"}`,
  ].join("\n");
  return `https://wa.me/${publicContact.adminWhatsApp}?text=${encodeURIComponent(message)}`;
}

export function InstallationForm() {
  const [submitted, setSubmitted] = useState(false);
  const [whatsAppUrl, setWhatsAppUrl] = useState("");
  const [validationError, setValidationError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data: InstallationData = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      address: String(formData.get("address") ?? "").trim(),
      plan: String(formData.get("plan") ?? "").trim(),
    };
    if (!data.name || !data.email || !data.phone || !data.address) {
      setValidationError("Nama, email, nomor WhatsApp, dan alamat wajib diisi.");
      return;
    }
    setValidationError("");
    setWhatsAppUrl(buildWhatsAppUrl(data));
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-2xl bg-emerald-50 p-5 text-emerald-900">
        <p className="font-semibold">Data berhasil divalidasi di browser.</p>
        <p className="mt-2 text-sm leading-6">Belum ada penyimpanan backend. Lanjutkan percakapan melalui WhatsApp agar tim dapat memeriksa alamat dan pilihan layanan Anda.</p>
        <a href={whatsAppUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex rounded-full bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800">Lanjutkan ke WhatsApp ↗</a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {validationError ? <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{validationError}</p> : null}
      <label className="grid gap-2 text-sm font-medium">Nama lengkap<input required name="name" className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-cyan-600" /></label>
      <label className="grid gap-2 text-sm font-medium">Email<input required type="email" name="email" className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-cyan-600" /></label>
      <label className="grid gap-2 text-sm font-medium">Nomor WhatsApp<input required name="phone" className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-cyan-600" /></label>
      <label className="grid gap-2 text-sm font-medium">Alamat pemasangan<textarea required name="address" rows={3} className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-cyan-600" /></label>
      <label className="grid gap-2 text-sm font-medium">Paket pilihan<input name="plan" placeholder="Contoh: ingin konsultasi pilihan paket" className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-cyan-600" /></label>
      <button className="rounded-full bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-cyan-700">Validasi & lanjutkan →</button>
    </form>
  );
}
