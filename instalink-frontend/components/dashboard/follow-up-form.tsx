"use client";

import { useState, type FormEvent } from "react";
import { ApiError } from "../../lib/api-client";

export function FollowUpForm({
  onSubmit,
}: {
  onSubmit: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setIsError(false);
    setPending(true);
    try {
      await onSubmit(note.trim());
      setNote("");
      setMessage("Catatan follow-up tersimpan.");
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof ApiError && error.status === 403
          ? "Akses ditolak. Anda tidak dapat menambahkan follow-up."
          : error instanceof Error
            ? error.message
            : "Follow-up tidak dapat disimpan.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5">
      <label htmlFor="follow-up-note" className="text-sm font-semibold text-slate-900">
        Catat follow-up
      </label>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        Tulis hasil komunikasi atau langkah berikutnya untuk tim.
      </p>
      <textarea
        id="follow-up-note"
        required
        minLength={2}
        maxLength={5000}
        rows={4}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400"
        placeholder="Contoh: Calon pelanggan meminta dihubungi kembali..."
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        {message ? (
          <p role={isError ? "alert" : "status"} className={`text-sm ${isError ? "text-rose-700" : "text-emerald-800"}`}>
            {message}
          </p>
        ) : <span />}
        <button
          type="submit"
          disabled={pending || note.trim().length < 2}
          className="min-h-11 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Menyimpan..." : "Simpan follow-up"}
        </button>
      </div>
    </form>
  );
}
