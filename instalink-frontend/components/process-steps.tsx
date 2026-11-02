import { DraftBadge } from "./draft-badge";

export type ProcessStep = {
  number: string;
  title: string;
  description: string;
  draft?: boolean;
};

export function ProcessSteps({ steps }: { steps: ProcessStep[] }) {
  return (
    <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {steps.map((step) => (
        <li key={step.number} className="rounded-3xl border border-slate-200 bg-white p-6">
          <span className="text-sm font-bold text-cyan-700">{step.number}</span>
          <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
          {step.draft ? <div className="mt-5"><DraftBadge /></div> : null}
        </li>
      ))}
    </ol>
  );
}
