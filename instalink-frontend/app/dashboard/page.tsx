"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RegistrationSummary } from "../../components/dashboard/registration-summary";
import { RegistrationTable } from "../../components/dashboard/registration-table";
import { ApiError } from "../../lib/api-client";
import { getRegistrationSummary } from "../../lib/dashboard-api";
import type { RegistrationSummary as RegistrationSummaryData } from "../../lib/dashboard-types";

export default function DashboardHomePage() {
  const [summary, setSummary] = useState<RegistrationSummaryData | null>(null);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await getRegistrationSummary());
      setError("");
      setForbidden(false);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 403) {
        setForbidden(true);
      }
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Ringkasan registrasi tidak dapat dimuat.",
      );
    } finally {
      setPending(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void getRegistrationSummary()
      .then((data) => {
        if (active) {
          setSummary(data);
          setError("");
          setForbidden(false);
        }
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        if (requestError instanceof ApiError && requestError.status === 403) {
          setForbidden(true);
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Ringkasan registrasi tidak dapat dimuat.",
        );
      })
      .finally(() => {
        if (active) setPending(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (pending) {
    return <p role="status" className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Memuat ringkasan registrasi...</p>;
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-800">
          {forbidden ? "Akses terbatas" : "Ringkasan"}
        </p>
        <h1 className="mt-2 text-xl font-semibold text-slate-950">
          {forbidden ? "Anda belum memiliki akses ke ringkasan" : "Ringkasan belum tersedia"}
        </h1>
        <p role="alert" className="mt-2 text-sm text-slate-600">{error}</p>
        {!forbidden ? (
          <button
            type="button"
            onClick={() => {
              setPending(true);
              void loadSummary();
            }}
            className="mt-5 min-h-11 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-cyan-800"
          >
            Coba lagi
          </button>
        ) : null}
      </section>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-5 rounded-3xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-end sm:p-7">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.17em] text-cyan-800">
            InstaLink / Layanan pelanggan
          </p>
          <h1 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Pantau setiap pengajuan pemasangan.
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Tinjau status registrasi, lanjutkan komunikasi, dan pastikan setiap
            keputusan tercatat.
          </p>
        </div>
        <Link
          href="/dashboard/registrations"
          className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-cyan-800"
        >
          Buka daftar registrasi
        </Link>
      </section>

      <RegistrationSummary summary={summary} />

      <section aria-labelledby="latest-registrations-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-800">
              Aktivitas terbaru
            </p>
            <h2 id="latest-registrations-title" className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
              Registrasi masuk
            </h2>
          </div>
          <Link href="/dashboard/registrations" className="min-h-11 inline-flex items-center text-sm font-semibold text-cyan-800 hover:text-cyan-950">
            Lihat semua
          </Link>
        </div>
        <RegistrationTable registrations={summary.latest} />
      </section>
    </div>
  );
}
