"use client";

import dynamic from "next/dynamic";

const CoverageMap = dynamic(
  () => import("./coverage-map").then((module) => module.CoverageMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[28rem] items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">
        Memuat peta coverage...
      </div>
    ),
  },
);

export function CoverageMapLoader() {
  return <CoverageMap />;
}
