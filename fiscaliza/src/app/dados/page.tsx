import { getDashboardStats } from "@/lib/data";
import { fmtBRLCompact, fmtNumber } from "@/lib/engine/format";

export const metadata = { title: "Dados — Fiscaliza" };

const ENTITIES = [
  { name: "Municipality", desc: "Município: população, orçamento, gastos por área e histórico." },
  { name: "State / GovernmentEntity", desc: "Estado e entes públicos (União, Estados, Municípios)." },
  { name: "Agency", desc: "Órgãos e secretarias contratantes." },
  { name: "Company / Person", desc: "Empresas fornecedoras e seus sócios." },
  { name: "Bid", desc: "Licitações: modalidade, participantes, propostas, valores." },
  { name: "Contract / Amendment / Payment", desc: "Contratos, termos aditivos e pagamentos." },
  { name: "Project", desc: "Obras públicas vinculadas a contratos." },
  { name: "RiskSignal / FiscalizaScore", desc: "Sinais de risco e pontuação calculada pelo motor de análise." },
  { name: "Sanction / PublicOfficial", desc: "Sanções e agentes públicos (estrutura pronta, integração futura)." },
  { name: "DataSource", desc: "Metadados de proveniência: qual conector originou cada dado." },
];

export default function DadosPage() {
  const stats = getDashboardStats();
  return (
    <div className="container-page py-10 sm:py-14">
      <span className="section-label">Dados</span>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">Sobre a base de dados</h1>
      <p className="mt-4 max-w-2xl text-ink-700">
        O modelo de dados do Fiscaliza foi desenhado para produção em PostgreSQL, com cache em Redis e filas para
        ingestão em larga escala. Nesta versão MVP, os dados abaixo são <strong>simulados</strong> para demonstrar a
        plataforma — ver <a href="/fontes" className="text-signal-blue hover:underline">Fontes de dados</a>.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card p-5">
          <div className="text-2xl font-extrabold text-navy-900">{fmtBRLCompact(stats.totalAnalyzed)}</div>
          <div className="text-xs text-ink-500">em gastos simulados</div>
        </div>
        <div className="card p-5">
          <div className="text-2xl font-extrabold text-navy-900">{fmtNumber(stats.totalContracts)}</div>
          <div className="text-xs text-ink-500">contratos simulados</div>
        </div>
        <div className="card p-5">
          <div className="text-2xl font-extrabold text-navy-900">{fmtNumber(stats.totalSuppliers)}</div>
          <div className="text-xs text-ink-500">fornecedores simulados</div>
        </div>
        <div className="card p-5">
          <div className="text-2xl font-extrabold text-navy-900">{fmtNumber(stats.totalAttentionPoints)}</div>
          <div className="text-xs text-ink-500">pontos de atenção simulados</div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold text-navy-900">Entidades do modelo de dados</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {ENTITIES.map((e) => (
            <div key={e.name} className="rounded-xl2 border border-base-border bg-white p-4">
              <div className="font-mono text-sm font-semibold text-navy-900">{e.name}</div>
              <p className="mt-1 text-sm text-ink-700">{e.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-ink-500">
          Ver esquema relacional completo em <code className="font-mono">prisma/schema.prisma</code> no repositório do
          projeto.
        </p>
      </div>

      <div className="mt-12 card p-6">
        <h2 className="text-lg font-bold text-navy-900">API pública (roadmap)</h2>
        <p className="mt-2 text-sm text-ink-700">
          Assim como o Portal da Transparência e o Compras.gov.br, o Fiscaliza pretende expor seus próprios dados
          tratados via API pública e exportações em CSV/JSON, para reuso por jornalistas, pesquisadores e
          desenvolvedores. Esta camada ainda não está disponível nesta versão MVP.
        </p>
      </div>
    </div>
  );
}
