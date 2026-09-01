import Link from "next/link";
import { StatCard } from "@/components/StatCard";
import { ScoreBadge } from "@/components/ScoreBadge";
import { DataTable } from "@/components/DataTable";
import { getDashboardStats, getMunicipalityRanking, getTopCompaniesByScore, listDataSources } from "@/lib/data";
import { fmtBRLCompact, fmtDate, fmtNumber } from "@/lib/engine/format";
import { ImpostometroCard } from "@/components/ImpostometroCard";

export const metadata = { title: "Dashboard — Fiscaliza" };

export default function DashboardPage() {
  const stats = getDashboardStats();
  const ranking = getMunicipalityRanking(12);
  const topCompanies = getTopCompaniesByScore(8);
  const sources = listDataSources();

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="section-label">Painel de inteligência pública</span>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">Dashboard</h1>
        </div>
        <div className="text-sm text-ink-500">Dados atualizados em: {fmtDate(stats.lastUpdate + "T00:00:00")}</div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard value={fmtBRLCompact(stats.totalAnalyzed)} label="em gastos analisados" />
        <StatCard value={fmtNumber(stats.totalContracts)} label="de contratos" />
        <StatCard value={fmtNumber(stats.totalSuppliers)} label="de fornecedores" />
        <StatCard value={fmtNumber(stats.totalAttentionPoints)} label="pontos de atenção identificados" accent="amber" />
        <StatCard value={fmtNumber(stats.totalAgencies)} label="órgãos monitorados" />
      </div>

      <div className="mt-8">
        <ImpostometroCard />
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy-900">Municípios com mais pontos de atenção</h2>
            <Link href="/municipios" className="text-sm font-medium text-signal-blue hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="mt-4">
            <DataTable
              keyFor={(m) => m.id}
              rows={ranking}
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
                {
                  header: "Valor analisado",
                  align: "right",
                  render: (m) => <span className="tabular-nums">{fmtBRLCompact(m.totalSpent)}</span>,
                },
                {
                  header: "Pontos de atenção",
                  align: "right",
                  render: (m) => <span className="tabular-nums">{m.attentionPoints}</span>,
                },
                { header: "Score", align: "right", render: (m) => <ScoreBadge score={m.fiscalizaScore} size="sm" /> },
              ]}
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy-900">Empresas com maior Fiscaliza Score</h2>
            <Link href="/empresas" className="text-sm font-medium text-signal-blue hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {topCompanies.map((c) => (
              <Link
                key={c.id}
                href={`/empresas/${c.id}`}
                className="flex items-center justify-between gap-3 rounded-xl2 border border-base-border bg-white px-4 py-3 hover:border-navy-700"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-ink-900">{c.name}</div>
                  <div className="truncate text-xs text-ink-500">{fmtBRLCompact(c.totalContracted)} contratados</div>
                </div>
                <ScoreBadge score={c.fiscalizaScore} size="sm" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-14 card p-6">
        <h2 className="text-lg font-bold text-navy-900">Fontes conectadas</h2>
        <p className="mt-1 text-sm text-ink-500">
          Conectores modulares por fonte oficial — ver detalhes em <Link href="/fontes" className="text-signal-blue hover:underline">Fontes de dados</Link>.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sources.map((s) => (
            <div key={s.id} className="rounded-xl2 border border-base-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink-900">{s.name}</span>
                {s.simulated && <span className="badge bg-signal-amberBg text-signal-amber">Simulado</span>}
              </div>
              <div className="mt-1 font-mono text-xs text-ink-500">{s.connector}</div>
              <div className="mt-2 text-xs text-ink-500">Última sincronização: {fmtDate(s.lastSync)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
