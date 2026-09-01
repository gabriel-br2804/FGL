import Link from "next/link";

export const metadata = { title: "Como funciona — Fiscaliza" };

const PIPELINE = [
  {
    title: "1. Conectores coletam dados",
    text: "Cada fonte pública (Portal da Transparência, Compras.gov.br, TCEs, portais estaduais e municipais) tem um conector dedicado que normaliza os dados para o formato interno do Fiscaliza.",
  },
  {
    title: "2. Ingestão e cruzamento",
    text: "Contratos, licitações, aditivos, pagamentos e empresas são relacionados entre si — o mesmo fornecedor aparece de forma consistente em diferentes municípios e órgãos.",
  },
  {
    title: "3. Fiscaliza Intelligence Engine",
    text: "Módulos estatísticos comparam cada contrato com sua categoria, histórico e municípios semelhantes, calculando o Fiscaliza Score de forma transparente e auditável.",
  },
  {
    title: "4. Apresentação responsável",
    text: "Cada ponto de atenção é sempre apresentado como dado + análise + interpretação cautelosa, nunca como acusação.",
  },
];

export default function ComoFuncionaPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <span className="section-label">Como funciona</span>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
        Da planilha pública ao ponto de atenção
      </h1>
      <p className="mt-4 max-w-2xl text-ink-700">
        O Fiscaliza pega dados públicos, cruza informações e encontra padrões que podem merecer atenção — em quatro
        etapas.
      </p>

      <div className="mt-12 space-y-8">
        {PIPELINE.map((step, i) => (
          <div key={step.title} className="flex gap-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-white">
              {i + 1}
            </span>
            <div className="border-b border-base-border pb-8">
              <h2 className="font-bold text-navy-900">{step.title}</h2>
              <p className="mt-1.5 max-w-xl text-sm text-ink-700">{step.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-lg font-bold text-navy-900">Fiscaliza Intelligence Engine</h2>
          <p className="mt-2 text-sm text-ink-700">Módulos independentes de análise:</p>
          <ul className="mt-3 space-y-1.5 text-sm text-ink-700">
            <li>• Estatística e detecção de outliers</li>
            <li>• Comparação histórica e regional</li>
            <li>• Análise de concentração de fornecedores</li>
            <li>• Análise de redes (empresas, sócios, órgãos)</li>
            <li>• Classificação de risco (Fiscaliza Score)</li>
          </ul>
        </div>
        <div className="card p-6">
          <h2 className="text-lg font-bold text-navy-900">Fiscaliza IA</h2>
          <p className="mt-2 text-sm text-ink-700">
            A IA é usada para <strong>explicar</strong> os dados já calculados pelo motor de análise — nunca para
            inventar conclusões. Toda resposta cita a fonte consultada e permite aprofundamento.
          </p>
          <Link href="/ia" className="btn-secondary mt-4 inline-flex">
            Experimentar a Fiscaliza IA
          </Link>
        </div>
      </div>

      <div className="mt-10 rounded-xl2 border border-signal-blue/20 bg-signal-blue/5 p-6 text-sm text-ink-700">
        Os indicadores apresentados pelo Fiscaliza são análises automatizadas baseadas em dados públicos e não
        constituem acusação, prova de irregularidade ou conclusão sobre responsabilidade civil ou criminal.
      </div>
    </div>
  );
}
