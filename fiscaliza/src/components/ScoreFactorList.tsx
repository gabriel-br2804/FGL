"use client";

import { useState } from "react";
import type { FiscalizaScoreBreakdown } from "@/lib/types";
import { FACTOR_DEFINITIONS } from "@/lib/engine/score";

export function ScoreFactorList({ breakdown }: { breakdown: FiscalizaScoreBreakdown }) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {breakdown.factors.map((f) => {
        const def = FACTOR_DEFINITIONS.find((d) => d.key === f.key);
        const open = openKey === f.key;
        const pct = f.maxPoints > 0 ? f.points / f.maxPoints : 0;
        return (
          <div key={f.key} className="rounded-xl2 border border-base-border bg-white">
            <button
              onClick={() => setOpenKey(open ? null : f.key)}
              className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-ink-900">{f.label}</span>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-navy-900">
                    {f.points} <span className="font-normal text-ink-400">/ {f.maxPoints} pts</span>
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-900/5">
                  <div
                    className={f.points > 0 ? "h-full rounded-full bg-navy-900" : "h-full rounded-full bg-ink-300"}
                    style={{ width: `${Math.max(pct * 100, f.points > 0 ? 4 : 0)}%` }}
                  />
                </div>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className={`shrink-0 text-ink-400 transition ${open ? "rotate-180" : ""}`}
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            {open && def && (
              <div className="border-t border-base-border px-4 py-3 text-sm text-ink-700">{def.description}</div>
            )}
          </div>
        );
      })}
      <div className="flex items-center justify-between rounded-xl2 bg-navy-900 px-4 py-3.5 text-white">
        <span className="text-sm font-semibold">Total</span>
        <span className="text-base font-extrabold tabular-nums">{breakdown.total}/100</span>
      </div>
    </div>
  );
}
