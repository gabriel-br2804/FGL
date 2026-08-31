import { AlertsClient } from "./AlertsClient";

export const metadata = { title: "Alertas — Fiscaliza" };

const ALERT_TYPES = [
  "Novo contrato identificado.",
  "Valor contratado aumentou.",
  "Novo aditivo publicado.",
  "Novo pagamento registrado.",
  "Novo ponto de atenção identificado.",
];

export default function AlertasPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <span className="section-label">Alertas</span>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
        Acompanhe o que importa para você
      </h1>
      <p className="mt-4 max-w-2xl text-ink-700">
        Use o botão <strong>Monitorar</strong> em qualquer página de município, empresa, contrato ou obra para
        acompanhá-los aqui. Quando novos dados forem publicados pelas fontes conectadas, o Fiscaliza poderá notificar
        você sobre:
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {ALERT_TYPES.map((t) => (
          <li key={t} className="badge bg-ink-900/5 text-ink-700">
            {t}
          </li>
        ))}
      </ul>

      <div className="mt-10">
        <AlertsClient />
      </div>

      <div className="mt-10 rounded-xl2 border border-signal-blue/20 bg-signal-blue/5 p-5 text-xs text-ink-700">
        Nesta versão MVP, os itens monitorados ficam salvos apenas no seu navegador (armazenamento local) e a
        verificação de novidades ainda não roda em segundo plano — a camada de notificações em tempo real depende da
        integração com filas e workers de ingestão descrita em{" "}
        <a href="/como-funciona" className="text-signal-blue hover:underline">
          Como funciona
        </a>
        .
      </div>
    </div>
  );
}
