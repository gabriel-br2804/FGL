"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "fiscaliza:monitored";

function readMonitored(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function MonitorButton({ targetId, label }: { targetId: string; label: string }) {
  const [monitored, setMonitored] = useState(false);

  useEffect(() => {
    setMonitored(!!readMonitored()[targetId]);
  }, [targetId]);

  function toggle() {
    const current = readMonitored();
    const next = !current[targetId];
    current[targetId] = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      // localStorage indisponível — a preferência simplesmente não persiste.
    }
    setMonitored(next);
  }

  return (
    <button
      onClick={toggle}
      className={
        monitored
          ? "inline-flex items-center gap-2 rounded-full border border-signal-green bg-signal-greenBg px-4 py-2 text-sm font-semibold text-signal-green transition"
          : "inline-flex items-center gap-2 rounded-full border border-ink-900/15 bg-white px-4 py-2 text-sm font-semibold text-ink-900 transition hover:border-navy-700"
      }
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill={monitored ? "currentColor" : "none"}>
        <path
          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="12" cy="9" r="2.4" stroke="currentColor" strokeWidth="2" />
      </svg>
      {monitored ? `Monitorando ${label}` : "Monitorar"}
    </button>
  );
}
