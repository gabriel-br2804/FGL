import { listDataSources, getRealDataStatus } from "@/lib/data";
import { CONNECTOR_REGISTRY } from "@/lib/connectors";
import { fmtDate } from "@/lib/engine/format";

export const metadata = { title: "Fontes de dados — Fiscaliza" };

const ROADMAP = [
  "Tribunais de Contas estaduais (demais UFs, além de SP) — sanções e julgamento de contas",
  "Cobertura de PNCP para todos os ~5.570 municípios (hoje: os maiores por população)",
  "Detalhamento de aditivos e pagamentos por contrato via PNCP (endpoint de atualizações)",
  "Quadro societário (sócios) de empresas via Receita Federal/CNPJ",
  "Cadastros de sanções (CEIS, CNEP, CEPIM)",
];

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`badge ${ok ? "bg-signal-greenBg text-signal-green" : "bg-ink-900/5 text-ink-500"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-signal-green" : "bg-ink-400"}`} />
      {label}
    </span>
  );
}

export default function FontesPage() {
  const sources = listDataSources();
  const real = getRealDataStatus();
  const anyRealDataRun = real.ibge.ok || real.pncp.ok || real.portalTransparencia.ok;

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

      <div className="mt-8 card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-navy-900">Status da ingestão real</h2>
          {real.generatedAt && (
            <span className="text-xs text-ink-500">Última execução: {fmtDate(real.generatedAt)}</span>
          )}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <StatusPill ok={real.ibge.ok} label={real.ibge.ok ? "IBGE conectado" : "IBGE não executado"} />
            <p className="mt-2 text-xs text-ink-500">
              {real.ibge.ok
                ? `${real.ibge.municipalitiesFetched} municípios e ${real.ibge.statesFetched} estados com dados reais de geografia/população.`
                : "Geografia e população ainda são estimativas aproximadas do MVP."}
            </p>
          </div>
          <div>
            <StatusPill ok={real.pncp.ok} label={real.pncp.ok ? "PNCP conectado" : "PNCP não executado"} />
            <p className="mt-2 text-xs text-ink-500">
              {real.pncp.ok
                ? `${real.pncp.recordsFetched} contrato(s) reais coletados de ${real.pncp.entitiesQueried} entidade(s) (municípios, estados e União).`
                : "Contratos, fornecedores e valores ainda são simulados."}
            </p>
          </div>
          <div>
            <StatusPill
              ok={real.portalTransparencia.ok}
              label={real.portalTransparencia.ok ? "Portal da Transparência conectado" : "Portal da Transparência não executado"}
            />
            <p className="mt-2 text-xs text-ink-500">
              {real.portalTransparencia.ok
                ? `${real.portalTransparencia.contractsFetched} contrato(s) federais reais coletados.`
                : real.portalTransparencia.reason === "missing_api_key"
                ? "Requer uma chave de API gratuita (ver instruções abaixo)."
                : "Ainda não executado nesta base."}
            </p>
          </div>
        </div>
        {!anyRealDataRun && (
          <div className="mt-5 rounded-xl2 bg-ink-900/[0.03] p-4 text-xs text-ink-700">
            Nenhuma ingestão real foi executada ainda nesta instância. Rode{" "}
            <code className="font-mono">npm run ingest</code> localmente (ou no seu CI) para trazer municípios,
            população, contratos e licitações reais do IBGE e do PNCP — a sessão que gerou este app não tem acesso à
            internet para fazer isso automaticamente. Detalhes em{" "}
            <code className="font-mono">scripts/ingest/</code> e no README do projeto.
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sources.map((s) => (
          <div key={s.id} className="card p-5">
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-ink-900">{s.name}</span>
              {s.simulated ? (
                <span className="badge shrink-0 bg-signal-amberBg text-signal-amber">Simulado no MVP</span>
              ) : (
                <span className="badge shrink-0 bg-signal-greenBg text-signal-green">Real</span>
              )}
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
          <p className="mt-4 text-sm text-ink-700">
            Em paralelo aos conectores, o pipeline de ingestão real (<code className="font-mono text-xs">npm run ingest</code>)
            usa a API de Localidades/Agregados do <strong>IBGE</strong> e a API de Consulta do <strong>PNCP</strong>{" "}
            — a única fonte que cobre município, estado e União no mesmo formato desde a Lei 14.133/2021 — para
            popular municípios, população e contratos reais.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-navy-900">Próximos passos (roadmap)</h2>
          <p className="mt-2 text-sm text-ink-700">
            O pipeline real cobre hoje os maiores municípios por população, todos os 27 estados e uma amostra da
            União. A arquitetura já suporta ampliar essa cobertura sem mudar telas.
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
        <strong>Aviso sobre o estágio atual:</strong> onde a ingestão real não foi executada (ou não cobre uma
        determinada entidade), os valores de contratos, empresas, obras e municípios exibidos continuam{" "}
        <strong>simulados</strong> para demonstrar a plataforma. Cada página indica com um selo se está mostrando
        dado real ou simulado. Nenhum dado simulado deve ser tratado como informação oficial.
      </div>
    </div>
  );
}
