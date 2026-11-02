"use client";

import { useState, type FormEvent } from "react";
import {
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_STATUSES,
  type RegistrationListFilters,
  type RegistrationStatus,
} from "../../lib/dashboard-types";

type AppliedFilters = Pick<
  RegistrationListFilters,
  "status" | "area" | "from" | "to"
>;

function wibBoundary(value: string, endOfDay: boolean) {
  if (!value) return undefined;
  const time = endOfDay ? "23:59:59.999" : "00:00:00.000";
  return new Date(`${value}T${time}+07:00`).toISOString();
}

export function RegistrationFilters({
  onApply,
  disabled,
}: {
  onApply: (filters: AppliedFilters) => void;
  disabled: boolean;
}) {
  const [status, setStatus] = useState<RegistrationStatus | "">("");
  const [area, setArea] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [validationError, setValidationError] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (fromDate && toDate && fromDate > toDate) {
      setValidationError("Tanggal awal harus sama atau lebih awal dari tanggal akhir.");
      return;
    }
    setValidationError("");
    onApply({
      ...(status ? { status } : {}),
      ...(area.trim() ? { area: area.trim() } : {}),
      ...(fromDate ? { from: wibBoundary(fromDate, false) } : {}),
      ...(toDate ? { to: wibBoundary(toDate, true) } : {}),
    });
  };

  const reset = () => {
    setStatus("");
    setArea("");
    setFromDate("");
    setToDate("");
    setValidationError("");
    onApply({});
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.1fr_1.2fr_1fr_1fr_auto] xl:items-end">
        <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as RegistrationStatus | "")}
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900"
          >
            <option value="">Semua status</option>
            {REGISTRATION_STATUSES.map((value) => (
              <option key={value} value={value}>{REGISTRATION_STATUS_LABELS[value]}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
          Area
          <input
            value={area}
            onChange={(event) => setArea(event.target.value)}
            maxLength={160}
            placeholder="Contoh: Sumedang"
            className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-normal text-slate-900 placeholder:text-slate-400"
          />
        </label>
        <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
          Dari (WIB)
          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-normal text-slate-900"
          />
        </label>
        <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
          Sampai (WIB)
          <input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-normal text-slate-900"
          />
        </label>
        <div className="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-1">
          <button
            type="submit"
            disabled={disabled}
            className="min-h-11 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-wait disabled:opacity-60"
          >
            Terapkan
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={disabled}
            className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Reset
          </button>
        </div>
      </div>
      {validationError ? (
        <p role="alert" className="mt-3 text-sm text-rose-700">{validationError}</p>
      ) : null}
    </form>
  );
}
