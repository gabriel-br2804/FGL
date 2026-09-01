import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getMunicipality,
  getMunicipalityScore,
  getMunicipalitySignals,
  contractsForMunicipality,
  projectsForMunicipality,
  suppliersForMunicipality,
  getState,
  listMunicipalities,
} from "@/lib/data";
import { ScoreBadge, ScoreDial } from "@/components/ScoreBadge";
import { StatCard } from "@/components/StatCard";
import { AreaBarChart } from "@/components/charts/AreaBarChart";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { ConcentrationBars } from "@/components/ConcentrationBars";
import { ScoreFactorList } from "@/components/ScoreFactorList";
import { SignalCard } from "@/components/SignalCard";
import { MonitorButton } from "@/components/MonitorButton";
import { DataTable } from "@/components/DataTable";
import { fmtBRL, fmtBRLCompact, fmtDate, fmtNumber } from "@/lib/engine/format";

export function generateStaticParams() {
  return listMunicipalities().map((m) => ({ id: m.id }));
}

export default function MunicipalityPage({ params }: { params: { id: string } }) {
  const muni = getMunicipality(params.id);
  if (!muni) notFound();
  const state = getState(muni.stateId);
  const breakdown = getMunicipalityScore(muni.id)!;
  const signals = getMunicipalitySignals(muni.id);
  const contracts = contractsForMunicipality(muni.id);
  const projects = projectsForMunicipality(muni.id);
  const suppliers = suppliersForMunicipality(muni.id, 6);
  const contractedTotal = contracts.reduce((s, c) => s + c.currentValue, 0);

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="section-label">Município</span>
            {muni.populationSource === "ibge" ? (
              <span className="badge bg-signal-greenBg text-signal-green">População real · IBGE</span>
            ) : (
              <span className="badge bg-ink-900/5 text-ink-500">População estimada (MVP)</span>
            )}
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
            {muni.name} — {muni.stateId}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {state?.name} · Região {state?.region} · Código IBGE {muni.ibgeCode}
          </p>
        </div>
        <MonitorButton targetId={`municipality:${muni.id}`} label={muni.name} />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard value={fmtNumber(muni.population)} label="População" />
        <StatCard
          value={fmtBRLCompact(muni.annualBudget)}
          label="Orçamento anual"
          hint={muni.budgetSource === "siconfi" ? "Real · SICONFI" : "Estimativa (MVP)"}
        />
        <StatCard value={fmtBRLCompact(muni.totalSpent)} label="Gastos analisados" />
        <StatCard value={fmtNumber(muni.totalContracts)} label="Contratos" />
        <StatCard value={fmtNumber(muni.totalSuppliers)} label="Fornecedores" />
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-8">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-navy-900">Onde o dinheiro está indo?</h2>
            <p className="mt-1 text-sm text-ink-500">Distribuição do gasto analisado por área.</p>
            <div className="mt-4">
              <AreaBarChart data={muni.spendingByArea} />
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold text-navy-900">Evolução dos gastos</h2>
            <div className="mt-4">
              <TrendLineChart data={muni.spendingHistory} />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-navy-900">Principais fornecedores</h2>
              <Link href={`/empresas?municipio=${muni.id}`} className="text-sm font-medium text-signal-blue hover:underline">
                Ver todos
              </Link>
            </div>
            <p className="mt-1 text-sm text-ink-500">Ranking por valor total recebido, entre os fornecedores com contrato neste município.</p>
            <div className="mt-4">
              <ConcentrationBars
                items={suppliers.map((s) => ({
                  name: s.company.name,
                  href: `/empresas/${s.company.id}`,
                  value: s.value,
                  share: contractedTotal > 0 ? s.value / contractedTotal : 0,
                }))}
              />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-navy-900">Obras</h2>
              <Link href={`/obras?municipio=${muni.id}`} className="text-sm font-medium text-signal-blue hover:underline">
                Ver todas ({projects.length})
              </Link>
            </div>
            <div className="mt-4">
              <DataTable
                keyFor={(p) => p.id}
                rows={projects.slice(0, 6)}
                columns={[
                  {
                    header: "Obra",
                    render: (p) => (
                      <Link href={`/obras/${p.id}`} className="font-medium text-ink-900 hover:text-signal-blue">
                        {p.name}
                      </Link>
                    ),
                  },
                  { header: "Valor atual", align: "right", render: (p) => <span className="tabular-nums">{fmtBRLCompact(p.currentValue)}</span> },
                  { header: "Situação", render: (p) => <StatusPill status={p.status} /> },
                  {
                    header: "Execução",
                    align: "right",
                    render: (p) => <span className="tabular-nums">{p.executedPercent ?? "—"}{p.executedPercent !== null ? "%" : ""}</span>,
                  },
                ]}
              />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-navy-900">Contratos recentes</h2>
              <Link href={`/contratos?municipio=${muni.id}`} className="text-sm font-medium text-signal-blue hover:underline">
                Ver todos ({contracts.length})
              </Link>
            </div>
            <div className="mt-4">
              <DataTable
                keyFor={(c) => c.id}
                rows={[...contracts].sort((a, b) => (a.signedAt < b.signedAt ? 1 : -1)).slice(0, 8)}
                columns={[
                  {
                    header: "Contrato",
                    render: (c) => (
                      <Link href={`/contratos/${c.id}`} className="font-medium text-ink-900 hover:text-signal-blue">
                        {c.number}
                      </Link>
                    ),
                  },
                  { header: "Objeto", render: (c) => <span className="text-ink-700">{c.object}</span> },
                  { header: "Categoria", render: (c) => <span className="text-ink-500">{c.category}</span> },
                  { header: "Valor atual", align: "right", render: (c) => <span className="tabular-nums">{fmtBRLCompact(c.currentValue)}</span> },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="space-y-8 lg:col-span-2">
          <div className="card flex flex-col items-center p-6 text-center">
            <span className="data-label">Fiscaliza Score</span>
            <div className="mt-4">
              <ScoreDial score={muni.fiscalizaScore} />
            </div>
            <div className="mt-3">
              <ScoreBadge score={muni.fiscalizaScore} />
            </div>
            <p className="mt-3 text-xs text-ink-500">
              O score representa apenas o grau de anomalia encontrado nos dados disponíveis — não representa crime ou
              corrupção. Ver <Link href="/metodologia" className="text-signal-blue hover:underline">metodologia</Link>.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900">Como o score foi calculado</h2>
            <div className="mt-4">
              <ScoreFactorList breakdown={breakdown} />
            </div>
          </div>

          {signals.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-navy-900">Pontos de atenção identificados</h2>
              <div className="mt-4 space-y-4">
                {signals.slice(0, 4).map((s) => (
                  <SignalCard key={s.id} signal={s} />
                ))}
              </div>
            </div>
          )}
        </div>
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
