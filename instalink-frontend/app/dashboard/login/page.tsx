"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError } from "../../../lib/api-client";
import { login } from "../../../lib/dashboard-api";

export default function DashboardLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await login(email.trim(), password);
      router.replace(
        response.user.mustChangePassword
          ? "/dashboard/change-password"
          : "/dashboard",
      );
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Login tidak dapat diproses. Periksa koneksi dan coba lagi.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f8fa] px-4 py-10 sm:px-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(8,47,73,0.08)] md:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden min-h-[560px] flex-col justify-between overflow-hidden bg-slate-950 p-9 text-white md:flex">
          <div aria-hidden="true" className="absolute -right-20 top-12 h-72 w-72 rounded-full border border-cyan-300/20" />
          <div aria-hidden="true" className="absolute -right-8 top-24 h-48 w-48 rounded-full border border-cyan-300/25" />
          <Link href="/" className="relative flex items-center gap-2 text-lg font-bold">
            <span className="brand-mark"><span /></span>
            <span>Insta<span className="text-cyan-300">Link</span></span>
          </Link>
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
              Ruang kerja internal
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight">
              Layanan pelanggan, lebih terarah.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
              Kelola pengajuan, tindak lanjuti kebutuhan, dan jaga setiap
              keputusan tetap tercatat.
            </p>
          </div>
          <p className="relative text-xs text-slate-400">
            Akses hanya untuk pengguna InstaLink yang berwenang.
          </p>
        </section>

        <section className="flex min-h-[560px] items-center px-5 py-10 sm:px-10 lg:px-14">
          <div className="mx-auto w-full max-w-md">
            <Link href="/" className="flex items-center gap-2 text-base font-bold md:hidden">
              <span className="brand-mark"><span /></span>
              <span>Insta<span className="text-cyan-700">Link</span></span>
            </Link>
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-cyan-800 md:mt-0">
              Dashboard InstaLink
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Masuk ke akun Anda
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Gunakan akun internal yang telah diberikan oleh administrator.
            </p>

            <form onSubmit={submit} className="mt-8 space-y-5">
              <label className="grid gap-2 text-sm font-semibold text-slate-800">
                Email kerja
                <input
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="min-h-12 rounded-xl border border-slate-300 px-3 text-sm font-normal text-slate-950 placeholder:text-slate-400"
                  placeholder="nama@instalink.id"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-800">
                Kata sandi
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="min-h-12 rounded-xl border border-slate-300 px-3 text-sm font-normal text-slate-950"
                  placeholder="Masukkan kata sandi"
                />
              </label>
              {error ? (
                <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={pending || !email.trim() || password.length < 8}
                className="min-h-12 w-full rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? "Memeriksa akun..." : "Masuk ke dashboard"}
              </button>
            </form>

            <p className="mt-6 border-t border-slate-100 pt-5 text-xs leading-5 text-slate-500">
              Jika Anda belum memiliki akses, hubungi Super Admin InstaLink.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
