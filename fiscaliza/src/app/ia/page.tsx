import { ChatClient } from "./ChatClient";

export const metadata = { title: "Fiscaliza IA" };

export default function IAPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <span className="section-label">Fiscaliza IA</span>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
        Pergunte sobre gastos públicos
      </h1>
      <p className="mt-3 max-w-2xl text-ink-700">
        A Fiscaliza IA pesquisa os dados disponíveis, cruza informações e explica os resultados — sempre com fontes.
        Toda afirmação apresentada é baseada em dados da base do Fiscaliza, nunca inventada.
      </p>

      <div className="mt-8">
        <ChatClient />
      </div>
    </div>
  );
}
