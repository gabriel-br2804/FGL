import Link from "next/link";
import { FACTOR_DEFINITIONS } from "@/lib/engine/score";
import { getTopCompaniesByScore } from "@/lib/data";
import { ScoreFactorList } from "@/components/ScoreFactorList";
import type { FiscalizaScoreBreakdown } from "@/lib/types";

export const metadata = { title: "Metodologia — Como calculamos o Fiscaliza Score" };

const EXAMPLE_BREAKDOWN: FiscalizaScoreBreakdown = {
  targetType: "company",
  targetId: "exemplo",
  total: 82,
  computedAt: "2026-08-31T00:00:00-03:00",
  factors: [
    { key: "preco_fora_padrao", label: "Preço fora do padrão", points: 25, maxPoints: 25 },
    { key: "baixa_concorrencia", label: "Baixa concorrência", points: 15, maxPoints: 15 },
    { key: "aditivos_elevados", label: "Aditivos elevados", points: 20, maxPoints: 20 },
    { key: "concentracao_fornecedores", label: "Fornecedor concentrado", points: 10, maxPoints: 10 },
    { key: "crescimento_anormal", label: "Crescimento anormal", points: 12, maxPoints: 12 },
    { key: "empresa_recente", label: "Empresa recém-criada com contratos elevados", points: 0, maxPoints: 18 },
  ],
};

const RISK_LEVELS = [
  { range: "0–20", label: "Baixa atenção", color: "text-signal-green" },
  { range: "21–40", label: "Normal", color: "text-ink-500" },
  { range: "41–60", label: "Atenção", color: "text-signal-amber" },
  { range: "61–80", label: "Alta atenção", color: "text-[#B75A00]" },
  { range: "81–100", label: "Atenção crítica", color: "text-signal-red" },
];

export default function MetodologiaPage() {
  const example = getTopCompaniesByScore(1)[0];

  return (
    <div className="container-page py-10 sm:py-14">
      <span className="section-label">Metodologia</span>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
        Como calculamos o Fiscaliza Score
      </h1>
      <p className="mt-4 max-w-2xl text-ink-700">
        O <strong>Fiscaliza Score</strong> vai de 0 a 100 e representa exclusivamente o grau de anomalia estatística
        encontrado nos dados públicos disponíveis. Ele <strong>não representa crime ou corrupção</strong> — é um
        indicador de onde olhar com mais atenção, não uma conclusão.
      </p>

      <div className="mt-10 grid gap-3 sm:grid-cols-5">
        {RISK_LEVELS.map((l) => (
          <div key={l.range} className="card p-4 text-center">
            <div className="text-xs text-ink-500">{l.range}</div>
            <div className={`mt-1 text-sm font-bold ${l.color}`}>{l.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-bold text-navy-900">Os seis fatores do score</h2>
          <p className="mt-2 text-sm text-ink-700">
            Cada fator soma pontos a partir de comparações estatísticas objetivas. A soma é limitada a 100 pontos.
          </p>
          <div className="mt-6 space-y-5">
            {FACTOR_DEFINITIONS.map((f) => (
              <div key={f.key} className="border-l-2 border-navy-900/15 pl-4">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold text-ink-900">{f.label}</span>
                  <span className="text-sm font-bold text-navy-900">até {f.maxPoints} pts</span>
                </div>
                <p className="mt-1 text-sm text-ink-700">{f.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-navy-900">Exemplo de cálculo</h2>
          <p className="mt-2 text-sm text-ink-700">
            Clique em cada fator para ver sua descrição. Este exemplo é ilustrativo — para um cálculo real, veja{" "}
            {example && (
              <Link href={`/empresas/${example.id}`} className="text-signal-blue hover:underline">
                a página de {example.name}
              </Link>
            )}
            .
          </p>
          <div className="mt-6">
            <ScoreFactorList breakdown={EXAMPLE_BREAKDOWN} />
          </div>
        </div>
      </div>

      <div className="mt-16 card p-6">
        <h2 className="text-lg font-bold text-navy-900">Separação entre dado, análise e interpretação</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl2 bg-ink-900/[0.03] p-4">
            <div className="data-label">Dado</div>
            <p className="mt-1 text-sm text-ink-900">“O contrato foi de R$ 3 milhões.”</p>
          </div>
          <div className="rounded-xl2 bg-signal-amberBg p-4">
            <div className="data-label text-signal-amber">Análise</div>
            <p className="mt-1 text-sm text-ink-900">“O valor está 42% acima da mediana de contratos semelhantes.”</p>
          </div>
          <div className="rounded-xl2 bg-navy-900 p-4 text-white">
            <div className="data-label text-white/70">Interpretação</div>
            <p className="mt-1 text-sm">“Esse padrão merece análise adicional.”</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-ink-700">
          O Fiscaliza nunca transforma automaticamente uma anomalia estatística em “existe corrupção”. Essa conclusão
          cabe exclusivamente às autoridades competentes, após investigação própria.
        </p>
      </div>

      <div className="mt-10 rounded-xl2 border border-signal-blue/20 bg-signal-blue/5 p-6 text-sm text-ink-700">
        Os indicadores apresentados pelo Fiscaliza são análises automatizadas baseadas em dados públicos e não
        constituem acusação, prova de irregularidade ou conclusão sobre responsabilidade civil ou criminal. Situações
        classificadas como pontos de atenção devem ser verificadas nas fontes oficiais e, quando necessário, pelas
        autoridades competentes.
      </div>
    </div>
  );
}
