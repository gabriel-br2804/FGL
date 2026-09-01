"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BrazilMapGrid } from "./BrazilMapGrid";
import { ScoreBadge } from "@/components/ScoreBadge";
import { fmtBRLCompact, fmtNumber } from "@/lib/engine/format";
import type { StateAggregate } from "@/lib/data";
import type { Municipality } from "@/lib/types";

type Scope = "uniao" | "estado" | "municipio";

export function MapExplorer({
  stateAggregates,
  uniao,
}: {
  stateAggregates: StateAggregate[];
  uniao: {
    totalSpent: number;
    totalContracts: number;
    totalSuppliers: number;
    attentionPoints: number;
    statesCount: number;
    municipalitiesCount: number;
    realFederal: { count: number; totalValue: number; pncpCount: number; portalTransparenciaCount: number };
  };
}) {
  const [scope, setScope] = useState<Scope>("estado");
  const [selectedState, setSelectedState] = useState<string | null>("SP");
  const [query, setQuery] = useState("");

  const cells = useMemo(
    () => stateAggregates.map((s) => ({ id: s.state.id, label: s.state.name, score: s.avgScore })),
    [stateAggregates]
  );
  const selected = stateAggregates.find((s) => s.state.id === selectedState);

  const allMunicipalities = useMemo(
    () => stateAggregates.flatMap((s) => s.municipalities),
    [stateAggregates]
  );
  const filteredMunicipalities = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? allMunicipalities.filter((m) => m.name.toLowerCase().includes(q)) : allMunicipalities;
    return [...list].sort((a, b) => b.attentionPoints - a.attentionPoints).slice(0, 30);
  }, [allMunicipalities, query]);

  return (
    <div>
      <div className="inline-flex rounded-full border border-base-border bg-white p-1">
        {(
          [
            ["uniao", "União"],
            ["estado", "Estado"],
            ["municipio", "Município"],
          ] as [Scope, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setScope(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              scope === key ? "bg-navy-900 text-white" : "text-ink-700 hover:bg-ink-900/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {scope !== "municipio" ? (
            <div className="card p-6">
              <BrazilMapGrid cells={cells} selectedId={selectedState} onSelect={setSelectedState} />
            </div>
          ) : (
            <div className="card p-6">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar município pelo nome…"
                className="w-full rounded-full border border-base-border px-4 py-2.5 text-sm outline-none focus:border-navy-700"
              />
              <div className="mt-4 max-h-[420px] space-y-1.5 overflow-y-auto scrollbar-thin pr-1">
                {filteredMunicipalities.map((m) => (
                  <Link
                    key={m.id}
                    href={`/municipios/${m.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-base-border px-3 py-2.5 hover:border-navy-700"
                  >
                    <span className="text-sm font-medium text-ink-900">
                      {m.name} <span className="text-ink-400">— {m.stateId}</span>
                    </span>
                    <ScoreBadge score={m.fiscalizaScore} size="sm" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {scope === "uniao" && (
            <div className="card space-y-4 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="data-label">União</span>
                  <h3 className="text-xl font-bold text-navy-900">Governo Federal</h3>
                </div>
                <Link href="/uniao" className="text-sm font-medium text-signal-blue hover:underline">
                  Ver página completa →
                </Link>
              </div>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-ink-500">Gastos analisados</dt>
                  <dd className="text-lg font-bold text-navy-900">{fmtBRLCompact(uniao.totalSpent)}</dd>
                </div>
                <div>
                  <dt className="text-ink-500">Contratos</dt>
                  <dd className="text-lg font-bold text-navy-900">{fmtNumber(uniao.totalContracts)}</dd>
                </div>
                <div>
                  <dt className="text-ink-500">Estados monitorados</dt>
                  <dd className="text-lg font-bold text-navy-900">{uniao.statesCount}</dd>
                </div>
                <div>
                  <dt className="text-ink-500">Municípios monitorados</dt>
                  <dd className="text-lg font-bold text-navy-900">{uniao.municipalitiesCount}</dd>
                </div>
              </dl>
              {uniao.realFederal.count > 0 ? (
                <div className="rounded-xl2 bg-signal-greenBg p-3 text-xs text-signal-green">
                  <strong>{fmtNumber(uniao.realFederal.count)}</strong> contrato(s) federais reais identificados
                  ({fmtBRLCompact(uniao.realFederal.totalValue)}) — {uniao.realFederal.pncpCount} via PNCP
                  {uniao.realFederal.portalTransparenciaCount > 0
                    ? ` e ${uniao.realFederal.portalTransparenciaCount} via Portal da Transparência`
                    : ""}
                  .
                </div>
              ) : (
                <p className="text-xs text-ink-500">
                  Cobertura federal no MVP inclui contratos, despesas e convênios simulados no padrão do Portal da
                  Transparência. Rode <code className="font-mono">npm run ingest</code> para trazer dados reais. Ver{" "}
                  <Link href="/fontes" className="text-signal-blue hover:underline">Fontes de dados</Link>.
                </p>
              )}
            </div>
          )}

          {scope === "estado" && selected && (
            <div className="card space-y-4 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="data-label">Estado</span>
                  <h3 className="text-xl font-bold text-navy-900">{selected.state.name}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <ScoreBadge score={selected.avgScore} size="sm" />
                </div>
              </div>
              <Link href={`/estados/${selected.state.id.toLowerCase()}`} className="inline-block text-sm font-medium text-signal-blue hover:underline">
                Ver página completa do estado →
              </Link>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-ink-500">Gastos analisados</dt>
                  <dd className="text-lg font-bold text-navy-900">{fmtBRLCompact(selected.totalSpent)}</dd>
                </div>
                <div>
                  <dt className="text-ink-500">Contratos</dt>
                  <dd className="text-lg font-bold text-navy-900">{fmtNumber(selected.totalContracts)}</dd>
                </div>
                <div>
                  <dt className="text-ink-500">Fornecedores</dt>
                  <dd className="text-lg font-bold text-navy-900">{fmtNumber(selected.totalSuppliers)}</dd>
                </div>
                <div>
                  <dt className="text-ink-500">Pontos de atenção</dt>
                  <dd className="text-lg font-bold text-signal-amber">{fmtNumber(selected.attentionPoints)}</dd>
                </div>
              </dl>
              {selected.realStateContracts.count > 0 && (
                <div className="rounded-xl2 bg-signal-greenBg p-3 text-xs text-signal-green">
                  <strong>{fmtNumber(selected.realStateContracts.count)}</strong> contrato(s) estaduais reais (PNCP)
                  identificados, {fmtBRLCompact(selected.realStateContracts.totalValue)}.
                </div>
              )}
              <div>
                <div className="data-label mb-2">Municípios monitorados nesta UF</div>
                <div className="space-y-1.5">
                  {selected.municipalities.map((m: Municipality) => (
                    <Link
                      key={m.id}
                      href={`/municipios/${m.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-ink-900/[0.03]"
                    >
                      <span className="text-sm font-medium text-ink-900">{m.name}</span>
                      <ScoreBadge score={m.fiscalizaScore} size="sm" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {scope === "municipio" && (
            <div className="card p-6 text-sm text-ink-700">
              Selecione um município na lista ao lado para abrir sua página completa, com gastos por área, principais
              fornecedores, obras e pontos de atenção.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
