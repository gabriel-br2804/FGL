import { listDataSources } from "@/lib/data";
import { CONNECTOR_REGISTRY } from "@/lib/connectors";
import { fmtDate } from "@/lib/engine/format";

export const metadata = { title: "Fontes de dados — Fiscaliza" };

const ROADMAP = [
  "Tribunais de Contas estaduais (demais UFs, além de SP)",
  "Portais estaduais de transparência (demais estados)",
  "Novos portais municipais, priorizando plataformas compartilhadas por vários municípios",
  "PNCP — Portal Nacional de Contratações Públicas",
  "Cadastros de sanções (CEIS, CNEP, CEPIM)",
];

export default function FontesPage() {
  const sources = listDataSources();

  return (
    <div className="container-page py-10 sm:py-14">
      <span className="section-label">Fontes de dados</span>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
        De onde vêm os dados do Fiscaliza
      </h1>
      <p className="mt-4 max-w-2xl text-ink-700">
        O Fiscaliza é construído sobre uma arquitetura modular de conectores: cada fonte pública tem um conector
        dedicado, responsável por coletar e normalizar os dados no formato interno da plataforma. A prioridade é
        sempre API oficial → dataset aberto → scraping (último recurso).
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sources.map((s) => (
          <div key={s.id} className="card p-5">
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-ink-900">{s.name}</span>
              {s.simulated && <span className="badge shrink-0 bg-signal-amberBg text-signal-amber">Simulado no MVP</span>}
            </div>
            <div className="mt-2 font-mono text-xs text-ink-500">{s.connector}</div>
            {s.url && (
              <div className="mt-1 truncate text-xs text-ink-400">{s.url}</div>
            )}
            <div className="mt-3 text-xs text-ink-500">Última sincronização: {fmtDate(s.lastSync)}</div>
          </div>
        ))}
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-bold text-navy-900">Arquitetura de conectores</h2>
          <p className="mt-2 text-sm text-ink-700">
            Cada conector implementa a mesma interface (<code className="font-mono text-xs">DataConnector</code>),
            isolando as particularidades de formato, paginação e autenticação de cada fonte. O motor de análise e as
            páginas do Fiscaliza nunca acessam a fonte original diretamente.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-ink-700">
            {CONNECTOR_REGISTRY.map((c) => (
              <li key={c.id} className="flex gap-2">
                <span className="font-mono text-xs text-signal-blue">{c.id}</span>
                <span className="text-ink-500">— {c.description}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-bold text-navy-900">Próximos conectores (roadmap)</h2>
          <p className="mt-2 text-sm text-ink-700">
            O MVP cobre uma fonte federal, uma fonte estadual (São Paulo) e uma fonte municipal (Jandira/SP), com a
            arquitetura pronta para expansão contínua.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-ink-700">
            {ROADMAP.map((r) => (
              <li key={r} className="flex gap-2">
                <span className="text-signal-blue">•</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-14 rounded-xl2 border border-signal-amber/30 bg-signal-amberBg p-6 text-sm text-ink-900">
        <strong>Aviso sobre o estágio atual:</strong> os valores de contratos, empresas, obras e municípios exibidos
        nesta versão são <strong>simulados</strong> para demonstrar a plataforma enquanto os conectores de produção
        são integrados às APIs e datasets oficiais listados acima. Nenhum dado aqui deve ser tratado como informação
        oficial.
      </div>
    </div>
  );
}
