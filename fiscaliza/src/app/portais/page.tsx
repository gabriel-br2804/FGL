import Link from "next/link";
import { listStates, getStateGovernance } from "@/lib/data";
import { REAL_GOVERNANCE } from "@/lib/data/real-data";
import { fmtDate } from "@/lib/engine/format";

export const metadata = { title: "Portais de Transparência — Fiscaliza" };

function PortalBadge({ url, type }: { url: string | null; type: string | null }) {
  if (!url) return <span className="badge shrink-0 bg-ink-900/5 text-ink-500">Não encontrado</span>;
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {type && <span className="badge shrink-0 bg-ink-900/5 text-[11px] text-ink-500">{type}</span>}
      <a href={url} target="_blank" rel="noreferrer" className="badge shrink-0 bg-signal-blue/10 text-signal-blue">
        Abrir ↗
      </a>
    </div>
  );
}

export default function PortaisPage() {
  const states = [...listStates()].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="container-page py-10 sm:py-14">
      <span className="section-label">Diretório</span>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
        Portais de transparência de estados e capitais
      </h1>
      <p className="mt-4 max-w-2xl text-ink-700">
        Acesso direto às fontes oficiais dos 27 estados e suas capitais — governador, secretariado e o portal de
        transparência de cada um. São links para os sites oficiais, pesquisados manualmente com fonte citada por
        item; o Fiscaliza ainda não importa dados automaticamente da maioria deles (diferente do IBGE e do PNCP, que
        alimentam o resto do app via <code className="font-mono text-xs">npm run ingest</code>).
      </p>
      {REAL_GOVERNANCE.asOf && (
        <p className="mt-2 text-xs text-ink-500">Pesquisa mais recente: {fmtDate(REAL_GOVERNANCE.asOf)}.</p>
      )}

      <div className="mt-8 overflow-x-auto rounded-xl2 border border-base-border">
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className="border-b border-base-border bg-ink-900/[0.02] text-left text-xs uppercase tracking-wide text-ink-500">
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Governador(a)</th>
              <th className="px-4 py-3 font-semibold text-right">Portal do estado</th>
              <th className="px-4 py-3 font-semibold">Capital</th>
              <th className="px-4 py-3 font-semibold text-right">Portal da capital</th>
            </tr>
          </thead>
          <tbody>
            {states.map((state) => {
              const gov = getStateGovernance(state.id);
              return (
                <tr key={state.id} className="border-b border-base-border last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/estados/${state.id.toLowerCase()}`} className="font-medium text-ink-900 hover:text-signal-blue">
                      {state.name}
                    </Link>
                    <span className="ml-1 text-xs text-ink-400">{state.id}</span>
                  </td>
                  <td className="px-4 py-3 text-ink-700">
                    {gov?.governor.name ? (
                      <>
                        {gov.governor.name}
                        {gov.governor.party && <span className="text-xs text-ink-400"> · {gov.governor.party}</span>}
                      </>
                    ) : (
                      <span className="text-ink-400">Não confirmado</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <PortalBadge url={gov?.statePortal.url ?? null} type={gov?.statePortal.type ?? null} />
                  </td>
                  <td className="px-4 py-3 text-ink-700">{gov?.capital.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <PortalBadge url={gov?.capital.portal.url ?? null} type={gov?.capital.portal.type ?? null} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8 rounded-xl2 border border-signal-amber/30 bg-signal-amberBg p-6 text-sm text-ink-900">
        <strong>Sobre esta lista:</strong> {REAL_GOVERNANCE.disclaimer}
      </div>
    </div>
  );
}
