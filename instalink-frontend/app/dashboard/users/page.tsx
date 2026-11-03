"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useDashboardUser } from "../../../components/dashboard/dashboard-shell";
import { ApiError } from "../../../lib/api-client";
import {
  changeAdminUserRole,
  changeAdminUserStatus,
  createAdminUser,
  getAdminUsers,
  resetAdminUserPassword,
} from "../../../lib/dashboard-api";
import {
  ADMIN_ROLE_OPTIONS,
  ADMIN_USER_STATUS_LABELS,
  type AdminRoleCode,
  type AdminUser,
  type AdminUserListFilters,
  type AdminUserListResponse,
  type AdminUserStatus,
  type TemporaryPasswordUser,
} from "../../../lib/dashboard-types";

const initialFilters: AdminUserListFilters = { page: 1, pageSize: 20 };

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

function formatDate(value: string | null) {
  if (!value) return "Belum pernah";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}

function requestError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function TemporaryPasswordNotice({
  credential,
  onDismiss,
}: {
  credential: TemporaryPasswordUser;
  onDismiss: () => void;
}) {
  return (
    <section
      role="status"
      aria-live="polite"
      className="rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-amber-950">
            Kata sandi sementara — tampil satu kali
          </h2>
          <p className="mt-1 break-all text-sm text-amber-900">
            {credential.email}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="min-h-11 rounded-xl border border-amber-400 px-3 text-sm font-semibold text-amber-950 hover:bg-amber-100"
        >
          Sembunyikan
        </button>
      </div>
      <code className="mt-4 block break-all rounded-xl border border-amber-200 bg-white px-3 py-3 text-sm font-semibold text-slate-950">
        {credential.temporaryPassword}
      </code>
      <p className="mt-3 text-xs leading-5 text-amber-900">
        Berlaku sampai {formatDate(credential.passwordChangeExpiresAt)}. Berikan
        melalui kanal aman; pengguna wajib menggantinya saat masuk pertama kali.
      </p>
    </section>
  );
}

export default function AdminUsersPage() {
  const user = useDashboardUser();
  const isSuperAdmin = Boolean(user?.roles.includes("super_admin"));
  const [filters, setFilters] = useState(initialFilters);
  const [result, setResult] = useState<AdminUserListResponse | null>(null);
  const [pending, setPending] = useState(true);
  const [reloadIndex, setReloadIndex] = useState(0);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<AdminRoleCode | "">("");
  const [statusFilter, setStatusFilter] = useState<AdminUserStatus | "">("");
  const [email, setEmail] = useState("");
  const [newRole, setNewRole] = useState<AdminRoleCode | "">("");
  const [createPending, setCreatePending] = useState(false);
  const [createError, setCreateError] = useState("");
  const [credential, setCredential] = useState<TemporaryPasswordUser | null>(
    null,
  );
  const [workingUserId, setWorkingUserId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    if (!isSuperAdmin) return;
    let active = true;
    void getAdminUsers(filters)
      .then((data) => {
        if (!active) return;
        setResult(data);
        setError("");
        setForbidden(false);
      })
      .catch((requestFailure: unknown) => {
        if (!active) return;
        if (
          requestFailure instanceof ApiError &&
          requestFailure.status === 403
        ) {
          setForbidden(true);
        }
        setError(
          requestError(
            requestFailure,
            "Daftar pengguna tidak dapat dimuat.",
          ),
        );
      })
      .finally(() => {
        if (active) setPending(false);
      });

    return () => {
      active = false;
    };
  }, [filters, isSuperAdmin, reloadIndex]);

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setFilters({
      page: 1,
      pageSize: initialFilters.pageSize,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(roleFilter ? { role: roleFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    });
  };

  const createUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newRole) {
      setCreateError("Pilih peran sebelum membuat akun.");
      return;
    }

    setCreatePending(true);
    setCreateError("");
    setActionError("");
    setActionMessage("");
    try {
      const created = await createAdminUser({
        email: email.trim(),
        roleCode: newRole,
      });
      setEmail("");
      setNewRole("");
      setCredential(created);
      setActionMessage("Akun berhasil dibuat.");
      setPending(true);
      setReloadIndex((index) => index + 1);
    } catch (requestFailure) {
      setCreateError(
        requestError(requestFailure, "Akun tidak dapat dibuat. Coba lagi."),
      );
    } finally {
      setCreatePending(false);
    }
  };

  const updateRole = async (target: AdminUser, roleCode: AdminRoleCode) => {
    if (!user || target.id === user.id || target.role?.code === roleCode) {
      return;
    }
    setWorkingUserId(target.id);
    setActionError("");
    setActionMessage("");
    try {
      await changeAdminUserRole(target.id, roleCode);
      setActionMessage(`Peran ${target.email} berhasil diperbarui.`);
      setPending(true);
      setReloadIndex((index) => index + 1);
    } catch (requestFailure) {
      setActionError(
        requestError(requestFailure, "Peran pengguna tidak dapat diperbarui."),
      );
    } finally {
      setWorkingUserId(null);
    }
  };

  const updateStatus = async (
    target: AdminUser,
    status: AdminUserStatus,
  ) => {
    if (!user || target.id === user.id) return;
    const action = status === "DISABLED" ? "menonaktifkan" : "mengaktifkan";
    if (
      !window.confirm(
        `Anda akan ${action} akun ${target.email}. Lanjutkan?`,
      )
    ) {
      return;
    }
    setWorkingUserId(target.id);
    setActionError("");
    setActionMessage("");
    try {
      await changeAdminUserStatus(target.id, status);
      setActionMessage(`Status ${target.email} berhasil diperbarui.`);
      setPending(true);
      setReloadIndex((index) => index + 1);
    } catch (requestFailure) {
      setActionError(
        requestError(requestFailure, "Status pengguna tidak dapat diperbarui."),
      );
    } finally {
      setWorkingUserId(null);
    }
  };

  const resetPassword = async (target: AdminUser) => {
    if (
      !window.confirm(
        `Reset kata sandi ${target.email}? Semua sesi aktif akan dicabut dan pengguna harus mengganti kata sandi saat masuk.`,
      )
    ) {
      return;
    }
    setWorkingUserId(target.id);
    setActionError("");
    setActionMessage("");
    try {
      setCredential(await resetAdminUserPassword(target.id));
      setActionMessage(`Kata sandi sementara untuk ${target.email} dibuat.`);
      setPending(true);
      setReloadIndex((index) => index + 1);
    } catch (requestFailure) {
      setActionError(
        requestError(
          requestFailure,
          "Kata sandi pengguna tidak dapat direset.",
        ),
      );
    } finally {
      setWorkingUserId(null);
    }
  };

  if (!isSuperAdmin) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-800">
          Akses terbatas
        </p>
        <h1 className="mt-2 text-xl font-semibold text-slate-950">
          Manajemen pengguna
        </h1>
        <p role="alert" className="mt-2 text-sm leading-6 text-slate-600">
          Hanya Super Admin yang dapat melihat dan mengelola akun internal.
        </p>
      </section>
    );
  }

  const totalPages = result
    ? Math.max(1, Math.ceil(result.total / result.pageSize))
    : 1;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-800">
            Administrasi akses
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Manajemen pengguna
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Buat akun staf, atur satu peran, dan kendalikan sesi akses dari satu
            tempat.
          </p>
        </div>
        {result ? (
          <p className="text-sm text-slate-500">
            {result.total.toLocaleString("id-ID")} akun
          </p>
        ) : null}
      </header>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
        <form
          onSubmit={createUser}
          className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
        >
          <h2 className="text-base font-semibold text-slate-950">
            Buat akun staf
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Password sementara dibuat otomatis dan hanya ditampilkan satu kali.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,0.8fr)_auto] sm:items-end">
            <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
              Email kerja
              <input
                type="email"
                autoComplete="email"
                required
                maxLength={320}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@instalink.id"
                className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-normal text-slate-950 placeholder:text-slate-400"
              />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
              Peran
              <select
                required
                value={newRole}
                onChange={(event) =>
                  setNewRole(event.target.value as AdminRoleCode | "")
                }
                className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-950"
              >
                <option value="" disabled>
                  Pilih peran
                </option>
                {ADMIN_ROLE_OPTIONS.map((role) => (
                  <option key={role.code} value={role.code}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={createPending || !email.trim() || !newRole}
              className="min-h-11 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createPending ? "Membuat..." : "Buat akun"}
            </button>
          </div>
          {createError ? (
            <p role="alert" className="mt-3 text-sm text-rose-700">
              {createError}
            </p>
          ) : null}
        </form>

        {credential ? (
          <TemporaryPasswordNotice
            credential={credential}
            onDismiss={() => setCredential(null)}
          />
        ) : (
          <aside className="flex items-center rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 sm:p-5">
            <p className="text-sm leading-6 text-cyan-950">
              Password sementara berlaku 24 jam. Sampaikan melalui kanal aman;
              jangan menaruhnya di catatan atau browser storage.
            </p>
          </aside>
        )}
      </section>

      {actionError ? (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {actionError}
        </p>
      ) : actionMessage ? (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {actionMessage}
        </p>
      ) : null}

      <form
        onSubmit={applyFilters}
        className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.3fr)_minmax(10rem,0.8fr)_minmax(10rem,0.8fr)_auto] xl:items-end">
          <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
            Cari email
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              maxLength={320}
              placeholder="Ketik email pengguna"
              className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-normal text-slate-950 placeholder:text-slate-400"
            />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
            Peran
            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value as AdminRoleCode | "")
              }
              className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-950"
            >
              <option value="">Semua peran</option>
              {ADMIN_ROLE_OPTIONS.map((role) => (
                <option key={role.code} value={role.code}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
            Status
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as AdminUserStatus | "")
              }
              className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-950"
            >
              <option value="">Semua status</option>
              {Object.entries(ADMIN_USER_STATUS_LABELS).map(
                ([status, label]) => (
                  <option key={status} value={status}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </label>
          <button
            type="submit"
            disabled={pending}
            className="min-h-11 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-wait disabled:opacity-50"
          >
            Terapkan
          </button>
        </div>
      </form>

      {pending ? (
        <p role="status" className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          Memuat daftar pengguna...
        </p>
      ) : error ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-950">
            {forbidden ? "Akses daftar dibatasi" : "Daftar belum tersedia"}
          </h2>
          <p role="alert" className="mt-2 text-sm text-slate-600">
            {error}
          </p>
          {!forbidden ? (
            <button
              type="button"
              onClick={() => {
                setPending(true);
                setReloadIndex((index) => index + 1);
              }}
              className="mt-4 min-h-11 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-cyan-800"
            >
              Coba lagi
            </button>
          ) : null}
        </section>
      ) : result?.items.length ? (
        <section className="space-y-3" aria-label="Daftar pengguna">
          {result.items.map((account) => {
            const isCurrentUser = account.id === user?.id;
            const actionPending = workingUserId === account.id;
            const statusToSet: AdminUserStatus =
              account.status === "ACTIVE" ? "DISABLED" : "ACTIVE";

            return (
              <article
                key={account.id}
                className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(12rem,0.85fr)_minmax(13rem,0.9fr)] xl:items-center"
              >
                <div className="min-w-0">
                  <p className="break-all text-sm font-semibold text-slate-950">
                    {account.email}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span
                      className={`rounded-full px-2.5 py-1 font-semibold ${
                        account.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {ADMIN_USER_STATUS_LABELS[account.status]}
                    </span>
                    <span>
                      Login terakhir: {formatDate(account.lastLoginAt)}
                    </span>
                  </div>
                  {account.mustChangePassword ? (
                    <p className="mt-2 text-xs font-medium text-amber-800">
                      Wajib mengganti kata sandi
                      {account.passwordChangeExpiresAt
                        ? ` · berlaku sampai ${formatDate(account.passwordChangeExpiresAt)}`
                        : ""}
                    </p>
                  ) : null}
                </div>

                <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                  Peran
                  <select
                    aria-label={`Peran ${account.email}`}
                    value={account.role?.code ?? ""}
                    disabled={actionPending || isCurrentUser}
                    onChange={(event) => {
                      const selectedRole = ADMIN_ROLE_OPTIONS.find(
                        (role) => role.code === event.target.value,
                      );
                      if (selectedRole) {
                        void updateRole(account, selectedRole.code);
                      }
                    }}
                    className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-950 disabled:bg-slate-50 disabled:text-slate-500"
                  >
                    {account.role ? null : (
                      <option value="" disabled>
                        Belum memiliki peran
                      </option>
                    )}
                    {ADMIN_ROLE_OPTIONS.map((role) => (
                      <option key={role.code} value={role.code}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  {isCurrentUser ? (
                    <span className="font-normal text-slate-500">
                      Peran akun Anda tidak dapat diubah dari sini.
                    </span>
                  ) : null}
                </label>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={actionPending || isCurrentUser}
                    onClick={() => void updateStatus(account, statusToSet)}
                    className="min-h-11 rounded-xl border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {account.status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                  <button
                    type="button"
                    disabled={actionPending}
                    onClick={() => void resetPassword(account)}
                    className="min-h-11 rounded-xl border border-cyan-200 bg-cyan-50 px-3 text-xs font-semibold text-cyan-900 hover:bg-cyan-100 disabled:cursor-wait disabled:opacity-50"
                  >
                    {actionPending ? "Memproses..." : "Reset kata sandi"}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Belum ada akun yang cocok dengan filter ini.
        </p>
      )}

      {result ? (
        <nav
          aria-label="Halaman daftar pengguna"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="text-xs text-slate-500">
            Halaman {result.page} dari {totalPages} ·{" "}
            {result.total.toLocaleString("id-ID")} akun
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={result.page <= 1 || pending}
              onClick={() => {
                setPending(true);
                setFilters((current) => ({ ...current, page: result.page - 1 }));
              }}
              className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              disabled={result.page >= totalPages || pending}
              onClick={() => {
                setPending(true);
                setFilters((current) => ({ ...current, page: result.page + 1 }));
              }}
              className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              Berikutnya
            </button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
