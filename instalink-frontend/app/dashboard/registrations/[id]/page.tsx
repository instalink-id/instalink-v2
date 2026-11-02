"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FollowUpForm } from "../../../../components/dashboard/follow-up-form";
import { StatusPill } from "../../../../components/dashboard/status-pill";
import { useDashboardUser } from "../../../../components/dashboard/dashboard-shell";
import { ApiError } from "../../../../lib/api-client";
import {
  addRegistrationFollowUp,
  changeRegistrationStatus,
  getRegistration,
} from "../../../../lib/dashboard-api";
import {
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_STATUS_TRANSITIONS,
  type RegistrationDetail,
  type RegistrationStatus,
} from "../../../../lib/dashboard-types";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export default function RegistrationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useDashboardUser();
  const canWrite = Boolean(
    user?.roles.some((role) => role === "customer_service" || role === "super_admin"),
  );
  const [registration, setRegistration] = useState<RegistrationDetail | null>(null);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [nextStatus, setNextStatus] = useState<RegistrationStatus | "">("");
  const [coverageConfirmed, setCoverageConfirmed] = useState(false);
  const [approvalReason, setApprovalReason] = useState("");
  const [statusPending, setStatusPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState(false);

  const loadRegistration = useCallback(async () => {
    try {
      setRegistration(await getRegistration(id));
      setError("");
      setForbidden(false);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 403) {
        setForbidden(true);
      }
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Detail registrasi tidak dapat dimuat.",
      );
    } finally {
      setPending(false);
    }
  }, [id]);

  useEffect(() => {
    let active = true;
    void getRegistration(id)
      .then((data) => {
        if (active) {
          setRegistration(data);
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
            : "Detail registrasi tidak dapat dimuat.",
        );
      })
      .finally(() => {
        if (active) setPending(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const transitions = useMemo(
    () => registration ? REGISTRATION_STATUS_TRANSITIONS[registration.status] : [],
    [registration],
  );

  const submitStatus = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!nextStatus) return;
    setStatusPending(true);
    setStatusMessage("");
    setStatusError(false);
    try {
      await changeRegistrationStatus(id, {
        status: nextStatus,
        ...(nextStatus === "DISETUJUI"
          ? { coverageConfirmed, reason: approvalReason.trim() }
          : {}),
      });
      setStatusMessage("Status registrasi berhasil diperbarui.");
      setNextStatus("");
      setCoverageConfirmed(false);
      setApprovalReason("");
      await loadRegistration();
    } catch (requestError) {
      setStatusError(true);
      setStatusMessage(
        requestError instanceof ApiError && requestError.status === 403
          ? "Akses ditolak. Anda tidak dapat mengubah status."
          : requestError instanceof Error
            ? requestError.message
            : "Status tidak dapat diperbarui.",
      );
    } finally {
      setStatusPending(false);
    }
  };

  const submitFollowUp = async (note: string) => {
    const saved = await addRegistrationFollowUp(id, note);
    setRegistration((current) =>
      current
        ? {
            ...current,
            followUps: [
              {
                id: saved.id,
                note: saved.note,
                createdAt: saved.createdAt,
              },
              ...current.followUps,
            ],
          }
        : current,
    );
  };

  if (pending) {
    return <p role="status" className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Memuat detail registrasi...</p>;
  }

  if (error || !registration) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <Link href="/dashboard/registrations" className="text-sm font-semibold text-cyan-800 hover:text-cyan-950">
          ← Kembali ke daftar
        </Link>
        <h1 className="mt-5 text-xl font-semibold text-slate-950">
          {forbidden ? "Akses detail dibatasi" : "Detail belum tersedia"}
        </h1>
        <p role="alert" className="mt-2 text-sm text-slate-600">{error || "Registrasi tidak ditemukan."}</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/registrations" className="text-sm font-semibold text-cyan-800 hover:text-cyan-950">
          ← Kembali ke daftar registrasi
        </Link>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-800">Detail pengajuan</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              {registration.fullName}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Diajukan {dateFormatter.format(new Date(registration.submittedAt))} WIB
            </p>
          </div>
          <StatusPill status={registration.status} />
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold text-slate-950">Informasi calon pelanggan</h2>
          <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-slate-500">WhatsApp</dt>
              <dd className="mt-1 break-words text-sm font-medium text-slate-900">{registration.whatsapp}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Email</dt>
              <dd className="mt-1 break-words text-sm font-medium text-slate-900">{registration.email || "Tidak dicantumkan"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Area</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">{registration.area || "Belum diisi"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Paket diminati</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">{registration.requestedPlan || "Belum ditentukan"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-slate-500">Alamat pemasangan</dt>
              <dd className="mt-1 break-words text-sm leading-6 text-slate-900">{registration.installationAddress}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-slate-500">Catatan pengajuan</dt>
              <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{registration.notes || "Tidak ada catatan."}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-950">Sumber dan persetujuan</h2>
            <dl className="mt-4 grid gap-4">
              <div>
                <dt className="text-xs font-medium text-slate-500">Sumber pengajuan</dt>
                <dd className="mt-1 text-sm text-slate-800">{registration.source}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">Izin komunikasi</dt>
                <dd className="mt-1 text-sm text-slate-800">{registration.communicationConsent ? "Diberikan" : "Belum diberikan"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">Konfirmasi coverage</dt>
                <dd className="mt-1 text-sm text-slate-800">
                  {registration.coverageConfirmedAt
                    ? dateFormatter.format(new Date(registration.coverageConfirmedAt))
                    : "Belum dikonfirmasi"}
                </dd>
              </div>
              {registration.approvalReason ? (
                <div>
                  <dt className="text-xs font-medium text-slate-500">Alasan persetujuan</dt>
                  <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">{registration.approvalReason}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          {canWrite && transitions.length > 0 ? (
            <form onSubmit={submitStatus} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-base font-semibold text-slate-950">Perbarui status</h2>
              <label className="mt-4 grid gap-1.5 text-xs font-semibold text-slate-700">
                Status berikutnya
                <select
                  required
                  value={nextStatus}
                  onChange={(event) => setNextStatus(event.target.value as RegistrationStatus | "")}
                  className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900"
                >
                  <option value="">Pilih status</option>
                  {transitions.map((status) => (
                    <option key={status} value={status}>{REGISTRATION_STATUS_LABELS[status]}</option>
                  ))}
                </select>
              </label>
              {nextStatus === "DISETUJUI" ? (
                <div className="mt-4 space-y-3">
                  <label className="flex items-start gap-3 text-sm leading-5 text-slate-700">
                    <input
                      type="checkbox"
                      checked={coverageConfirmed}
                      onChange={(event) => setCoverageConfirmed(event.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-cyan-800"
                    />
                    Coverage alamat telah dikonfirmasi
                  </label>
                  <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                    Alasan persetujuan
                    <textarea
                      required
                      minLength={2}
                      maxLength={2000}
                      rows={3}
                      value={approvalReason}
                      onChange={(event) => setApprovalReason(event.target.value)}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900"
                    />
                  </label>
                </div>
              ) : null}
              {statusMessage ? (
                <p role={statusError ? "alert" : "status"} className={`mt-3 text-sm ${statusError ? "text-rose-700" : "text-emerald-800"}`}>
                  {statusMessage}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={
                  statusPending ||
                  !nextStatus ||
                  (nextStatus === "DISETUJUI" &&
                    (!coverageConfirmed || approvalReason.trim().length < 2))
                }
                className="mt-4 min-h-11 w-full rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {statusPending ? "Menyimpan..." : "Simpan status"}
              </button>
            </form>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="follow-up-history-title" className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-800">Riwayat komunikasi</p>
          <h2 id="follow-up-history-title" className="mt-1 text-lg font-semibold text-slate-950">
            Follow-up
          </h2>
        </div>
        {registration.followUps.length > 0 ? (
          <ol className="space-y-3">
            {registration.followUps.map((followUp) => (
              <li key={followUp.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">{followUp.note}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {dateFormatter.format(new Date(followUp.createdAt))} WIB
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-7 text-sm text-slate-500">
            Belum ada catatan follow-up.
          </p>
        )}
        {canWrite ? <FollowUpForm onSubmit={submitFollowUp} /> : null}
      </section>
    </div>
  );
}
