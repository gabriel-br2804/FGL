import type { RiskSignal } from "@/lib/types";

const SEVERITY_STYLE: Record<RiskSignal["severity"], { badge: string; border: string }> = {
  info: { badge: "bg-ink-900/5 text-ink-700", border: "border-base-border" },
  atencao: { badge: "bg-signal-amberBg text-signal-amber", border: "border-signal-amber/30" },
  alta: { badge: "bg-signal-amberBg text-[#B75A00]", border: "border-[#B75A00]/30" },
  critica: { badge: "bg-signal-redBg text-signal-red", border: "border-signal-red/30" },
};

export function SignalCard({ signal }: { signal: RiskSignal }) {
  const style = SEVERITY_STYLE[signal.severity];
  return (
    <div className={`rounded-xl2 border ${style.border} bg-white p-5`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className={`badge ${style.badge}`}>{signal.title}</span>
        <span className="text-xs font-semibold text-ink-500">+{signal.points} pts no Fiscaliza Score</span>
      </div>
      <dl className="space-y-2.5 text-sm">
        <div>
          <dt className="data-label text-ink-400">Dado</dt>
          <dd className="mt-0.5 text-ink-900">{signal.data}</dd>
        </div>
        <div>
          <dt className="data-label text-ink-400">Análise</dt>
          <dd className="mt-0.5 text-ink-700">{signal.analysis}</dd>
        </div>
        <div>
          <dt className="data-label text-ink-400">Interpretação</dt>
          <dd className="mt-0.5 text-ink-700">{signal.interpretation}</dd>
        </div>
      </dl>
    </div>
  );
}
