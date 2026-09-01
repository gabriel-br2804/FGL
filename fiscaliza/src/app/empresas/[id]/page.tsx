import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCompany,
  getCompanyScore,
  getCompanySignals,
  contractsForCompany,
  getMunicipality,
  getAgency,
  listCompanies,
} from "@/lib/data";
import { ScoreBadge, ScoreDial } from "@/components/ScoreBadge";
import { StatCard } from "@/components/StatCard";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { ScoreFactorList } from "@/components/ScoreFactorList";
import { SignalCard } from "@/components/SignalCard";
import { MonitorButton } from "@/components/MonitorButton";
import { DataTable } from "@/components/DataTable";
import { NetworkGraph } from "@/components/NetworkGraph";
import { fmtBRL, fmtBRLCompact, fmtDate, fmtNumber } from "@/lib/engine/format";

export function generateStaticParams() {
  return listCompanies().map((c) => ({ id: c.id }));
}

export default function CompanyPage({ params }: { params: { id: string } }) {
  const company = getCompany(params.id);
  if (!company) notFound();
  const breakdown = getCompanyScore(company.id)!;
  const signals = getCompanySignals(company.id);
  const contracts = contractsForCompany(company.id);
  const hqMuni = getMunicipality(company.municipalityId);

  const agencyIds = Array.from(new Set(contracts.map((c) => c.agencyId)));
  const municipalityIds = Array.from(new Set(contracts.map((c) => c.municipalityId)));

  const graphColumns = [
    { title: "Empresa", nodes: [{ id: company.id, label: company.name, sublabel: company.cnpj }] },
    {
      title: "Sócios",
      nodes: company.partners.map((p) => ({ id: p.personId, label: p.name, sublabel: p.role })),
    },
    {
      title: "Órgãos contratantes",
      nodes: agencyIds.slice(0, 6).map((id) => ({ id, label: getAgency(id)?.name ?? id })),
    },
    {
      title: "Municípios",
      nodes: municipalityIds.slice(0, 6).map((id) => ({
        id,
        label: getMunicipality(id)?.name ?? id,
        sublabel: getMunicipality(id)?.stateId,
        href: `/municipios/${id}`,
      })),
    },
  ];

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="section-label">Empresa</span>
            {company.source === "pncp" ? (
              <span className="badge bg-signal-greenBg text-signal-green">Dado real · PNCP</span>
            ) : (
              <span className="badge bg-ink-900/5 text-ink-500">Dado simulado (MVP)</span>
            )}
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">{company.name}</h1>
          <dl className="mt-3 grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-ink-600 sm:grid-cols-4">
            <div>
              <dt className="text-ink-400">CNPJ</dt>
              <dd className="font-mono">{company.cnpj}</dd>
            </div>
            <div>
              <dt className="text-ink-400">Status</dt>
              <dd>{company.status}</dd>
            </div>
            <div>
              <dt className="text-ink-400">Data de abertura</dt>
              <dd>{company.openedAtKnown === false ? "Não disponível nesta fonte" : fmtDate(company.openedAt)}</dd>
            </div>
            <div>
              <dt className="text-ink-400">Município (sede)</dt>
              <dd>
                {hqMuni ? (
                  <Link href={`/municipios/${hqMuni.id}`} className="text-signal-blue hover:underline">
                    {hqMuni.name} — {hqMuni.stateId}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>
          <p className="mt-2 max-w-xl text-sm text-ink-600">{company.economicActivity}</p>
        </div>
        <MonitorButton targetId={`company:${company.id}`} label={company.name.split(" ")[0]} />
      </div>

      <div className="mt-8">
        <span className="data-label">Relação com dinheiro público</span>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard value={fmtBRLCompact(company.totalContracted)} label="Total contratado" />
          <StatCard value={fmtNumber(company.contractsCount)} label="Contratos" />
          <StatCard value={fmtNumber(company.contractingAgenciesCount)} label="Órgãos contratantes" />
          <StatCard value={fmtNumber(company.municipalitiesCount)} label="Municípios" />
        </div>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-5">
        <div className="space-y-8 lg:col-span-3">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-navy-900">Contratos recorrentes ao longo do tempo</h2>
            <p className="mt-1 text-sm text-ink-500">Valor total contratado por ano.</p>
            <div className="mt-4">
              <TrendLineChart data={company.yearlyContracted} color="#1D5FD6" />
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold text-navy-900">Empresas relacionadas</h2>
            <p className="mt-1 text-sm text-ink-500">Sócios, órgãos contratantes e municípios atendidos.</p>
            <div className="mt-5">
              <NetworkGraph columns={graphColumns} />
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold text-navy-900">Contratos</h2>
            <div className="mt-4">
              <DataTable
                keyFor={(c) => c.id}
                rows={[...contracts].sort((a, b) => b.currentValue - a.currentValue).slice(0, 12)}
                columns={[
                  {
                    header: "Contrato",
                    render: (c) => (
                      <Link href={`/contratos/${c.id}`} className="font-medium text-ink-900 hover:text-signal-blue">
                        {c.number}
                      </Link>
                    ),
                  },
                  {
                    header: "Município",
                    render: (c) => (
                      <Link href={`/municipios/${c.municipalityId}`} className="text-ink-700 hover:text-signal-blue">
                        {getMunicipality(c.municipalityId)?.name}
                      </Link>
                    ),
                  },
                  { header: "Objeto", render: (c) => <span className="text-ink-500">{c.object}</span> },
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
              <ScoreDial score={company.fiscalizaScore} />
            </div>
            <div className="mt-3">
              <ScoreBadge score={company.fiscalizaScore} />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900">Por que o score foi calculado assim</h2>
            <p className="mt-1 text-sm text-ink-500">
              Cada fator abaixo contribui com uma parte do score. Nenhum fator, isoladamente, indica irregularidade.
            </p>
            <div className="mt-4">
              <ScoreFactorList breakdown={breakdown} />
            </div>
          </div>

          {signals.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-navy-900">Pontos de atenção identificados</h2>
              <div className="mt-4 space-y-4">
                {signals.slice(0, 5).map((s) => (
                  <SignalCard key={s.id} signal={s} />
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl2 border border-signal-blue/20 bg-signal-blue/5 p-5 text-xs text-ink-700">
            Os indicadores acima são análises automatizadas baseadas em dados públicos e não constituem acusação,
            prova de irregularidade ou conclusão sobre responsabilidade civil ou criminal.
          </div>
        </div>
      </div>
    </div>
  );
}
