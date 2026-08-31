import Link from "next/link";

export const metadata = { title: "Sobre — Fiscaliza" };

export default function SobrePage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <span className="section-label">Sobre</span>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
        Seu dinheiro. Nossa lupa.
      </h1>
      <div className="mt-6 max-w-2xl space-y-4 text-ink-700">
        <p>
          O Fiscaliza é uma plataforma brasileira de inteligência sobre gastos públicos. Nossa proposta é transformar
          dados públicos de transparência governamental em informações simples, visuais e úteis para cidadãos,
          jornalistas, pesquisadores e órgãos de controle.
        </p>
        <p>
          Cruzamos dados públicos de diferentes fontes governamentais e utilizamos estatística e inteligência
          artificial para identificar anomalias, padrões incomuns, riscos e situações que merecem investigação — sem
          jamais transformar isso, automaticamente, em acusação.
        </p>
        <p>
          Acreditamos que dados públicos só cumprem seu papel quando são acessíveis. O Fiscaliza existe para reduzir
          a distância entre uma planilha de contratos e uma pergunta que qualquer cidadão possa entender: para onde
          foi esse dinheiro?
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        <div className="card p-6">
          <h2 className="font-bold text-navy-900">O que somos</h2>
          <p className="mt-2 text-sm text-ink-700">
            Uma camada de inteligência sobre dados que já são públicos — não substituímos órgãos de controle, nós os
            apoiamos e ajudamos a sociedade a fiscalizar junto.
          </p>
        </div>
        <div className="card p-6">
          <h2 className="font-bold text-navy-900">O que não somos</h2>
          <p className="mt-2 text-sm text-ink-700">
            Não somos um tribunal. Não acusamos pessoas ou empresas de corrupção. Pontos de atenção são convites à
            verificação, não veredictos.
          </p>
        </div>
        <div className="card p-6">
          <h2 className="font-bold text-navy-900">Para quem</h2>
          <p className="mt-2 text-sm text-ink-700">
            Cidadãos, jornalistas de dados, pesquisadores, controladorias internas, tribunais de contas e o próprio
            poder público.
          </p>
        </div>
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/como-funciona" className="btn-secondary">
          Como funciona
        </Link>
        <Link href="/metodologia" className="btn-secondary">
          Metodologia
        </Link>
        <Link href="/fontes" className="btn-secondary">
          Fontes de dados
        </Link>
      </div>
    </div>
  );
}
