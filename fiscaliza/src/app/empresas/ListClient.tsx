"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { ScoreBadge } from "@/components/ScoreBadge";
import { fmtBRLCompact, fmtNumber } from "@/lib/engine/format";
import type { Company } from "@/lib/types";

type SortKey = "score" | "value" | "contracts" | "name";

export function CompanyListClient({ companies }: { companies: Company[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("score");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q ? companies.filter((c) => c.name.toLowerCase().includes(q) || c.cnpj.includes(q)) : companies;
    list = [...list].sort((a, b) => {
      if (sort === "value") return b.totalContracted - a.totalContracted;
      if (sort === "contracts") return b.contractsCount - a.contractsCount;
      if (sort === "name") return a.name.localeCompare(b.name);
      return b.fiscalizaScore - a.fiscalizaScore;
    });
    return list;
  }, [companies, query, sort]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por razão social ou CNPJ…"
          className="w-full max-w-sm rounded-full border border-base-border px-4 py-2.5 text-sm outline-none focus:border-navy-700"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-full border border-base-border px-4 py-2.5 text-sm outline-none focus:border-navy-700"
        >
          <option value="score">Ordenar por Fiscaliza Score</option>
          <option value="value">Ordenar por valor contratado</option>
          <option value="contracts">Ordenar por número de contratos</option>
          <option value="name">Ordenar por nome</option>
        </select>
        <span className="text-xs text-ink-500">{filtered.length} empresas</span>
      </div>

      <div className="mt-5">
        <DataTable
          keyFor={(c) => c.id}
          rows={filtered.slice(0, 100)}
          columns={[
            {
              header: "Empresa",
              render: (c) => (
                <Link href={`/empresas/${c.id}`} className="font-medium text-ink-900 hover:text-signal-blue">
                  {c.name}
                </Link>
              ),
            },
            { header: "CNPJ", render: (c) => <span className="font-mono text-xs text-ink-500">{c.cnpj}</span> },
            { header: "Total contratado", align: "right", render: (c) => <span className="tabular-nums">{fmtBRLCompact(c.totalContracted)}</span> },
            { header: "Contratos", align: "right", render: (c) => <span className="tabular-nums">{fmtNumber(c.contractsCount)}</span> },
            { header: "Municípios", align: "right", render: (c) => <span className="tabular-nums">{c.municipalitiesCount}</span> },
            { header: "Score", align: "right", render: (c) => <ScoreBadge score={c.fiscalizaScore} size="sm" /> },
          ]}
        />
      </div>
    </div>
  );
}
