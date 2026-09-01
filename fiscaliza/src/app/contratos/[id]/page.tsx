import Link from "next/link";
import { notFound } from "next/navigation";
import { getContract, getCompany, getMunicipality, getAgency, getBid, listContracts } from "@/lib/data";
import { Timeline } from "@/components/Timeline";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { fmtBRL, fmtBRLCompact, fmtDate, fmtPercent } from "@/lib/engine/format";

export function generateStaticParams() {
  return listContracts().map((c) => ({ id: c.id }));
}

export default function ContractPage({ params }: { params: { id: string } }) {
  const contract = getContract(params.id);
  if (!contract) notFound();
  const company = getCompany(contract.companyId)!;
  const municipality = getMunicipality(contract.municipalityId)!;
  const agency = getAgency(contract.agencyId)!;
  const bid = getBid(contract.bidId);
  const growth = (contract.currentValue - contract.originalValue) / contract.originalValue;
  const pctVsMedian = contract.medianComparable > 0 ? (contract.currentValue - contract.medianComparable) / contract.medianComparable : 0;

  const steps = [
    { label: "Licitação", date: bid ? fmtDate(bid.openedAt) : undefined, description: bid ? `${bid.modality} — ${bid.participants} participante(s)` : "Contratação direta", state: "done" as const },
    { label: "Contratação", date: fmtDate(contract.signedAt), description: `Contrato nº ${contract.number}`, state: "done" as const },
    { label: "Início da execução", date: fmtDate(contract.signedAt), state: "done" as const },
    { label: "Pagamentos", description: `${contract.payments.length} pagamento(s) registrados`, state: contract.payments.length > 0 ? ("done" as const) : ("pending" as const) },
    {
      label: "Aditivos",
      description: contract.amendments.length > 0 ? `${contract.amendments.length} termo(s) aditivo(s)` : "Nenhum aditivo registrado",
      state: contract.amendments.length > 0 ? ("alert" as const) : ("pending" as const),
    },
    {
      label: contract.status === "Vigente" ? "Em andamento" : "Conclusão",
      date: fmtDate(contract.deadline),
      state: contract.status === "Encerrado" ? ("done" as const) : contract.status === "Vigente" ? ("current" as const) : ("alert" as const),
    },
  ];

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="flex items-center gap-2">
        <span className="section-label">Contrato</span>
        {contract.source === "pncp" ? (
          <span className="badge bg-signal-greenBg text-signal-green">Dado real · PNCP</span>
        ) : (
          <span className="badge bg-ink-900/5 text-ink-500">Dado simulado (MVP)</span>
        )}
      </div>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
        Contrato nº {contract.number}
      </h1>
      <p className="mt-2 max-w-2xl text-ink-700">{contract.object}</p>

      <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-ink-400">Órgão</dt>
          <dd className="font-medium text-ink-900">{agency.name}</dd>
        </div>
        <div>
          <dt className="text-ink-400">Fornecedor</dt>
          <dd>
            <Link href={`/empresas/${company.id}`} className="font-medium text-signal-blue hover:underline">
              {company.name}
            </Link>
          </dd>
        </div>
        <div>
          <dt className="text-ink-400">Município</dt>
          <dd>
            <Link href={`/municipios/${municipality.id}`} className="font-medium text-signal-blue hover:underline">
              {municipality.name} — {municipality.stateId}
            </Link>
          </dd>
        </div>
        <div>
          <dt className="text-ink-400">Categoria</dt>
          <dd className="font-medium text-ink-900">{contract.category}</dd>
        </div>
      </dl>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard value={fmtBRLCompact(contract.originalValue)} label="Valor original" />
        <StatCard value={fmtBRLCompact(contract.currentValue)} label="Valor atual" accent={growth > 0.3 ? "amber" : "navy"} />
        <StatCard value={fmtDate(contract.signedAt)} label="Assinatura" />
        <StatCard value={fmtDate(contract.deadline)} label="Prazo" />
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-5">
        <div className="space-y-8 lg:col-span-3">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-navy-900">Linha do tempo</h2>
            <div className="mt-6">
              <Timeline steps={steps} />
            </div>
          </div>

          {contract.amendments.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-navy-900">Aditivos contratuais</h2>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs text-ink-500">Valor inicial</div>
                  <div className="text-lg font-bold text-navy-900">{fmtBRL(contract.originalValue)}</div>
                </div>
                <div>
                  <div className="text-xs text-ink-500">Valor após aditivos</div>
                  <div className="text-lg font-bold text-navy-900">{fmtBRL(contract.currentValue)}</div>
                </div>
                <div>
                  <div className="text-xs text-ink-500">Aumento</div>
                  <div className={`text-lg font-bold ${growth > 0.3 ? "text-signal-amber" : "text-ink-900"}`}>{fmtPercent(growth)}</div>
                </div>
              </div>
              <div className="mt-6">
                <Timeline
                  steps={contract.amendments.map((a, i) => ({
                    label: `Termo aditivo nº ${a.number}`,
                    date: fmtDate(a.date),
                    description: `${fmtBRL(a.previousValue)} → ${fmtBRL(a.newValue)} — ${a.reason}`,
                    state: "alert" as const,
                  }))}
                />
              </div>
            </div>
          )}

          <div className="card p-6">
            <h2 className="text-lg font-bold text-navy-900">Pagamentos</h2>
            <div className="mt-4">
              <DataTable
                keyFor={(p) => p.id}
                rows={contract.payments}
                columns={[
                  { header: "Data", render: (p) => fmtDate(p.date) },
                  { header: "Descrição", render: (p) => <span className="text-ink-700">{p.description}</span> },
                  { header: "Valor", align: "right", render: (p) => <span className="tabular-nums">{fmtBRL(p.value)}</span> },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {contract.medianComparable > 0 && (
            <div className="card p-6">
              <span className="data-label">Análise de preço</span>
              <div className="mt-3 space-y-2 text-sm">
                <div>
                  <div className="text-ink-400">Dado</div>
                  <div className="text-ink-900">Valor atual do contrato: {fmtBRL(contract.currentValue)}</div>
                </div>
                <div>
                  <div className="text-ink-400">Análise</div>
                  <div className="text-ink-700">
                    Mediana encontrada para contratos semelhantes ({contract.category}): {fmtBRL(contract.medianComparable)} (
                    {fmtPercent(pctVsMedian)}).
                  </div>
                </div>
                {pctVsMedian > 0.2 && (
                  <div>
                    <div className="text-ink-400">Interpretação</div>
                    <div className="text-ink-700">
                      Ponto de atenção: esse padrão merece análise adicional e não representa, isoladamente, prova de
                      irregularidade.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {bid && (
            <div className="card p-6">
              <span className="data-label">Licitação</span>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-500">Modalidade</dt>
                  <dd className="font-medium text-ink-900">{bid.modality}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-500">Participantes</dt>
                  <dd className="font-medium text-ink-900">{bid.participants}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-500">Propostas</dt>
                  <dd className="font-medium text-ink-900">{bid.proposals}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-500">Valor estimado</dt>
                  <dd className="font-medium text-ink-900">{fmtBRLCompact(bid.estimatedValue)}</dd>
                </div>
              </dl>
              {(bid.participants <= 1 || bid.proposals <= 1) && (
                <p className="mt-3 text-xs text-signal-amber">
                  Ponto de atenção: licitação com participação reduzida. Isso não constitui, por si só, prova de
                  irregularidade.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
