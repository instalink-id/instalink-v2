import {
  REGISTRATION_STATUS_LABELS,
  type RegistrationStatus,
} from "../../lib/dashboard-types";

const statusStyles: Record<RegistrationStatus, string> = {
  BARU: "border-sky-200 bg-sky-50 text-sky-800",
  DITINDAKLANJUTI: "border-cyan-200 bg-cyan-50 text-cyan-800",
  MENUNGGU_KONFIRMASI_COVERAGE: "border-amber-200 bg-amber-50 text-amber-900",
  PERLU_SURVEI: "border-violet-200 bg-violet-50 text-violet-800",
  DISETUJUI: "border-emerald-200 bg-emerald-50 text-emerald-800",
  DITOLAK: "border-rose-200 bg-rose-50 text-rose-800",
  SELESAI: "border-slate-200 bg-slate-100 text-slate-700",
};

export function StatusPill({ status }: { status: RegistrationStatus }) {
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      {REGISTRATION_STATUS_LABELS[status]}
    </span>
  );
}
