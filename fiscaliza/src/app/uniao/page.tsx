import Link from "next/link";
import { getUniaoDetail, listStateAggregates } from "@/lib/data";
import { ScoreBadge, ScoreDial } from "@/components/ScoreBadge";
import { StatCard } from "@/components/StatCard";
import { AreaBarChart } from "@/components/charts/AreaBarChart";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { ConcentrationBars } from "@/components/ConcentrationBars";
import { ScoreFactorList } from "@/components/ScoreFactorList";
import { DataTable } from "@/components/DataTable";
import { MonitorButton } from "@/components/MonitorButton";
import { ImpostometroCard } from "@/components/ImpostometroCard";
import { fmtBRLCompact, fmtNumber } from "@/lib/engine/format";

export const metadata = { title: "União — Fiscaliza" };

export default function UniaoPage() {
  const detail = getUniaoDetail();
  const contractedTotal = detail.contracts.reduce((s, c) => s + c.currentValue, 0);
  const stateRanking = [...listStateAggregates()].sort((a, b) => b.attentionPoints - a.attentionPoints).slice(0, 12);

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="section-label">União</span>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">Governo Federal</h1>
          <p className="mt-1 text-sm text-ink-500">
            Visão consolidada de {detail.statesCount} estado(s) e {detail.municipalitiesCount} município(s)
            monitorados.
          </p>
        </div>
        <MonitorButton targetId="state:uniao" label="União" />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard value={fmtBRLCompact(detail.totalSpent)} label="Gastos analisados (nacional)" />
        <StatCard value={fmtNumber(detail.totalContracts)} label="Contratos" />
        <StatCard value={fmtNumber(detail.totalSuppliers)} label="Fornecedores" />
        <StatCard value={fmtNumber(detail.attentionPoints)} label="Pontos de atenção" accent="amber" />
        <StatCard value={fmtNumber(detail.statesCount)} label="Estados monitorados" />
      </div>

      <div className="mt-8">
        <ImpostometroCard />
      </div>

      {detail.realFederal.count > 0 && (
        <div className="mt-6 rounded-xl2 bg-signal-greenBg p-4 text-sm text-signal-green">
          <strong>{fmtNumber(detail.realFederal.count)}</strong> contrato(s) federais reais identificados
          ({fmtBRLCompact(detail.realFederal.totalValue)}) — {detail.realFederal.pncpCount} via PNCP
          {detail.realFederal.portalTransparenciaCount > 0
            ? ` e ${detail.realFederal.portalTransparenciaCount} via Portal da Transparência`
            : ""}
          .
        </div>
      )}

      {detail.realFederalBids.count > 0 && (
        <div className="mt-4 rounded-xl2 bg-signal-greenBg p-4 text-sm text-signal-green">
          <strong>{fmtNumber(detail.realFederalBids.count)}</strong> licitação(ões) federais reais identificadas (Portal
          da Transparência)
          {detail.realFederalBids.withParticipantsCount > 0
            ? ` — ${detail.realFederalBids.withParticipantsCount} com nº real de participantes (média de ${detail.realFederalBids.avgParticipants?.toFixed(1)}, ${detail.realFederalBids.lowCompetitionCount} com apenas 1 participante).`
            : "."}
        </div>
      )}

      <div className="mt-12 grid gap-8 lg:grid-cols-5">
        <div className="space-y-8 lg:col-span-3">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-navy-900">Onde o Brasil está investindo</h2>
            <p className="mt-1 text-sm text-ink-500">
              Soma dos gastos por área de todos os municípios monitorados no país.
            </p>
            <div className="mt-4">
              <AreaBarChart data={detail.spendingByArea} />
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold text-navy-900">Evolução dos gastos nacionais</h2>
            <div className="mt-4">
              <TrendLineChart data={detail.spendingHistory} />
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold text-navy-900">Principais fornecedores do país</h2>
            <p className="mt-1 text-sm text-ink-500">Ranking por valor total recebido em todos os municípios monitorados.</p>
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
              <h2 className="text-lg font-bold text-navy-900">Estados com mais pontos de atenção</h2>
              <Link href="/mapa" className="text-sm font-medium text-signal-blue hover:underline">
                Ver mapa completo
              </Link>
            </div>
            <div className="mt-4">
              <DataTable
                keyFor={(s) => s.state.id}
                rows={stateRanking}
                columns={[
                  {
                    header: "Estado",
                    render: (s) => (
                      <Link href={`/estados/${s.state.id.toLowerCase()}`} className="font-medium text-ink-900 hover:text-signal-blue">
                        {s.state.name}
                      </Link>
                    ),
                  },
                  { header: "Gasto analisado", align: "right", render: (s) => <span className="tabular-nums">{fmtBRLCompact(s.totalSpent)}</span> },
                  { header: "Pontos de atenção", align: "right", render: (s) => <span className="tabular-nums">{s.attentionPoints}</span> },
                  { header: "Score médio", align: "right", render: (s) => <ScoreBadge score={s.avgScore} size="sm" /> },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="space-y-8 lg:col-span-2">
          <div className="card flex flex-col items-center p-6 text-center">
            <span className="data-label">Fiscaliza Score nacional</span>
            <div className="mt-4">
              <ScoreDial score={detail.score.total} />
            </div>
            <div className="mt-3">
              <ScoreBadge score={detail.score.total} />
            </div>
            <p className="mt-3 text-xs text-ink-500">
              Calculado sobre o conjunto de contratos de todos os municípios monitorados no país. Não representa
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
