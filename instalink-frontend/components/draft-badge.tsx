type DraftBadgeProps = {
  label?: string;
};

export function DraftBadge({ label = "Perlu konfirmasi" }: DraftBadgeProps) {
  return (
    <span className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-amber-800">
      {label}
    </span>
  );
}
