/**
 * Impostômetro em tempo real — incorpora o widget oficial do site
 * impostometro.com.br (Associação Comercial de São Paulo / IBPT), que
 * mostra a arrecadação de impostos no Brasil estimada em tempo real.
 *
 * É um iframe para o site oficial, não um valor calculado pelo Fiscaliza:
 * os dados e a metodologia de extrapolação são inteiramente do
 * IBPT/ACSP. Se o site não permitir ser incorporado (alguns navegadores
 * podem bloquear silenciosamente), o link abaixo do quadro sempre funciona
 * como alternativa.
 */
export function ImpostometroCard() {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-base-border p-5">
        <div>
          <span className="data-label">Fonte externa · impostometro.com.br</span>
          <h2 className="text-lg font-bold text-navy-900">Impostômetro Brasil</h2>
        </div>
        <a
          href="https://impostometro.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-signal-blue hover:underline"
        >
          Abrir em nova aba ↗
        </a>
      </div>
      <div className="bg-navy-950">
        <iframe
          src="https://impostometro.com.br"
          title="Impostômetro Brasil — arrecadação de impostos em tempo real (ACSP/IBPT)"
          loading="lazy"
          className="h-[420px] w-full border-0"
        />
      </div>
      <div className="p-4 text-xs text-ink-500">
        Contador mantido pela Associação Comercial de São Paulo (ACSP) com metodologia do IBPT — é uma estimativa
        extrapolada, não uma medição em tempo real da arrecadação. Não é calculado pelo Fiscaliza. Se o quadro acima
        não carregar, use o link "Abrir em nova aba".
      </div>
    </div>
  );
}
