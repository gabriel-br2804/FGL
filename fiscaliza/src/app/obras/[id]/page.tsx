import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, getCompany, getMunicipality, getAgency, getContract, listProjects } from "@/lib/data";
import { Timeline } from "@/components/Timeline";
import { StatCard } from "@/components/StatCard";
import { LocationPreview } from "@/components/LocationPreview";
import { DataTable } from "@/components/DataTable";
import { MonitorButton } from "@/components/MonitorButton";
import { fmtBRL, fmtBRLCompact, fmtDate, fmtPercent } from "@/lib/engine/format";

export function generateStaticParams() {
  return listProjects().map((p) => ({ id: p.id }));
}

const STATUS_STYLE: Record<string, string> = {
  Concluída: "bg-signal-greenBg text-signal-green",
  "Em execução": "bg-signal-blue/10 text-signal-blue",
  Atrasada: "bg-signal-amberBg text-signal-amber",
  Paralisada: "bg-signal-redBg text-signal-red",
  Planejada: "bg-ink-900/5 text-ink-700",
};

export default function ObraPage({ params }: { params: { id: string } }) {
  const project = getProject(params.id);
  if (!project) notFound();
  const company = getCompany(project.companyId)!;
  const municipality = getMunicipality(project.municipalityId)!;
  const agency = getAgency(project.agencyId)!;
  const contract = getContract(project.contractId)!;
  const growth = (project.currentValue - project.originalValue) / project.originalValue;

  const steps = [
    { label: "Licitação", date: fmtDate(contract.signedAt), state: "done" as const },
    { label: "Contratação", date: fmtDate(contract.signedAt), description: `Contrato nº ${contract.number}`, state: "done" as const },
    { label: "Início da obra", date: fmtDate(project.startedAt), state: "done" as const },
    {
      label: "Pagamentos",
      description: `${project.payments.length} pagamento(s) — total ${fmtBRLCompact(project.payments.reduce((s, p) => s + p.value, 0))}`,
      state: "done" as const,
    },
    {
      label: "Aditivos",
      description: contract.amendments.length > 0 ? `${contract.amendments.length} termo(s) aditivo(s)` : "Nenhum aditivo registrado",
      state: contract.amendments.length > 0 ? ("alert" as const) : ("pending" as const),
    },
    {
      label: project.status === "Concluída" ? "Conclusão" : "Situação atual",
      date: fmtDate(project.deadline),
      description: project.status,
      state:
        project.status === "Concluída"
          ? ("done" as const)
          : project.status === "Atrasada" || project.status === "Paralisada"
          ? ("alert" as const)
          : ("current" as const),
    },
  ];

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="section-label">Obra pública</span>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">{project.name}</h1>
          <div className="mt-3">
            <span className={`badge ${STATUS_STYLE[project.status]}`}>{project.status}</span>
          </div>
        </div>
        <MonitorButton targetId={`project:${project.id}`} label="obra" />
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-ink-400">Localização</dt>
          <dd>
            <Link href={`/municipios/${municipality.id}`} className="font-medium text-signal-blue hover:underline">
              {municipality.name} — {municipality.stateId}
            </Link>
          </dd>
        </div>
        <div>
          <dt className="text-ink-400">Órgão responsável</dt>
          <dd className="font-medium text-ink-900">{agency.name}</dd>
        </div>
        <div>
          <dt className="text-ink-400">Empresa contratada</dt>
          <dd>
            <Link href={`/empresas/${company.id}`} className="font-medium text-signal-blue hover:underline">
              {company.name}
            </Link>
          </dd>
        </div>
        <div>
          <dt className="text-ink-400">Prazo</dt>
          <dd className="font-medium text-ink-900">{fmtDate(project.deadline)}</dd>
        </div>
      </dl>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard value={fmtBRLCompact(project.originalValue)} label="Valor original" />
        <StatCard value={fmtBRLCompact(project.currentValue)} label="Valor atual" accent={growth > 0.2 ? "amber" : "navy"} />
        <StatCard value={project.executedPercent !== null ? `${project.executedPercent}%` : "—"} label="Percentual executado" />
        <StatCard value={fmtPercent(growth)} label="Variação por aditivos" accent={growth > 0.2 ? "amber" : "navy"} />
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-5">
        <div className="space-y-8 lg:col-span-3">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-navy-900">Linha do tempo</h2>
            <div className="mt-6">
              <Timeline steps={steps} />
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold text-navy-900">Pagamentos</h2>
            <div className="mt-4">
              <DataTable
                keyFor={(p) => `${p.date}-${p.idx}`}
                rows={project.payments.map((p, idx) => ({ ...p, idx }))}
                columns={[
                  { header: "Data", render: (p) => fmtDate(p.date) },
                  { header: "Valor", align: "right", render: (p) => <span className="tabular-nums">{fmtBRL(p.value)}</span> },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="card p-4">
            <LocationPreview lat={project.lat} lon={project.lon} label={municipality.name} />
          </div>

          {contract.amendments.length > 0 && (
            <div className="card p-6">
              <span className="data-label">Aditivos</span>
              <div className="mt-3 grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-xs text-ink-500">Valor inicial</div>
                  <div className="text-base font-bold text-navy-900">{fmtBRL(project.originalValue)}</div>
                </div>
                <div>
                  <div className="text-xs text-ink-500">Valor atual</div>
                  <div className="text-base font-bold text-navy-900">{fmtBRL(project.currentValue)}</div>
                </div>
              </div>
              <p className="mt-3 text-xs text-ink-500">
                Ver detalhamento completo dos termos aditivos em{" "}
                <Link href={`/contratos/${contract.id}`} className="text-signal-blue hover:underline">
                  Contrato nº {contract.number}
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
