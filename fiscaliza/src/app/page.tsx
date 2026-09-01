import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { StatCard } from "@/components/StatCard";
import { ScoreBadge } from "@/components/ScoreBadge";
import { getDashboardStats, getMunicipalityRanking } from "@/lib/data";
import { fmtBRLCompact, fmtDate, fmtNumber } from "@/lib/engine/format";

const EXAMPLES = ["Prefeitura de Jandira", "Construtora Nova Aurora", "Contrato 123/2026", "Obras públicas em São Paulo"];

const STEPS = [
  {
    title: "Coletamos",
    text: "Conectamos dados públicos de portais de transparência, Compras.gov.br, TCEs e portais estaduais e municipais.",
  },
  {
    title: "Cruzamos",
    text: "O Fiscaliza Intelligence Engine compara contratos, fornecedores, aditivos e licitações entre si e ao longo do tempo.",
  },
  {
    title: "Explicamos",
    text: "Cada ponto de atenção é apresentado com dado, análise estatística e interpretação cautelosa — sempre com fonte.",
  },
];

export default function HomePage() {
  const stats = getDashboardStats();
  const ranking = getMunicipalityRanking(5);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-base-border bg-navy-950 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(29,95,214,0.35),transparent_45%),radial-gradient(circle_at_85%_10%,rgba(15,157,109,0.25),transparent_40%)]" />
        <div className="container-page relative py-20 sm:py-28">
          <span className="section-label text-signal-blue">Inteligência sobre gastos públicos</span>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">
            O dinheiro público deixa rastros.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/70">
            Conectamos dados públicos para mostrar onde o dinheiro está sendo gasto, quais padrões merecem atenção e
            onde existem sinais fora do comum.
          </p>

          <div className="mt-9 max-w-2xl">
            <SearchBar />
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/50">
              <span>Experimente:</span>
              {EXAMPLES.map((e) => (
                <Link key={e} href={`/busca?q=${encodeURIComponent(e)}`} className="underline decoration-white/30 underline-offset-2 hover:text-white">
                  {e}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/dashboard" className="btn-primary bg-white text-navy-900 hover:bg-white/90">
              Explorar dados
            </Link>
            <Link href="/como-funciona" className="btn-secondary border-white/25 bg-transparent text-white hover:border-white/60">
              Como funciona
            </Link>
          </div>

          <p className="mt-6 text-xs text-white/40">
            “Seu dinheiro. Nossa lupa.” — dados atualizados em {fmtDate(stats.lastUpdate + "T00:00:00")}.
          </p>
        </div>
      </section>

      <section className="container-page -mt-10 relative z-10 pb-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard value={fmtBRLCompact(stats.totalAnalyzed)} label="em gastos analisados" />
          <StatCard value={fmtNumber(stats.totalContracts)} label="contratos mapeados" />
          <StatCard value={fmtNumber(stats.totalSuppliers)} label="fornecedores" />
          <StatCard value={fmtNumber(stats.totalAttentionPoints)} label="pontos de atenção identificados" accent="amber" />
          <StatCard value={fmtNumber(stats.totalAgencies)} label="órgãos monitorados" />
        </div>
      </section>

      <section className="container-page py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="section-label">Como o Fiscaliza pensa</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
              Dado, análise e interpretação — sempre separados.
            </h2>
            <p className="mt-4 text-ink-700">
              O Fiscaliza nunca transforma automaticamente um desvio estatístico em acusação. Separamos o que é fato,
              o que é comparação estatística e o que é uma leitura cautelosa que ainda precisa de verificação humana.
            </p>
            <ol className="mt-8 space-y-6">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-semibold text-ink-900">{s.title}</div>
                    <p className="mt-1 text-sm text-ink-700">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="data-label">Exemplo — ponto de atenção</span>
              <ScoreBadge score={72} size="sm" />
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <div className="data-label text-ink-400">Dado</div>
                <p className="text-ink-900">Contrato de R$ 2.400.000 firmado com uma construtora para pavimentação.</p>
              </div>
              <div>
                <div className="data-label text-ink-400">Análise</div>
                <p className="text-ink-700">Mediana encontrada para contratos semelhantes: R$ 1.500.000 (+60%).</p>
              </div>
              <div>
                <div className="data-label text-ink-400">Interpretação</div>
                <p className="text-ink-700">
                  Ponto de atenção: esse padrão merece análise adicional. Não representa, isoladamente, prova de
                  irregularidade.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-base-border bg-white py-16 sm:py-24">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="section-label">Ranking</span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-navy-900">
                Municípios com mais pontos de atenção
              </h2>
            </div>
            <Link href="/mapa" className="btn-secondary">
              Ver mapa completo
            </Link>
          </div>

          <div className="mt-8 overflow-hidden rounded-xl2 border border-base-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-base-border bg-ink-900/[0.02] text-left">
                  <th className="data-label px-4 py-3">Município</th>
                  <th className="data-label px-4 py-3">Estado</th>
                  <th className="data-label px-4 py-3 text-right">Valor analisado</th>
                  <th className="data-label px-4 py-3 text-right">Pontos de atenção</th>
                  <th className="data-label px-4 py-3 text-right">Score de risco</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((m) => (
                  <tr key={m.id} className="border-b border-base-border last:border-0 hover:bg-ink-900/[0.015]">
                    <td className="px-4 py-3">
                      <Link href={`/municipios/${m.id}`} className="font-medium text-ink-900 hover:text-signal-blue">
                        {m.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-500">{m.stateId}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fmtBRLCompact(m.totalSpent)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{m.attentionPoints}</td>
                    <td className="px-4 py-3 text-right">
                      <ScoreBadge score={m.fiscalizaScore} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="container-page py-16 text-center sm:py-24">
        <span className="section-label justify-center">Fiscaliza IA</span>
        <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
          Pergunte sobre gastos públicos em linguagem natural.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-ink-700">
          “Quanto a Prefeitura X gastou com empresas de limpeza em 2025?” A Fiscaliza IA pesquisa os dados, cruza
          informações e responde sempre com fontes verificáveis.
        </p>
        <Link href="/ia" className="btn-primary mt-8 inline-flex">
          Conversar com a Fiscaliza IA
        </Link>
      </section>
    </div>
  );
}
