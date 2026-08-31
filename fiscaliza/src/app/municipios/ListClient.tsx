"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { ScoreBadge } from "@/components/ScoreBadge";
import { fmtBRLCompact, fmtNumber } from "@/lib/engine/format";
import type { Municipality } from "@/lib/types";

type SortKey = "score" | "spent" | "attention" | "name";

export function MunicipalityListClient({ municipalities }: { municipalities: Municipality[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("attention");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q
      ? municipalities.filter((m) => m.name.toLowerCase().includes(q) || m.stateId.toLowerCase().includes(q))
      : municipalities;
    list = [...list].sort((a, b) => {
      if (sort === "score") return b.fiscalizaScore - a.fiscalizaScore;
      if (sort === "spent") return b.totalSpent - a.totalSpent;
      if (sort === "name") return a.name.localeCompare(b.name);
      return b.attentionPoints - a.attentionPoints;
    });
    return list;
  }, [municipalities, query, sort]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por município ou UF…"
          className="w-full max-w-sm rounded-full border border-base-border px-4 py-2.5 text-sm outline-none focus:border-navy-700"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-full border border-base-border px-4 py-2.5 text-sm outline-none focus:border-navy-700"
        >
          <option value="attention">Ordenar por pontos de atenção</option>
          <option value="score">Ordenar por Fiscaliza Score</option>
          <option value="spent">Ordenar por gasto analisado</option>
          <option value="name">Ordenar por nome</option>
        </select>
        <span className="text-xs text-ink-500">{filtered.length} municípios</span>
      </div>

      <div className="mt-5">
        <DataTable
          keyFor={(m) => m.id}
          rows={filtered}
          columns={[
            {
              header: "Município",
              render: (m) => (
                <Link href={`/municipios/${m.id}`} className="font-medium text-ink-900 hover:text-signal-blue">
                  {m.name}
                </Link>
              ),
            },
            { header: "UF", render: (m) => <span className="text-ink-500">{m.stateId}</span> },
            { header: "População", align: "right", render: (m) => <span className="tabular-nums">{fmtNumber(m.population)}</span> },
            { header: "Gasto analisado", align: "right", render: (m) => <span className="tabular-nums">{fmtBRLCompact(m.totalSpent)}</span> },
            { header: "Contratos", align: "right", render: (m) => <span className="tabular-nums">{fmtNumber(m.totalContracts)}</span> },
            { header: "Pontos de atenção", align: "right", render: (m) => <span className="tabular-nums">{m.attentionPoints}</span> },
            { header: "Score", align: "right", render: (m) => <ScoreBadge score={m.fiscalizaScore} size="sm" /> },
          ]}
        />
      </div>
    </div>
  );
}
