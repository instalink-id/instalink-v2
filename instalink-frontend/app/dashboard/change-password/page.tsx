"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  useDashboardUser,
  useUpdateDashboardUser,
} from "../../../components/dashboard/dashboard-shell";
import { ApiError } from "../../../lib/api-client";
import { changePassword, getCurrentUser } from "../../../lib/dashboard-api";

export default function ChangePasswordPage() {
  const router = useRouter();
  const user = useDashboardUser();
  const updateUser = useUpdateDashboardUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi kata sandi baru belum cocok.");
      return;
    }

    setPending(true);
    try {
      await changePassword(currentPassword, newPassword);
      if (user) updateUser({ ...user, mustChangePassword: false });
      setSuccess("Kata sandi berhasil diperbarui. Membuka dashboard...");
      router.replace("/dashboard");
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        try {
          await getCurrentUser();
          setError(requestError.message);
        } catch (sessionError) {
          if (sessionError instanceof ApiError && sessionError.status === 401) {
            return;
          }
          setError(
            sessionError instanceof Error
              ? sessionError.message
              : "Sesi tidak dapat diverifikasi. Muat ulang halaman dan coba lagi.",
          );
        }
      } else {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Kata sandi tidak dapat diperbarui. Coba lagi.",
        );
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-7rem)] w-full max-w-5xl items-center gap-8 lg:grid-cols-[0.8fr_1.2fr]">
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-800">
          Keamanan akun
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Ganti kata sandi
        </h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
          {user?.mustChangePassword
            ? "Kata sandi sementara harus diganti sebelum Anda melanjutkan ke dashboard."
            : "Gunakan kata sandi baru yang kuat dan belum pernah dipakai untuk akun ini."}
        </p>
      </section>

      <form
        onSubmit={submit}
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
      >
        <div className="space-y-5">
          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            Kata sandi saat ini
            <input
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="min-h-12 rounded-xl border border-slate-300 px-3 text-sm font-normal text-slate-950"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            Kata sandi baru
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="min-h-12 rounded-xl border border-slate-300 px-3 text-sm font-normal text-slate-950"
            />
            <span className="text-xs font-normal text-slate-500">
              Minimal 12 karakter.
            </span>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            Ulangi kata sandi baru
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="min-h-12 rounded-xl border border-slate-300 px-3 text-sm font-normal text-slate-950"
            />
          </label>

          {error ? (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800">
              {error}
            </p>
          ) : null}
          {success ? (
            <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
              {success}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={
              pending ||
              !currentPassword ||
              newPassword.length < 12 ||
              !confirmPassword
            }
            className="min-h-12 w-full rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Menyimpan..." : "Simpan kata sandi baru"}
          </button>
        </div>
      </form>
    </div>
  );
}
