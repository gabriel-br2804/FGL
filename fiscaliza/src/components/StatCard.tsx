export function StatCard({
  value,
  label,
  hint,
  accent = "navy",
}: {
  value: string;
  label: string;
  hint?: string;
  accent?: "navy" | "green" | "amber" | "red";
}) {
  const accentClass = {
    navy: "text-navy-900",
    green: "text-signal-green",
    amber: "text-signal-amber",
    red: "text-signal-red",
  }[accent];

  return (
    <div className="card fade-in p-6">
      <div className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${accentClass}`}>{value}</div>
      <div className="mt-1.5 text-sm font-medium text-ink-700">{label}</div>
      {hint && <div className="mt-1 text-xs text-ink-500">{hint}</div>}
    </div>
  );
}
