import { DraftBadge } from "./draft-badge";

export type FaqItem = {
  question: string;
  answer: string;
  draft?: boolean;
};

export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-950">
            <span>{item.question}</span>
            <span className="text-xl text-cyan-700 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
          </summary>
          <div className="max-w-3xl pt-3 text-sm leading-7 text-slate-600">
            {item.draft ? <DraftBadge /> : null}
            <p className={item.draft ? "mt-3" : ""}>{item.answer}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
