import { listStateAggregates, getUniaoAggregate } from "@/lib/data";
import { MapExplorer } from "@/components/map/MapExplorer";

export const metadata = { title: "Mapa do Brasil — Fiscaliza" };

export default function MapaPage() {
  const stateAggregates = listStateAggregates();
  const uniao = getUniaoAggregate();

  return (
    <div className="container-page py-10 sm:py-14">
      <span className="section-label">Mapa do Brasil</span>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
        Onde o dinheiro público está indo?
      </h1>
      <p className="mt-3 max-w-2xl text-ink-700">
        Selecione a esfera (União, Estado ou Município) e clique em uma unidade para ver gastos, contratos,
        licitações, obras, fornecedores e pontos de atenção.
      </p>

      <div className="mt-10">
        <MapExplorer stateAggregates={stateAggregates} uniao={uniao} />
      </div>
    </div>
  );
}
