export interface TimelineStep {
  label: string;
  date?: string;
  description?: string;
  state: "done" | "current" | "pending" | "alert";
}

const DOT: Record<TimelineStep["state"], string> = {
  done: "bg-signal-green border-signal-green",
  current: "bg-navy-900 border-navy-900",
  pending: "border-ink-300 bg-white",
  alert: "bg-signal-amber border-signal-amber",
};

export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="relative ml-3 space-y-7 border-l-2 border-base-border pl-7">
      {steps.map((s, idx) => (
        <li key={idx} className="relative">
          <span
            className={`absolute -left-[2.05rem] top-0.5 h-4 w-4 rounded-full border-2 ${DOT[s.state]}`}
          />
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <span className="text-sm font-semibold text-ink-900">{s.label}</span>
            {s.date && <span className="text-xs text-ink-500">{s.date}</span>}
          </div>
          {s.description && <p className="mt-1 text-sm text-ink-700">{s.description}</p>}
        </li>
      ))}
    </ol>
  );
}
