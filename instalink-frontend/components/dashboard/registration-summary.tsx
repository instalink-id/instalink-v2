import {
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_STATUSES,
  type RegistrationSummary as RegistrationSummaryData,
} from "../../lib/dashboard-types";

const countStyles = [
  "border-t-sky-500",
  "border-t-cyan-500",
  "border-t-amber-500",
  "border-t-violet-500",
  "border-t-emerald-500",
  "border-t-rose-500",
  "border-t-slate-400",
];

export function RegistrationSummary({
  summary,
}: {
  summary: RegistrationSummaryData;
}) {
  return (
    <section aria-labelledby="registration-summary-title">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-800">
            Pipeline
          </p>
          <h2 id="registration-summary-title" className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
            Registrasi berdasarkan status
          </h2>
        </div>
        <p className="text-xs text-slate-500">Ringkasan seluruh waktu</p>
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {REGISTRATION_STATUSES.map((status, index) => (
          <div
            key={status}
            className={`rounded-2xl border border-slate-200 border-t-[3px] ${countStyles[index]} bg-white p-4`}
          >
            <dt className="min-h-9 text-xs font-medium leading-5 text-slate-600">
              {REGISTRATION_STATUS_LABELS[status]}
            </dt>
            <dd className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-slate-950">
              {summary.counts[status].toLocaleString("id-ID")}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
