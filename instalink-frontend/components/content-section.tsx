import type { ReactNode } from "react";

type ContentSectionProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
};

export function ContentSection({
  eyebrow,
  title,
  description,
  children,
  className = "",
}: ContentSectionProps) {
  return (
    <section className={`mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 ${className}`}>
      {eyebrow ? <p className="eyebrow text-sm font-bold uppercase text-cyan-700">{eyebrow}</p> : null}
      <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">{title}</h2>
      {description ? <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">{description}</p> : null}
      {children ? <div className="mt-8">{children}</div> : null}
    </section>
  );
}
