"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { fmtBRLCompact } from "@/lib/engine/format";
import { getCompany, getMunicipality } from "@/lib/data";
import type { Contract } from "@/lib/types";

export function ContractListClient({ contracts }: { contracts: Contract[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? contracts.filter(
          (c) =>
            c.number.toLowerCase().includes(q) ||
            c.object.toLowerCase().includes(q) ||
            (getCompany(c.companyId)?.name.toLowerCase().includes(q) ?? false)
        )
      : contracts;
    return [...list].sort((a, b) => b.currentValue - a.currentValue).slice(0, 150);
  }, [contracts, query]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por número, objeto ou fornecedor…"
          className="w-full max-w-sm rounded-full border border-base-border px-4 py-2.5 text-sm outline-none focus:border-navy-700"
        />
        <span className="text-xs text-ink-500">{contracts.length} contratos no total · exibindo os {filtered.length} de maior valor</span>
      </div>

      <div className="mt-5">
        <DataTable
          keyFor={(c) => c.id}
          rows={filtered}
          columns={[
            {
              header: "Contrato",
              render: (c) => (
                <Link href={`/contratos/${c.id}`} className="font-medium text-ink-900 hover:text-signal-blue">
                  {c.number}
                </Link>
              ),
            },
            { header: "Objeto", render: (c) => <span className="max-w-xs truncate text-ink-700">{c.object}</span> },
            {
              header: "Fornecedor",
              render: (c) => (
                <Link href={`/empresas/${c.companyId}`} className="text-ink-700 hover:text-signal-blue">
                  {getCompany(c.companyId)?.name}
                </Link>
              ),
            },
            {
              header: "Município",
              render: (c) => (
                <Link href={`/municipios/${c.municipalityId}`} className="text-ink-500 hover:text-signal-blue">
                  {getMunicipality(c.municipalityId)?.name}
                </Link>
              ),
            },
            { header: "Valor atual", align: "right", render: (c) => <span className="tabular-nums">{fmtBRLCompact(c.currentValue)}</span> },
            { header: "Status", render: (c) => <span className="text-ink-500">{c.status}</span> },
          ]}
        />
      </div>
    </div>
  );
}
