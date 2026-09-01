import { ScoreBadge } from "./ScoreBadge";
import { fmtBRLCompact } from "@/lib/engine/format";
import type { RealStateGovernance, SecretariaDetail } from "@/lib/data";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function GovernanceSection({
  governance,
  secretarias,
  stateName,
}: {
  governance?: RealStateGovernance;
  secretarias: SecretariaDetail[];
  stateName: string;
}) {
  const governor = governance?.governor;

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-navy-900">Governo do estado</h2>
        <span className="badge bg-ink-900/5 text-[10px] text-ink-500">Pesquisado manualmente · fonte por item</span>
      </div>

      <div className="mt-5 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-navy-800 text-lg font-bold text-white">
          {governor?.name ? initials(governor.name) : "?"}
        </div>
        <div className="min-w-0">
          {governor?.name ? (
            <>
              <div className="font-semibold text-ink-900">{governor.name}</div>
              <div className="text-xs text-ink-500">
                {governor.party ?? "Partido não informado"} · Governador(a) de {stateName}
              </div>
              {governor.sourceUrl && (
                <a
                  href={governor.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-signal-blue hover:underline"
                >
                  Ver fonte oficial ↗
                </a>
              )}
            </>
          ) : (
            <div className="text-sm text-ink-500">Governador(a) ainda não confirmado(a) nesta base.</div>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs text-ink-500">
        O Fiscaliza Score de cada secretaria abaixo é calculado a partir dos contratos reais/simulados do estado
        classificados nessa área de gasto — o nome do(a) secretário(a) é só identificação, não entra no cálculo.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {secretarias.map((s) => (
          <div key={s.area} className="rounded-xl2 border border-base-border p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ink-900">{s.label}</div>
                <div className="truncate text-xs text-ink-500">{s.name ?? "Secretário(a) não confirmado(a)"}</div>
              </div>
              <ScoreBadge score={s.score.total} size="sm" />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-ink-500">
              <span className="tabular-nums">
                {fmtBRLCompact(s.totalSpent)} · {s.contractsCount} contrato(s)
              </span>
              {s.sourceUrl && (
                <a href={s.sourceUrl} target="_blank" rel="noreferrer" className="font-medium text-signal-blue hover:underline">
                  Fonte ↗
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OfficialPortalsCard({ governance }: { governance?: RealStateGovernance }) {
  if (!governance) return null;
  const items = [
    { label: "Portal de Transparência do estado", portal: governance.statePortal },
    { label: `Portal de Transparência — ${governance.capital.name ?? "capital"}`, portal: governance.capital.portal },
  ];

  return (
    <div className="card p-6">
      <h2 className="text-lg font-bold text-navy-900">Portais oficiais</h2>
      <p className="mt-1 text-xs text-ink-500">
        Acesso direto ao site oficial — o Fiscaliza ainda não importa dados automaticamente destes portais.
      </p>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
            <div className="min-w-0">
              <div className="truncate font-medium text-ink-900">{item.label}</div>
              {item.portal.type && <div className="text-xs text-ink-500">{item.portal.type}</div>}
            </div>
            {item.portal.url ? (
              <a
                href={item.portal.url}
                target="_blank"
                rel="noreferrer"
                className="badge shrink-0 bg-signal-blue/10 text-signal-blue"
              >
                Abrir ↗
              </a>
            ) : (
              <span className="badge shrink-0 bg-ink-900/5 text-ink-500">Não encontrado</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
