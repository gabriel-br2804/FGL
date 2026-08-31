import Link from "next/link";
import { notFound } from "next/navigation";
import { getStateDetail, listStates } from "@/lib/data";
import { ScoreBadge, ScoreDial } from "@/components/ScoreBadge";
import { StatCard } from "@/components/StatCard";
import { AreaBarChart } from "@/components/charts/AreaBarChart";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { ConcentrationBars } from "@/components/ConcentrationBars";
import { ScoreFactorList } from "@/components/ScoreFactorList";
import { DataTable } from "@/components/DataTable";
import { MonitorButton } from "@/components/MonitorButton";
import { fmtBRLCompact, fmtNumber } from "@/lib/engine/format";

export function generateStaticParams() {
  return listStates().map((s) => ({ uf: s.id.toLowerCase() }));
}

const STATUS_STYLE: Record<string, string> = {
  Concluída: "bg-signal-greenBg text-signal-green",
  "Em execução": "bg-signal-blue/10 text-signal-blue",
  Atrasada: "bg-signal-amberBg text-signal-amber",
  Paralisada: "bg-signal-redBg text-signal-red",
  Planejada: "bg-ink-900/5 text-ink-700",
};

export default function StatePage({ params }: { params: { uf: string } }) {
  const detail = getStateDetail(params.uf);
  if (!detail) notFound();

  const contractedTotal = detail.contracts.reduce((s, c) => s + c.currentValue, 0);

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="section-label">Estado</span>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
            {detail.state.name} — {detail.state.id}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Região {detail.state.region} · {detail.municipalities.length} município(s) monitorado(s)
          </p>
        </div>
        <MonitorButton targetId={`state:${detail.state.id}`} label={detail.state.name} />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard value={fmtNumber(detail.state.population)} label="População" />
        <StatCard value={fmtBRLCompact(detail.totalSpent)} label="Gastos analisados" />
        <StatCard value={fmtNumber(detail.totalContracts)} label="Contratos" />
        <StatCard value={fmtNumber(detail.totalSuppliers)} label="Fornecedores" />
        <StatCard value={fmtNumber(detail.attentionPoints)} label="Pontos de atenção" accent="amber" />
      </div>

      {detail.realStateContracts.count > 0 && (
        <div className="mt-4 rounded-xl2 bg-signal-greenBg p-4 text-sm text-signal-green">
          <strong>{fmtNumber(detail.realStateContracts.count)}</strong> contrato(s) estaduais reais (PNCP)
          identificados, {fmtBRLCompact(detail.realStateContracts.totalValue)} — sem município associado, por isso não
          entram na lista de contratos abaixo (que é por município).
        </div>
      )}

      <div className="mt-12 grid gap-8 lg:grid-cols-5">
        <div className="space-y-8 lg:col-span-3">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-navy-900">Onde o estado está investindo</h2>
            <p className="mt-1 text-sm text-ink-500">
              Soma dos gastos por área de todos os municípios monitorados nesta UF.
            </p>
            <div className="mt-4">
              <AreaBarChart data={detail.spendingByArea} />
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold text-navy-900">Evolução dos gastos</h2>
            <div className="mt-4">
              <TrendLineChart data={detail.spendingHistory} />
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold text-navy-900">Principais fornecedores do estado</h2>
            <p className="mt-1 text-sm text-ink-500">Ranking por valor total recebido em todos os municípios da UF.</p>
            <div className="mt-4">
              <ConcentrationBars
                items={detail.topSuppliers.map((s) => ({
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
              <h2 className="text-lg font-bold text-navy-900">Municípios monitorados</h2>
              <Link href="/municipios" className="text-sm font-medium text-signal-blue hover:underline">
                Ver todos os municípios
              </Link>
            </div>
            <div className="mt-4">
              <DataTable
                keyFor={(m) => m.id}
                rows={[...detail.municipalities].sort((a, b) => b.attentionPoints - a.attentionPoints)}
                columns={[
                  {
                    header: "Município",
                    render: (m) => (
                      <Link href={`/municipios/${m.id}`} className="font-medium text-ink-900 hover:text-signal-blue">
                        {m.name}
                      </Link>
                    ),
                  },
                  { header: "Gasto analisado", align: "right", render: (m) => <span className="tabular-nums">{fmtBRLCompact(m.totalSpent)}</span> },
                  { header: "Pontos de atenção", align: "right", render: (m) => <span className="tabular-nums">{m.attentionPoints}</span> },
                  { header: "Score", align: "right", render: (m) => <ScoreBadge score={m.fiscalizaScore} size="sm" /> },
                ]}
              />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-navy-900">Obras no estado</h2>
              <Link href={`/obras`} className="text-sm font-medium text-signal-blue hover:underline">
                Ver todas ({detail.projects.length})
              </Link>
            </div>
            <div className="mt-4">
              <DataTable
                keyFor={(p) => p.id}
                rows={[...detail.projects].sort((a, b) => b.currentValue - a.currentValue).slice(0, 8)}
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
                  { header: "Situação", render: (p) => <span className={`badge ${STATUS_STYLE[p.status] ?? "bg-ink-900/5 text-ink-700"}`}>{p.status}</span> },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="space-y-8 lg:col-span-2">
          <div className="card flex flex-col items-center p-6 text-center">
            <span className="data-label">Fiscaliza Score do estado</span>
            <div className="mt-4">
              <ScoreDial score={detail.score.total} />
            </div>
            <div className="mt-3">
              <ScoreBadge score={detail.score.total} />
            </div>
            <p className="mt-3 text-xs text-ink-500">
              Calculado sobre o conjunto de contratos de todos os municípios monitorados nesta UF. Não representa
              crime ou corrupção. Ver <Link href="/metodologia" className="text-signal-blue hover:underline">metodologia</Link>.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900">Como o score foi calculado</h2>
            <div className="mt-4">
              <ScoreFactorList breakdown={detail.score} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
