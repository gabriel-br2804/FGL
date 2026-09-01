import type { RealStateGovernance } from "@/lib/data";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function LeaderCard({
  name,
  party,
  sourceUrl,
  role,
  place,
  fallback,
}: {
  name: string | null | undefined;
  party: string | null | undefined;
  sourceUrl: string | null | undefined;
  role: string;
  place: string;
  fallback: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-navy-800 text-lg font-bold text-white">
        {name ? initials(name) : "?"}
      </div>
      <div className="min-w-0">
        {name ? (
          <>
            <div className="font-semibold text-ink-900">{name}</div>
            <div className="text-xs text-ink-500">
              {party ?? "Partido não informado"} · {role} de {place}
            </div>
            {sourceUrl && (
              <a href={sourceUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-signal-blue hover:underline">
                Ver fonte oficial ↗
              </a>
            )}
          </>
        ) : (
          <div className="text-sm text-ink-500">{fallback}</div>
        )}
      </div>
    </div>
  );
}

export function GovernanceSection({ governance, stateName }: { governance?: RealStateGovernance; stateName: string }) {
  const governor = governance?.governor;
  const mayor = governance?.capital.mayor;
  const capitalName = governance?.capital.name;

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-navy-900">Governo do estado</h2>
        <span className="badge bg-ink-900/5 text-[10px] text-ink-500">Pesquisado manualmente · fonte por item</span>
      </div>

      <div className="mt-5 grid gap-6 sm:grid-cols-2">
        <LeaderCard
          name={governor?.name}
          party={governor?.party}
          sourceUrl={governor?.sourceUrl}
          role="Governador(a)"
          place={stateName}
          fallback="Governador(a) ainda não confirmado(a) nesta base."
        />
        <LeaderCard
          name={mayor?.name}
          party={mayor?.party}
          sourceUrl={mayor?.sourceUrl}
          role="Prefeito(a)"
          place={capitalName ?? "capital"}
          fallback={capitalName ? `Prefeito(a) de ${capitalName} ainda não confirmado(a) nesta base.` : "Prefeito(a) da capital ainda não confirmado(a) nesta base."}
        />
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
