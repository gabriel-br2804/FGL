"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { fmtBRLCompact } from "@/lib/engine/format";
import { getCompany, getMunicipality } from "@/lib/data";
import type { Project } from "@/lib/types";

const STATUSES = ["Todas", "Planejada", "Em execução", "Atrasada", "Concluída", "Paralisada"] as const;

export function ObraListClient({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("Todas");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = projects;
    if (status !== "Todas") list = list.filter((p) => p.status === status);
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q));
    return [...list].sort((a, b) => b.currentValue - a.currentValue).slice(0, 150);
  }, [projects, query, status]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar obra…"
          className="w-full max-w-sm rounded-full border border-base-border px-4 py-2.5 text-sm outline-none focus:border-navy-700"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}
          className="rounded-full border border-base-border px-4 py-2.5 text-sm outline-none focus:border-navy-700"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "Todas" ? "Todas as situações" : s}
            </option>
          ))}
        </select>
        <span className="text-xs text-ink-500">{filtered.length} obras</span>
      </div>

      <div className="mt-5">
        <DataTable
          keyFor={(p) => p.id}
          rows={filtered}
          columns={[
            {
              header: "Obra",
              render: (p) => (
                <Link href={`/obras/${p.id}`} className="font-medium text-ink-900 hover:text-signal-blue">
                  {p.name}
                </Link>
              ),
            },
            {
              header: "Empresa",
              render: (p) => (
                <Link href={`/empresas/${p.companyId}`} className="text-ink-700 hover:text-signal-blue">
                  {getCompany(p.companyId)?.name}
                </Link>
              ),
            },
            { header: "Valor atual", align: "right", render: (p) => <span className="tabular-nums">{fmtBRLCompact(p.currentValue)}</span> },
            { header: "Situação", render: (p) => <StatusPill status={p.status} /> },
            { header: "Execução", align: "right", render: (p) => <span className="tabular-nums">{p.executedPercent ?? "—"}{p.executedPercent !== null ? "%" : ""}</span> },
          ]}
        />
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Concluída: "bg-signal-greenBg text-signal-green",
    "Em execução": "bg-signal-blue/10 text-signal-blue",
    Atrasada: "bg-signal-amberBg text-signal-amber",
    Paralisada: "bg-signal-redBg text-signal-red",
    Planejada: "bg-ink-900/5 text-ink-700",
  };
  return <span className={`badge ${map[status] ?? "bg-ink-900/5 text-ink-700"}`}>{status}</span>;
}
