import Link from "next/link";
import { StatusPill } from "./status-pill";
import type {
  RegistrationListItem,
  RegistrationSummaryItem,
} from "../../lib/dashboard-types";

type RegistrationRow = RegistrationListItem | RegistrationSummaryItem;

const submittedFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export function RegistrationTable({
  registrations,
}: {
  registrations: RegistrationRow[];
}) {
  if (registrations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
        <p className="font-semibold text-slate-800">Belum ada registrasi pada filter ini</p>
        <p className="mt-2 text-sm text-slate-500">
          Coba ubah filter status, area, atau rentang tanggal.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="grid gap-3 md:hidden">
        {registrations.map((registration) => (
          <li key={registration.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-slate-950">{registration.fullName}</h3>
                <p className="mt-1 truncate text-sm text-slate-600">
                  {"whatsapp" in registration ? registration.whatsapp : "Pengajuan pemasangan"}
                </p>
              </div>
              <StatusPill status={registration.status} />
            </div>
            <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
              <p className="min-w-0 text-xs leading-5 text-slate-500">
                {registration.area || "Area belum diisi"}
                <span className="block">
                  {submittedFormatter.format(new Date(registration.submittedAt))} WIB
                </span>
              </p>
              <Link
                href={`/dashboard/registrations/${encodeURIComponent(registration.id)}`}
                className="inline-flex min-h-11 shrink-0 items-center rounded-xl px-3 text-sm font-semibold text-cyan-800 hover:bg-cyan-50"
              >
                Buka
              </Link>
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <caption className="sr-only">Daftar calon pelanggan yang terdaftar</caption>
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-5 py-3">Calon pelanggan</th>
                <th scope="col" className="px-5 py-3">Area</th>
                <th scope="col" className="px-5 py-3">Status</th>
                <th scope="col" className="px-5 py-3">Diajukan</th>
                <th scope="col" className="px-5 py-3"><span className="sr-only">Aksi</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {registrations.map((registration) => (
                <tr key={registration.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{registration.fullName}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {"whatsapp" in registration ? registration.whatsapp : "Pengajuan pemasangan"}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{registration.area || "Belum diisi"}</td>
                  <td className="px-5 py-4"><StatusPill status={registration.status} /></td>
                  <td className="px-5 py-4 text-xs text-slate-600">
                    {submittedFormatter.format(new Date(registration.submittedAt))} WIB
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/dashboard/registrations/${encodeURIComponent(registration.id)}`}
                      className="inline-flex min-h-11 items-center rounded-xl px-3 font-semibold text-cyan-800 hover:bg-cyan-50"
                    >
                      Detail<span className="sr-only"> {registration.fullName}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
