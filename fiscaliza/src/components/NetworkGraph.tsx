import Link from "next/link";

export interface GraphNode {
  id: string;
  label: string;
  sublabel?: string;
  href?: string;
}

export interface GraphColumn {
  title: string;
  nodes: GraphNode[];
}

const COLORS = ["#0B1E3F", "#1D5FD6", "#0F9D6D", "#E8940C", "#5B6470"];

/**
 * Grafo de relações simplificado (empresa → sócios → contratos → órgãos →
 * municípios), renderizado como colunas conectadas. Não é um grafo de
 * força dinâmico — prioriza legibilidade e ausência de dependências
 * externas de renderização.
 */
export function NetworkGraph({ columns }: { columns: GraphColumn[] }) {
  return (
    <div className="scrollbar-thin overflow-x-auto">
      <div className="flex min-w-[720px] gap-6 pb-2">
        {columns.map((col, ci) => (
          <div key={ci} className="flex-1">
            <div className="data-label mb-3 text-center">{col.title}</div>
            <div className="space-y-2.5">
              {col.nodes.map((n) => {
                const color = COLORS[ci % COLORS.length];
                const content = (
                  <div
                    className="rounded-lg border bg-white px-3 py-2 text-center shadow-sm transition hover:shadow-card"
                    style={{ borderColor: `${color}33` }}
                  >
                    <div className="truncate text-xs font-semibold" style={{ color }}>
                      {n.label}
                    </div>
                    {n.sublabel && <div className="truncate text-[11px] text-ink-500">{n.sublabel}</div>}
                  </div>
                );
                return (
                  <div key={n.id}>
                    {n.href ? (
                      <Link href={n.href}>{content}</Link>
                    ) : (
                      content
                    )}
                  </div>
                );
              })}
              {col.nodes.length === 0 && (
                <div className="rounded-lg border border-dashed border-base-border px-3 py-2 text-center text-[11px] text-ink-400">
                  —
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
