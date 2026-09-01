"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { fmtBRLCompact } from "@/lib/engine/format";
import { getCompany, getMunicipality } from "@/lib/data";
import type { Contract } from "@/lib/types";

const PAGE_SIZE = 50;

export function ContractListClient({ contracts }: { contracts: Contract[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? contracts.filter(
          (c) =>
            c.number.toLowerCase().includes(q) ||
            c.object.toLowerCase().includes(q) ||
            (getCompany(c.companyId)?.name.toLowerCase().includes(q) ?? false)
        )
      : contracts;
    return [...list].sort((a, b) => b.currentValue - a.currentValue);
  }, [contracts, query]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleQueryChange(value: string) {
    setQuery(value);
    setPage(1);
  }

  // Janela de páginas ao redor da atual (máx. 7 botões), sempre incluindo
  // primeira e última — evita uma barra infinita quando há milhares de
  // contratos reais + simulados.
  const pageNumbers = useMemo(() => {
    const windowSize = 2;
    const pages = new Set<number>([1, totalPages]);
    for (let p = currentPage - windowSize; p <= currentPage + windowSize; p++) {
      if (p >= 1 && p <= totalPages) pages.add(p);
    }
    return Array.from(pages).sort((a, b) => a - b);
  }, [currentPage, totalPages]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Buscar por número, objeto ou fornecedor…"
          className="w-full max-w-sm rounded-full border border-base-border px-4 py-2.5 text-sm outline-none focus:border-navy-700"
        />
        <span className="text-xs text-ink-500">
          {sorted.length} contrato(s) {query ? "encontrados" : "no total"} · página {currentPage} de {totalPages}
        </span>
      </div>

      <div className="mt-5">
        <DataTable
          keyFor={(c) => c.id}
          rows={pageItems}
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

      {totalPages > 1 && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-full border border-base-border px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-900/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anterior
          </button>
          {pageNumbers.map((p, idx) => {
            const prev = pageNumbers[idx - 1];
            const gap = prev != null && p - prev > 1;
            return (
              <span key={p} className="flex items-center gap-1.5">
                {gap && <span className="px-1 text-ink-400">…</span>}
                <button
                  onClick={() => setPage(p)}
                  className={`h-9 min-w-[2.25rem] rounded-full px-2 text-sm font-medium ${
                    p === currentPage ? "bg-navy-900 text-white" : "text-ink-700 hover:bg-ink-900/5"
                  }`}
                >
                  {p}
                </button>
              </span>
            );
          })}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-full border border-base-border px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-900/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
