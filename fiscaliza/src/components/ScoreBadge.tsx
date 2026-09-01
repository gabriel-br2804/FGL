import { riskLevelFromScore, RISK_LEVEL_LABEL, type RiskLevel } from "@/lib/types";

const STYLES: Record<RiskLevel, { bg: string; text: string; dot: string }> = {
  baixa_atencao: { bg: "bg-signal-greenBg", text: "text-signal-green", dot: "bg-signal-green" },
  normal: { bg: "bg-ink-900/5", text: "text-ink-700", dot: "bg-ink-500" },
  atencao: { bg: "bg-signal-amberBg", text: "text-signal-amber", dot: "bg-signal-amber" },
  alta_atencao: { bg: "bg-signal-amberBg", text: "text-[#B75A00]", dot: "bg-[#B75A00]" },
  atencao_critica: { bg: "bg-signal-redBg", text: "text-signal-red", dot: "bg-signal-red" },
};

export function ScoreBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const level = riskLevelFromScore(score);
  const s = STYLES[level];
  const sizing =
    size === "lg" ? "px-4 py-2 text-sm" : size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs";
  return (
    <span className={`badge ${s.bg} ${s.text} ${sizing}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {RISK_LEVEL_LABEL[level]} · {score}/100
    </span>
  );
}

export function ScoreDial({ score }: { score: number }) {
  const level = riskLevelFromScore(score);
  const s = STYLES[level];
  const circumference = 2 * Math.PI * 42;
  const offset = circumference * (1 - score / 100);
  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#EEEFEA" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          className={s.text}
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-extrabold text-ink-900">{score}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">/100</span>
      </div>
    </div>
  );
}
