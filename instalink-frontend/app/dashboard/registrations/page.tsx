"use client";

import { useCallback, useEffect, useState } from "react";
import { RegistrationFilters } from "../../../components/dashboard/registration-filters";
import { RegistrationTable } from "../../../components/dashboard/registration-table";
import { ApiError } from "../../../lib/api-client";
import { getRegistrations } from "../../../lib/dashboard-api";
import type {
  RegistrationListFilters,
  RegistrationListResponse,
} from "../../../lib/dashboard-types";

const initialFilters: RegistrationListFilters = { page: 1, pageSize: 20 };

export default function RegistrationsPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [result, setResult] = useState<RegistrationListResponse | null>(null);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(async (nextFilters: RegistrationListFilters) => {
    try {
      setResult(await getRegistrations(nextFilters));
      setError("");
      setForbidden(false);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 403) {
        setForbidden(true);
      }
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Daftar registrasi tidak dapat dimuat.",
      );
    } finally {
      setPending(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void getRegistrations(initialFilters)
      .then((data) => {
        if (active) {
          setResult(data);
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
            : "Daftar registrasi tidak dapat dimuat.",
        );
      })
      .finally(() => {
        if (active) setPending(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-800">
            Pengelolaan calon pelanggan
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Registrasi pemasangan
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Tinjau pengajuan dan lanjutkan sesuai status serta hasil konfirmasi area.
          </p>
        </div>
        {result ? (
          <p className="text-sm text-slate-500">
            {result.total.toLocaleString("id-ID")} pengajuan
          </p>
        ) : null}
      </header>

      <RegistrationFilters
        onApply={(applied) => {
          const nextFilters = {
            ...applied,
            page: 1,
            pageSize: filters.pageSize ?? 20,
          };
          setFilters(nextFilters);
          setPending(true);
          void load(nextFilters);
        }}
        disabled={pending}
      />

      {pending ? (
        <p role="status" className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          Memuat daftar registrasi...
        </p>
      ) : error ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-950">
            {forbidden ? "Akses daftar dibatasi" : "Daftar belum tersedia"}
          </h2>
          <p role="alert" className="mt-2 text-sm text-slate-600">{error}</p>
          {!forbidden ? (
            <button
              type="button"
              onClick={() => {
                setPending(true);
                void load(filters);
              }}
              className="mt-4 min-h-11 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-cyan-800"
            >
              Coba lagi
            </button>
          ) : null}
        </section>
      ) : result ? (
        <>
          <RegistrationTable registrations={result.items} />
          <nav aria-label="Halaman daftar registrasi" className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Halaman {result.page} · {result.total.toLocaleString("id-ID")} pengajuan
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={result.page <= 1 || pending}
                onClick={() => {
                  const nextFilters = { ...filters, page: result.page - 1 };
                  setFilters(nextFilters);
                  setPending(true);
                  void load(nextFilters);
                }}
                className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                disabled={result.page * result.pageSize >= result.total || pending}
                onClick={() => {
                  const nextFilters = { ...filters, page: result.page + 1 };
                  setFilters(nextFilters);
                  setPending(true);
                  void load(nextFilters);
                }}
                className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                Berikutnya
              </button>
            </div>
          </nav>
        </>
      ) : null}
    </div>
  );
}
